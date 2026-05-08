// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
interface Position {
  line: number;
  column: number;
}

interface FunctionInfo {
  line_col: Position[];
  function_id: number;
  function_name: string;
}

interface DebugInfo {
  function_info: FunctionInfo[];
}

interface DebugInfoModule {
  default: {
    lepusNG_debug_info: DebugInfo;
  };
}

async function main() {
  const debugInfoPath = process.argv[2];
  const function_id = Number(process.argv[3]);
  const pc_index = Number(process.argv[4]) - 1;

  if (!debugInfoPath) {
    console.error('Please provide the debug info path as the first argument.');
    process.exit(1);
  }
  if (Number.isNaN(function_id) || Number.isNaN(pc_index)) {
    console.error(
      'Please provide the valid function_id and pc_index as the second and third arguments.',
    );
    process.exit(1);
  }

  const debugInfo: DebugInfoModule = await import(debugInfoPath, {
    with: { type: 'json' },
  });

  const { function_info } = debugInfo.default.lepusNG_debug_info;

  const functionInfo = function_info.find(
    (info) => info.function_id === function_id,
  );
  if (!functionInfo) {
    console.error(
      `Can not find the function_info with function_id: ${function_id}`,
    );
    process.exit(1);
  }

  const position = functionInfo.line_col[pc_index];
  if (!position) {
    console.error(`Can not find the position with pc_index: ${pc_index}`);
    process.exit(1);
  }

  console.log(
    `The position of function_id: ${function_id}, pc_index: ${pc_index} is ${position.line}:${position.column}`,
  );
}

main();
