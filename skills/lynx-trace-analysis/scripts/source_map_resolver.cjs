const { readFile } = require('fs/promises');
const path = require('path');
const { fileURLToPath } = require('url');

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_CHAR_TO_INT = new Map(
  Array.from(BASE64_CHARS, (char, index) => [char, index]),
);
const sourceMapCache = new Map();
const debugInfoCache = new Map();

function parseUrl(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function getBaseDirectory(sourceMapPathOrUrl) {
  const parsedUrl = parseUrl(sourceMapPathOrUrl);
  if (parsedUrl) {
    if (parsedUrl.protocol === 'file:') {
      return path.dirname(fileURLToPath(parsedUrl));
    }

    if (parsedUrl.protocol === 'data:') {
      return process.cwd();
    }

    return new URL('./', parsedUrl).href;
  }

  return path.dirname(path.resolve(sourceMapPathOrUrl));
}

function resolvePathOrUrl(base, reference) {
  const parsedReferenceUrl = parseUrl(reference);
  if (parsedReferenceUrl) {
    return parsedReferenceUrl.href;
  }

  if (typeof base === 'string' && parseUrl(base)) {
    return new URL(reference, ensureTrailingSlash(base)).href;
  }

  if (path.isAbsolute(reference)) {
    return path.normalize(reference);
  }

  return path.resolve(base, reference);
}

function resolveSourceFileName(sourceMapPathOrUrl, sourceRoot, source) {
  const baseDirectory = getBaseDirectory(sourceMapPathOrUrl);
  const resolvedBase = sourceRoot
    ? resolvePathOrUrl(baseDirectory, sourceRoot)
    : baseDirectory;

  return resolvePathOrUrl(resolvedBase, source);
}

function decodeVlq(segment, state) {
  let result = 0;
  let shift = 0;
  let hasContinuation = true;

  while (hasContinuation) {
    if (state.index >= segment.length) {
      throw new Error('Invalid VLQ segment in source map');
    }

    const digit = BASE64_CHAR_TO_INT.get(segment[state.index]);
    if (digit === undefined) {
      throw new Error(`Invalid base64 digit "${segment[state.index]}" in source map`);
    }

    state.index += 1;
    hasContinuation = (digit & 32) === 32;
    result += (digit & 31) << shift;
    shift += 5;
  }

  const shouldNegate = (result & 1) === 1;
  result >>= 1;
  return shouldNegate ? -result : result;
}

function decodeMappings(mappings) {
  if (!mappings) {
    return [];
  }

  const lines = [];
  let previousSource = 0;
  let previousOriginalLine = 0;
  let previousOriginalColumn = 0;
  let previousName = 0;

  for (const lineText of mappings.split(';')) {
    const segments = [];
    let previousGeneratedColumn = 0;

    if (lineText.length > 0) {
      for (const segmentText of lineText.split(',')) {
        if (!segmentText) {
          continue;
        }

        const state = { index: 0 };
        const generatedColumnDelta = decodeVlq(segmentText, state);
        previousGeneratedColumn += generatedColumnDelta;

        if (state.index === segmentText.length) {
          segments.push({
            generatedColumn: previousGeneratedColumn,
            sourceIndex: null,
            originalLine: null,
            originalColumn: null,
            nameIndex: null,
          });
          continue;
        }

        previousSource += decodeVlq(segmentText, state);
        previousOriginalLine += decodeVlq(segmentText, state);
        previousOriginalColumn += decodeVlq(segmentText, state);

        let nameIndex = null;
        if (state.index < segmentText.length) {
          previousName += decodeVlq(segmentText, state);
          nameIndex = previousName;
        }

        if (state.index !== segmentText.length) {
          throw new Error('Invalid mapping segment length in source map');
        }

        segments.push({
          generatedColumn: previousGeneratedColumn,
          sourceIndex: previousSource,
          originalLine: previousOriginalLine,
          originalColumn: previousOriginalColumn,
          nameIndex,
        });
      }
    }

    lines.push(segments);
  }

  return lines;
}

function buildLineMappings(sourceMap, sourceMapPathOrUrl) {
  if (!sourceMap || typeof sourceMap !== 'object') {
    throw new Error('Invalid source map content');
  }

  if (Array.isArray(sourceMap.sections)) {
    const mergedLines = [];

    for (const section of sourceMap.sections) {
      if (!section?.map || !section?.offset) {
        throw new Error('Invalid indexed source map section');
      }

      const childLines = buildLineMappings(section.map, sourceMapPathOrUrl);
      const lineOffset = Number(section.offset.line) || 0;
      const columnOffset = Number(section.offset.column) || 0;

      for (let childLineIndex = 0; childLineIndex < childLines.length; childLineIndex += 1) {
        const childSegments = childLines[childLineIndex];
        if (!childSegments || childSegments.length === 0) {
          continue;
        }

        const targetLineIndex = lineOffset + childLineIndex;
        const adjustedSegments = childSegments.map((segment) => ({
          ...segment,
          generatedColumn:
            segment.generatedColumn + (childLineIndex === 0 ? columnOffset : 0),
        }));

        if (!mergedLines[targetLineIndex]) {
          mergedLines[targetLineIndex] = [];
        }

        mergedLines[targetLineIndex].push(...adjustedSegments);
      }
    }

    for (const segments of mergedLines) {
      if (segments) {
        segments.sort((left, right) => left.generatedColumn - right.generatedColumn);
      }
    }

    return mergedLines;
  }

  const decodedLines = decodeMappings(sourceMap.mappings || '');
  const sourceNames = Array.isArray(sourceMap.sources)
    ? sourceMap.sources.map((source) =>
      resolveSourceFileName(sourceMapPathOrUrl, sourceMap.sourceRoot, source),
    )
    : [];

  return decodedLines.map((segments) =>
    segments.map((segment) => ({
      generatedColumn: segment.generatedColumn,
      fileName:
        segment.sourceIndex === null ? null : sourceNames[segment.sourceIndex] ?? null,
      originalLine: segment.originalLine,
      originalColumn: segment.originalColumn,
      name:
        segment.nameIndex === null
          ? undefined
          : sourceMap.names?.[segment.nameIndex] ?? undefined,
    })),
  );
}

function normalizeColumnBase(columnBase) {
  if (columnBase === 0 || columnBase === 1) {
    return columnBase;
  }

  throw new Error('columnBase must be 0 or 1');
}

function normalizeGeneratedPosition(line, column, columnBase) {
  if (!Number.isInteger(line) || line < 1) {
    throw new Error('line must be a positive integer');
  }

  const normalizedColumnBase = normalizeColumnBase(columnBase);
  const minimumColumn = normalizedColumnBase === 1 ? 1 : 0;
  if (!Number.isInteger(column) || column < minimumColumn) {
    throw new Error(
      `column must be an integer greater than or equal to ${minimumColumn}`,
    );
  }

  return {
    lineIndex: line,
    columnIndex: normalizedColumnBase === 1 ? column - 1 : column,
  };
}

function normalizeDebugInfoPosition(lineNumber, columnNumber) {
  if (!Number.isInteger(lineNumber) || lineNumber < 0) {
    throw new Error('line must be an integer greater than or equal to 0 for debug-info remapping');
  }

  if (!Number.isInteger(columnNumber) || columnNumber < 0) {
    throw new Error('column must be an integer greater than or equal to 0 for debug-info remapping');
  }

  return {
    functionId: lineNumber + 1,
    pcIndex: columnNumber,
  };
}

function findClosestSegment(segments, columnIndex) {
  if (!segments || segments.length === 0) {
    return null;
  }

  let left = 0;
  let right = segments.length - 1;
  let bestMatch = null;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const segment = segments[middle];

    if (segment.generatedColumn <= columnIndex) {
      bestMatch = segment;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return bestMatch;
}

function toResolvedPosition(segment, columnBase) {
  if (!segment || !segment.fileName) {
    return null;
  }

  return {
    fileName: segment.fileName,
    line: segment.originalLine + 1,
    column: segment.originalColumn + normalizeColumnBase(columnBase),
    name: segment.name,
  };
}

function buildCompiledSourceMap(sourceMap, sourceMapPathOrUrl = process.cwd()) {
  return {
    version: sourceMap.version,
    sourceMapPathOrUrl,
    lines: buildLineMappings(sourceMap, sourceMapPathOrUrl),
  };
}

async function readTextFromPathOrUrl(pathOrUrl, label) {
  const parsedUrl = parseUrl(pathOrUrl);
  if (!parsedUrl) {
    return readFile(path.resolve(pathOrUrl), 'utf8');
  }

  if (parsedUrl.protocol === 'file:') {
    return readFile(fileURLToPath(parsedUrl), 'utf8');
  }

  if (
    parsedUrl.protocol === 'http:' ||
    parsedUrl.protocol === 'https:' ||
    parsedUrl.protocol === 'data:'
  ) {
    const response = await fetch(parsedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${label}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  throw new Error(`Unsupported ${label} URL protocol: ${parsedUrl.protocol}`);
}

async function loadJson(pathOrUrl, label) {
  const jsonText = await readTextFromPathOrUrl(pathOrUrl, label);
  return JSON.parse(jsonText);
}

async function loadDebugInfo(debugInfoPathOrUrl) {
  if (debugInfoCache.has(debugInfoPathOrUrl)) {
    return debugInfoCache.get(debugInfoPathOrUrl);
  }

  const debugInfo = await loadJson(debugInfoPathOrUrl, 'debug info');
  debugInfoCache.set(debugInfoPathOrUrl, debugInfo);
  return debugInfo;
}



async function resolvePositionWithDebugInfo(options) {
  const { debugInfoPathOrUrl, line, column } = options;
  if (!debugInfoPathOrUrl) {
    throw new Error('debugInfoPathOrUrl is required');
  }

  const { functionId, pcIndex } = normalizeDebugInfoPosition(line, column);
  const debugInfo = await loadDebugInfo(debugInfoPathOrUrl);
  const functionInfo = debugInfo?.lepusNG_debug_info?.function_info?.find(
    (info) => info.function_id === functionId,
  );

  if (!functionInfo) {
    throw new Error(`Can not find the function_info with function_id: ${functionId}`);
  }

  const position = functionInfo.line_col?.[pcIndex];
  if (!position) {
    throw new Error(`Can not find the position with pc_index: ${pcIndex}`);
  }

  return {
    line: functionInfo.line_number,
    column: functionInfo.column_number,
  };
}

async function resolveTraceEventOriginalPosition(options) {
  const {
    sourceMapPathOrUrl,
    debugInfoPathOrUrl,
    line,
    column,
    columnBase = 0,
  } = options;
  // line is 0 base in trace, but sourcemap need 1 base
  let generatedPosition = { line, column };
  if (debugInfoPathOrUrl) {
    const debugInfoPosition = await resolvePositionWithDebugInfo({
      debugInfoPathOrUrl,
      line,
      column,
    });
    generatedPosition = {
      line: debugInfoPosition.line - 1,
      column: debugInfoPosition.column,
    };
  }

  return resolveOriginalPosition({
    sourceMapPathOrUrl,
    line: generatedPosition.line,
    column: generatedPosition.column,
    columnBase,
  });
}

async function loadSourceMap(sourceMapPathOrUrl) {
  if (sourceMapCache.has(sourceMapPathOrUrl)) {
    return sourceMapCache.get(sourceMapPathOrUrl);
  }

  const sourceMap = await loadJson(sourceMapPathOrUrl, 'source map');
  const compiledSourceMap = buildCompiledSourceMap(sourceMap, sourceMapPathOrUrl);
  sourceMapCache.set(sourceMapPathOrUrl, compiledSourceMap);
  return compiledSourceMap;
}

function resolveOriginalPositionInMap(compiledSourceMap, options) {
  const { line, column, columnBase = 0 } = options;
  const { lineIndex, columnIndex } = normalizeGeneratedPosition(
    line,
    column,
    columnBase,
  );
  const segments = compiledSourceMap.lines[lineIndex];
  const segment = findClosestSegment(segments, columnIndex);
  return toResolvedPosition(segment, columnBase);
}

async function resolveOriginalPosition(options) {
  const { sourceMapPathOrUrl, line, column, columnBase = 0 } = options;
  if (!sourceMapPathOrUrl) {
    throw new Error('sourceMapPathOrUrl is required');
  }

  const compiledSourceMap = await loadSourceMap(sourceMapPathOrUrl);
  return resolveOriginalPositionInMap(compiledSourceMap, {
    line,
    column,
    columnBase,
  });
}

function parseCommandLineArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextArgument = argv[index + 1];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (
      argument === '--map' ||
      argument === '--debug-info' ||
      argument === '--line' ||
      argument === '--column'
    ) {
      if (nextArgument === undefined) {
        throw new Error(`Missing value for ${argument}`);
      }

      index += 1;

      if (argument === '--map') {
        options.sourceMapPathOrUrl = nextArgument;
      } else if (argument === '--debug-info') {
        options.debugInfoPathOrUrl = nextArgument;
      } else if (argument === '--line') {
        options.line = Number(nextArgument);
      } else if (argument === '--column') {
        options.column = Number(nextArgument);
      }

      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function getUsageText() {
  return [
    'Usage:',
    '  node source_map_resolver.cjs --map <path-or-url> --line <line> --column <column> [--debug-info <path-or-url>]',
    '',
    'Example:',
    '  node source_map_resolver.cjs --map /path/to/bundle.js.map --line 120 --column 34',
    '  node source_map_resolver.cjs --map /path/to/main-thread.js.map --debug-info /path/to/debug-info.json --line 1355 --column 13',
  ].join('\n');
}

try {
  const options = parseCommandLineArguments(process.argv.slice(2));

  if (options.help) {
    console.log(getUsageText());
  } else {
    resolveTraceEventOriginalPosition(options)
      .then((result) => {
        if (result === null) {
          console.error('No matching source found for the given line and column');
          process.exit(1);
        }
        console.log(JSON.stringify(result, null, 2));
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
