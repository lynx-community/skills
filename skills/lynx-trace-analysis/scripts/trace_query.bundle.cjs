/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 4242
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
const commander_1 = __webpack_require__(3045);
const query_aggregate_1 = __webpack_require__(8536);
const query_ancestors_1 = __webpack_require__(4473);
const query_by_id_1 = __webpack_require__(880);
const query_by_raw_sql_1 = __webpack_require__(7820);
const query_by_time_window_1 = __webpack_require__(1323);
const query_descendants_1 = __webpack_require__(8051);
const query_flow_events_1 = __webpack_require__(2363);
const query_long_tasks_1 = __webpack_require__(192);
const query_lynxviews_1 = __webpack_require__(3438);
const query_metrics_1 = __webpack_require__(2926);
const query_pipeline_ids_1 = __webpack_require__(7100);
const query_pipeline_overview_events_1 = __webpack_require__(9263);
const query_threads_1 = __webpack_require__(6778);
const query_trace_metadata_1 = __webpack_require__(2220);
const convert_trace_event_style_1 = __webpack_require__(9969);
const trace_query_1 = __webpack_require__(2219);
async function withTraceQuery(tracePath, action) {
    const traceQuery = new trace_query_1.TraceQuery();
    try {
        await traceQuery.initProcessor(tracePath);
        return await action(traceQuery);
    }
    finally {
        await traceQuery.destroyProcessor();
    }
}
function requireOption(value, name) {
    if (!value) {
        console.error(`Error: --${name} is required`);
        process.exit(1);
    }
    return value;
}
function parseNumber(value, defaultValue) {
    if (!value)
        return defaultValue;
    return parseFloat(value);
}
function parseInteger(value, defaultValue) {
    if (!value)
        return defaultValue;
    return parseInt(value, 10);
}
async function main() {
    const program = new commander_1.Command();
    program.version('0.0.1').description('Trace Query CLI Tool');
    program
        .command('id')
        .description('Execute trace query by slice ID')
        .option('-i, --id <id>', 'Slice ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const id = parseInteger(requireOption(options.id, 'id'));
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_by_id_1.queryById)(tq, id);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Query result:', JSON.stringify(result, null, 2));
    });
    program
        .command('time-window')
        .description('Execute time window query')
        .option('-s, --start <start>', 'Start timestamp in ms')
        .option('-e, --end <end>', 'End timestamp in ms')
        .option('-t, --track <track>', 'Thread Track ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const start = parseNumber(requireOption(options.start, 'start'));
        const end = parseNumber(requireOption(options.end, 'end'));
        const track = parseInteger(options.track);
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_by_time_window_1.queryByTimeWindow)(tq, start, end, track);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Query result:', JSON.stringify(result, null, 2));
    });
    program
        .command('aggregate')
        .description('Execute aggregate query')
        .option('-s, --start <start>', 'Start timestamp in ms')
        .option('-e, --end <end>', 'End timestamp in ms')
        .option('-t, --track <track>', 'Thread Track ID')
        .option('-n, --names <names...>', 'Event name patterns (supports SQL LIKE wildcards: % and _)')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const start = parseNumber(requireOption(options.start, 'start'));
        const end = parseNumber(requireOption(options.end, 'end'));
        const track = parseInteger(options.track);
        const names = options.names || [];
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_aggregate_1.queryAggregate)(tq, start, end, names, track);
        });
        console.log('Aggregate:', JSON.stringify(result, null, 2));
    });
    program
        .command('ancestors')
        .description('Query ancestors of a slice')
        .option('-i, --id <id>', 'Slice ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const id = parseInteger(requireOption(options.id, 'id'));
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_ancestors_1.queryAncestors)(tq, id);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Ancestors:', JSON.stringify(result, null, 2));
    });
    program
        .command('descendants')
        .description('Query descendants of a slice')
        .option('-i, --id <id>', 'Slice ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const id = parseInteger(requireOption(options.id, 'id'));
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_descendants_1.queryDescendants)(tq, id);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Descendants:', JSON.stringify(result, null, 2));
    });
    program
        .command('flow')
        .description('Query flow events of a slice')
        .option('-i, --id <id>', 'Slice ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const id = parseInteger(requireOption(options.id, 'id'));
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_flow_events_1.queryFlowEvents)(tq, id);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Flow events:', JSON.stringify(result, null, 2));
    });
    program
        .command('metadata')
        .description('Query trace metadata like system info, trace start time, end time, Lynx SDK version etc.')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_trace_metadata_1.queryTraceMetadata)(tq);
        });
        console.log('Metadata result:', JSON.stringify(result, null, 2));
    });
    program
        .command('sql')
        .description('Execute raw SQL query')
        .option('-q, --query <sql>', 'SQL query')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const sqlQuery = requireOption(options.query, 'query');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_by_raw_sql_1.queryByRawSql)(tq, sqlQuery);
        });
        console.log('SQL result:', JSON.stringify(result, null, 2));
    });
    program
        .command('metrics')
        .description('Query metrics information from trace')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_metrics_1.queryMetrics)(tq);
        });
        console.log('Metrics result:', JSON.stringify(result, null, 2));
    });
    program
        .command('threads')
        .description('Query all threads from trace')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_threads_1.queryThreads)(tq);
        });
        console.log('Threads result:', JSON.stringify(result, null, 2));
    });
    program
        .command('long-tasks')
        .description('Query long tasks on a specific thread')
        .option('-t, --track <track>', 'Thread Track ID')
        .option('-d, --duration <ms>', 'Minimum duration in milliseconds', '16')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const track = parseInteger(requireOption(options.track, 'track'));
        const duration = parseNumber(options.duration, 16);
        const result = await withTraceQuery(path, async (tq) => {
            const events = await (0, query_long_tasks_1.queryLongTasks)(tq, track, duration);
            return (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(events);
        });
        console.log('Long tasks:', JSON.stringify(result, null, 2));
    });
    program
        .command('lynxview')
        .description('Query LynxView instances')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_lynxviews_1.queryLynxView)(tq);
        });
        console.log('LynxView instances:', JSON.stringify(result, null, 2));
    });
    program
        .command('pipeline')
        .description('Query pipeline IDs for an instance')
        .option('--instance-id <id>', 'LynxView instance ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const instanceId = requireOption(options.instanceId, 'instance-id');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_pipeline_ids_1.queryPipelineIds)(tq, instanceId);
        });
        console.log('Pipeline IDs:', JSON.stringify(result, null, 2));
    });
    program
        .command('pipeline-overview')
        .description('Query pipeline overview events')
        .option('--pipeline-id <id>', 'Pipeline ID')
        .option('-p, --path <path>', 'Trace file path (can be URL or local file)')
        .action(async (options) => {
        const path = requireOption(options.path, 'path');
        const pipelineId = requireOption(options.pipelineId, 'pipeline-id');
        const result = await withTraceQuery(path, async (tq) => {
            return (0, query_pipeline_overview_events_1.queryPipelineOverviewEvents)(tq, pipelineId);
        });
        console.log('Pipeline overview:', JSON.stringify(result, null, 2));
    });
    program.parse(process.argv);
}
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map

/***/ },

/***/ 8536
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryAggregate = queryAggregate;
const NS_TO_MS = 1000000;
async function queryAggregate(traceQuery, start_ts_ms, end_ts_ms, names, track_id) {
    try {
        const nameFilters = names
            .filter((name) => !!name)
            .map((name) => [`s.name LIKE '${name}'`])
            .join(' or ');
        if (!nameFilters) {
            throw new Error('At least one name is required.');
        }
        const filters = [
            `s.ts >= ${start_ts_ms * NS_TO_MS}`,
            `s.ts <= ${end_ts_ms * NS_TO_MS}`,
            ...(track_id ? [`s.track_id = ${track_id}`] : []),
        ];
        const constraints = `WHERE ${filters.join(' and ')} AND (${nameFilters})`;
        const sql = 'SELECT s.name, COUNT(*) AS total_count, SUM(dur) AS total_duration, AVG(dur) AS avg_duration, MAX(dur) AS max_duration ' +
            'FROM slice s ' +
            `${constraints} GROUP By s.name ` +
            `ORDER BY total_duration`;
        const qr_it = await traceQuery.query(sql);
        const trace_event = [];
        for (const event of qr_it) {
            trace_event.push({
                name: event['name'],
                total_count: event['total_count'],
                total_duration_ms: parseFloat((event['total_duration'] / NS_TO_MS).toFixed(1)),
                avg_duration_ms: parseFloat((event['avg_duration'] / NS_TO_MS).toFixed(1)),
                max_duration_ms: parseFloat((event['max_duration'] / NS_TO_MS).toFixed(1)),
            });
        }
        return trace_event;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=query_aggregate.js.map

/***/ },

/***/ 4473
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryAncestors = queryAncestors;
const parse_trace_event_1 = __webpack_require__(6331);
async function queryAncestors(traceQuery, sliceId) {
    const sql = "SELECT d_s.id, d_s.ts, d_s.dur, d_s.track_id, d_s.name, d_s.depth, t.name as thread_name, '{' || GROUP_CONCAT( printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        `FROM ancestor_slice(${sliceId}) d_s LEFT JOIN args a ON d_s.arg_set_id = a.arg_set_id ` +
        'JOIN thread_track tt ON d_s.track_id = tt.id JOIN thread t ON tt.utid = t.utid ' +
        'GROUP BY d_s.id ORDER BY d_s.depth, d_s.ts';
    const queryResult = await traceQuery.query(sql);
    return (0, parse_trace_event_1.parseTraceEvent)(queryResult);
}
//# sourceMappingURL=query_ancestors.js.map

/***/ },

/***/ 880
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryById = queryById;
const parse_trace_event_1 = __webpack_require__(6331);
async function queryById(traceQuery, slice_id) {
    const sql = "SELECT s.id, s.ts, s.dur, s.track_id, s.name, t.name as thread_name, '{' || GROUP_CONCAT( printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        `FROM slice s LEFT JOIN args a ON s.arg_set_id = a.arg_set_id JOIN thread_track tt ON s.track_id = tt.id JOIN thread t ON tt.utid = t.utid WHERE s.id = ${slice_id}`;
    const queryResult = await traceQuery.query(sql);
    const traceEvents = (0, parse_trace_event_1.parseTraceEvent)(queryResult);
    return traceEvents;
}
//# sourceMappingURL=query_by_id.js.map

/***/ },

/***/ 7820
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryByRawSql = queryByRawSql;
async function queryByRawSql(traceQuery, sql) {
    const queryResult = await traceQuery.query(sql);
    return queryResult;
}
//# sourceMappingURL=query_by_raw_sql.js.map

/***/ },

/***/ 1323
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryByTimeWindow = queryByTimeWindow;
const constant_1 = __webpack_require__(7309);
const parse_trace_event_1 = __webpack_require__(6331);
async function queryByTimeWindow(traceQuery, start_ts_ms, end_ts_ms, track_id) {
    const filters = [
        `s.ts >= ${start_ts_ms * constant_1.NS_TO_MS}`,
        `s.ts <= ${end_ts_ms * constant_1.NS_TO_MS}`,
        ...(track_id ? [`s.track_id = ${track_id}`] : []),
    ];
    const constraints = `WHERE ${filters.join(' and ')}`;
    const sql = "SELECT s.id, s.track_id, s.ts, s.dur, s.name, s.depth, t.name as thread_name, '{' || GROUP_CONCAT( printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        'FROM slice s ' +
        'LEFT JOIN args a ON s.arg_set_id = a.arg_set_id ' +
        'JOIN thread_track tt ON s.track_id = tt.id JOIN thread t ON tt.utid = t.utid ' +
        `${constraints} AND a.key != 'debug.url' AND s.category !=  'system'` +
        `GROUP BY s.id ORDER BY s.depth, s.ts`;
    const queryResult = await traceQuery.query(sql);
    const traceEvents = (0, parse_trace_event_1.parseTraceEvent)(queryResult);
    return traceEvents;
}
//# sourceMappingURL=query_by_time_window.js.map

/***/ },

/***/ 8051
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryDescendants = queryDescendants;
const parse_trace_event_1 = __webpack_require__(6331);
async function queryDescendants(traceQuery, sliceId) {
    const sql = "SELECT d_s.id, d_s.ts, d_s.dur, d_s.track_id, d_s.name, d_s.depth, t.name as thread_name, '{' || GROUP_CONCAT( printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        `FROM descendant_slice(${sliceId}) d_s LEFT JOIN args a ON d_s.arg_set_id = a.arg_set_id ` +
        'JOIN thread_track tt ON d_s.track_id = tt.id JOIN thread t ON tt.utid = t.utid ' +
        'WHERE d_s.category != "system" ' +
        'GROUP BY d_s.id ORDER BY d_s.depth, d_s.ts';
    const queryResult = await traceQuery.query(sql);
    return (0, parse_trace_event_1.parseTraceEvent)(queryResult);
}
//# sourceMappingURL=query_descendants.js.map

/***/ },

/***/ 2363
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryFlowEvents = queryFlowEvents;
const parse_trace_event_1 = __webpack_require__(6331);
async function queryFlowEvents(traceQuery, slice_id) {
    const sql = 'WITH connected_flows AS ( ' +
        `SELECT slice_out AS slice_id FROM directly_connected_flow(${slice_id}) ` +
        'UNION ALL ' +
        `SELECT slice_in AS slice_id FROM directly_connected_flow(${slice_id}) ` +
        'UNION ALL ' +
        `SELECT slice_out AS slice_id FROM preceding_flow(${slice_id}) ` +
        'UNION ALL ' +
        `SELECT slice_in AS slice_id FROM preceding_flow(${slice_id}) ` +
        '), ' +
        'unique_slice_ids AS ( SELECT DISTINCT slice_id FROM connected_flows ) ' +
        "SELECT s.id,  s.track_id,  s.ts,  s.dur,  s.depth, s.name, t.name as thread_name, '{' || GROUP_CONCAT(printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        'FROM unique_slice_ids usi ' +
        'JOIN slice s ON usi.slice_id = s.id ' +
        "LEFT JOIN args a ON s.arg_set_id = a.arg_set_id AND a.key != 'debug.url' " +
        'JOIN thread_track tt ON s.track_id = tt.id JOIN thread t ON tt.utid = t.utid ' +
        'GROUP BY s.id ORDER BY s.ts';
    const queryResult = await traceQuery.query(sql);
    const traceEvents = (0, parse_trace_event_1.parseTraceEvent)(queryResult);
    return traceEvents;
}
//# sourceMappingURL=query_flow_events.js.map

/***/ },

/***/ 192
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryLongTasks = queryLongTasks;
const constant_1 = __webpack_require__(7309);
const parse_trace_event_1 = __webpack_require__(6331);
async function queryLongTasks(traceQuery, track_id, min_duration_ms) {
    const minDurationNs = min_duration_ms * constant_1.NS_TO_MS;
    const sql = "SELECT s.id, s.track_id, s.ts, s.dur, s.name, s.depth, t.name as thread_name, '{' || GROUP_CONCAT( printf('\"%s\": \"%s\"', a.key, a.display_value), ', ') || '}' AS args " +
        'FROM slice s ' +
        'LEFT JOIN args a ON s.arg_set_id = a.arg_set_id ' +
        'JOIN thread_track tt ON s.track_id = tt.id JOIN thread t ON tt.utid = t.utid ' +
        `WHERE s.track_id = ${track_id} AND s.dur >= ${minDurationNs} ` +
        `GROUP BY s.id ORDER BY s.ts`;
    const queryResult = await traceQuery.query(sql);
    const traceEvents = (0, parse_trace_event_1.parseTraceEvent)(queryResult);
    return traceEvents;
}
//# sourceMappingURL=query_long_tasks.js.map

/***/ },

/***/ 3438
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryLynxView = queryLynxView;
async function queryLynxView(traceQuery) {
    const result = [];
    const instanceInfoMap = await getInstanceInfoMap(traceQuery);
    for (const [key, value] of Object.entries(instanceInfoMap)) {
        result.push({
            bundleUrl: getBundleFromUrl(value),
            instance_id: key,
        });
    }
    return result;
}
async function getInstanceInfoMap(tp) {
    const instanceInfoMap = {};
    const instanceInfoSql = `
      SELECT
      args.key as key,
      args.display_value as value
      FROM slice
      JOIN args ON slice.arg_set_id=args.arg_set_id
      WHERE slice.name='LynxLoadTemplate'
      ORDER BY slice.dur, slice.ts
  `;
    const instanceInfoResult = await tp.query(instanceInfoSql);
    let url = '';
    let instanceId = '';
    for (const instanceInfo of instanceInfoResult) {
        const instanceInfoRecord = instanceInfo;
        if (instanceInfoRecord['key'] === 'debug.url') {
            url = instanceInfoRecord['value'];
        }
        else if (instanceInfoRecord['key'] === 'debug.instance_id') {
            instanceId = instanceInfoRecord['value'];
        }
        if (url && instanceId) {
            instanceInfoMap[instanceId] = url;
            url = '';
            instanceId = '';
        }
    }
    return instanceInfoMap;
}
function getBundleFromUrl(url) {
    const pattern1 = /\/([^/]+\/[^/]+)\/template\.js/;
    const match1 = url.match(pattern1);
    if (match1 && match1[1]) {
        return match1[1];
    }
    const pattern2 = /bundle=([^&]+)/;
    const match2 = url.match(pattern2);
    if (match2 && match2[1]) {
        return match2[1];
    }
    return url;
}
//# sourceMappingURL=query_lynxviews.js.map

/***/ },

/***/ 2926
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryMetrics = queryMetrics;
const constant_1 = __webpack_require__(7309);
async function queryMetrics(traceQuery) {
    const sql = `
    SELECT 
      s.id, s.track_id, s.ts, s.dur, s.name as event_name, t.name as thread_name, t.tid as tid,
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.timing_flags' THEN a.display_value 
          ELSE NULL 
        END
      ) as timing_flags,
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.instance_id' THEN a.display_value 
          ELSE NULL 
        END
      ) as instance_id,
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.timing_key' THEN a.display_value 
          ELSE NULL 
        END
      ) as metric_key,
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.pipeline_id' THEN a.display_value 
          ELSE NULL 
        END
      ) as pipeline_id
    FROM slice s
    JOIN args a ON s.arg_set_id = a.arg_set_id
    JOIN thread_track tt ON s.track_id = tt.id JOIN thread t ON tt.utid = t.utid
    WHERE s.name LIKE 'Timing::Mark%'
    GROUP BY s.id, s.name, s.arg_set_id
    order by s.ts;
  `;
    const result = await traceQuery.query(sql);
    const instanceInfoMap = await getInstanceInfoMap(traceQuery);
    const transformedResults = result.map((item) => ({
        id: item.id,
        track_id: item.track_id,
        ts: item.ts,
        event_name: item.event_name,
        thread_name: item.thread_name ?? `Thread ${item.tid}`,
        timing_flags: item.timing_flags,
        instance_id: item.instance_id,
        metric_key: item.metric_key,
        pipeline_id: item.pipeline_id,
    }));
    const pipelineFlagMap = new Map();
    for (const metric of transformedResults) {
        if (metric.pipeline_id && metric.timing_flags) {
            pipelineFlagMap.set(metric.pipeline_id, metric.timing_flags);
        }
    }
    const pipelineInstanceIdMap = new Map();
    for (const metric of transformedResults) {
        if (metric.instance_id && metric.pipeline_id) {
            pipelineInstanceIdMap.set(metric.pipeline_id, metric.instance_id);
        }
    }
    for (const metric of transformedResults) {
        if (!metric.instance_id && metric.pipeline_id && pipelineInstanceIdMap.has(metric.pipeline_id)) {
            metric.instance_id = pipelineInstanceIdMap.get(metric.pipeline_id);
        }
    }
    const filteredResults = transformedResults.filter((metric) => metric.instance_id);
    if (filteredResults.length === 0) {
        throw new Error("Can't Get Metrics Info");
    }
    const aggregatedByInstance = new Map();
    for (const metric of filteredResults) {
        const { instance_id, pipeline_id } = metric;
        if (!aggregatedByInstance.has(instance_id)) {
            aggregatedByInstance.set(instance_id, new Map());
        }
        const instancePipelines = aggregatedByInstance.get(instance_id);
        if (!instancePipelines.has(pipeline_id)) {
            instancePipelines.set(pipeline_id, []);
        }
        instancePipelines.get(pipeline_id).push(metric);
    }
    const origins = await queryPipelineOrigins(traceQuery);
    const results = [];
    for (const [instanceId, instancePipelines] of aggregatedByInstance.entries()) {
        const metricsArray = [];
        for (const [pipelineId, pipelineMetrics] of instancePipelines.entries()) {
            pipelineMetrics.sort((a, b) => a.ts - b.ts);
            const paintEnd = pipelineMetrics.find((metric) => metric.metric_key === 'paintEnd');
            const timing_flags = pipelineFlagMap.get(pipelineId) || '';
            if (pipelineMetrics.length <= 0 || pipelineMetrics[0] === undefined || !timing_flags) {
                continue;
            }
            const pipelineOrigin = origins.get(pipelineId);
            let start_ts = pipelineMetrics[0].ts;
            const analyzedPipeline = analyzeMetricKeys(pipelineMetrics);
            if (pipelineOrigin) {
                start_ts = pipelineOrigin.ts;
            }
            const start_ts_ms = start_ts / constant_1.NS_TO_MS + 'ms';
            let metric;
            let after_trigger_cost_ms;
            if (!paintEnd) {
                // Calculate cost using last event when no paintEnd is found
                const lastMetric = pipelineMetrics[pipelineMetrics.length - 1];
                const end_ts = lastMetric ? lastMetric.ts : start_ts;
                after_trigger_cost_ms = (end_ts - start_ts) / constant_1.NS_TO_MS + 'ms';
                metric = {
                    timing_flags,
                    details: analyzedPipeline,
                    start_ts_ms,
                    after_trigger_cost_ms: after_trigger_cost_ms,
                    origin: pipelineOrigin ? pipelineOrigin.origin : undefined,
                    warn: 'Invaild timing flags, The pipeline corresponding to timing_flags did not cause UI update',
                };
            }
            else {
                // Normal case with paintEnd
                after_trigger_cost_ms = (paintEnd.ts - start_ts) / constant_1.NS_TO_MS + 'ms';
                metric = {
                    timing_flags,
                    details: analyzedPipeline,
                    start_ts_ms,
                    after_trigger_cost_ms: after_trigger_cost_ms,
                    origin: pipelineOrigin ? pipelineOrigin.origin : undefined,
                };
            }
            metricsArray.push(metric);
        }
        const url = `${instanceInfoMap[instanceId]} id: ${instanceId}`;
        results.push({ url, metrics: metricsArray });
    }
    return results;
}
function analyzeMetricKeys(metrics) {
    const startEvents = new Map();
    const endEvents = new Map();
    const analyzedMetrics = [];
    for (const metric of metrics) {
        const metricKey = metric.metric_key;
        if (!metricKey) {
            continue;
        }
        const { normalizedKey, eventType } = normalizeMetricKey(metric.event_name, metricKey);
        if (eventType === 'start') {
            startEvents.set(normalizedKey, metric);
        }
        else if (eventType === 'end') {
            if (!endEvents.has(normalizedKey)) {
                endEvents.set(normalizedKey, []);
            }
            endEvents.get(normalizedKey).push(metric);
        }
        else {
            analyzedMetrics.push({
                id: metric.id,
                track_id: metric.track_id,
                thread_name: metric.thread_name,
                metrics_name: normalizedKey,
                start_ts_ms: metric.ts / constant_1.NS_TO_MS + 'ms',
                duration_ms: '0ms',
            });
        }
    }
    for (const [normalizedKey, startEvent] of startEvents.entries()) {
        const endEventsForKey = endEvents.get(normalizedKey);
        if (endEventsForKey && endEventsForKey.length > 0 && endEventsForKey[0] !== undefined) {
            let latestEndEvent = endEventsForKey[0];
            for (const endEvent of endEventsForKey) {
                if (endEvent.ts > latestEndEvent.ts && endEvent.ts > startEvent.ts) {
                    latestEndEvent = endEvent;
                }
            }
            if (latestEndEvent.ts > startEvent.ts) {
                const duration = latestEndEvent.ts - startEvent.ts;
                analyzedMetrics.push({
                    id: startEvent.id,
                    track_id: startEvent.track_id,
                    thread_name: startEvent.thread_name,
                    metrics_name: normalizedKey,
                    start_ts_ms: startEvent.ts / constant_1.NS_TO_MS + 'ms',
                    end_ts_ms: latestEndEvent.ts / constant_1.NS_TO_MS + 'ms',
                    duration_ms: parseFloat((duration / constant_1.NS_TO_MS).toFixed(1)) + 'ms',
                });
            }
        }
    }
    return buildMetricTree(analyzedMetrics);
}
function buildMetricTree(flatMetrics) {
    const getStartTime = (m) => parseFloat(m.start_ts_ms.replace('ms', ''));
    const getEndTime = (m) => (m.end_ts_ms ? parseFloat(m.end_ts_ms.replace('ms', '')) : getStartTime(m));
    const sortedMetrics = [...flatMetrics].sort((a, b) => getStartTime(a) - getStartTime(b));
    const roots = [];
    const stack = [];
    for (const metric of sortedMetrics) {
        const metricEnd = getEndTime(metric);
        const metricWithChildren = { ...metric, children: [] };
        while (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top === undefined) {
                break;
            }
            const topEnd = getEndTime(top);
            if (metric.track_id === top.track_id && metricEnd <= topEnd) {
                top.children.push(metricWithChildren);
                stack.push(metricWithChildren);
                break;
            }
            stack.pop();
        }
        if (stack.length === 0) {
            roots.push(metricWithChildren);
            stack.push(metricWithChildren);
        }
    }
    return roots;
}
function normalizeMetricKey(eventName, metricKey) {
    let key = metricKey;
    if (eventName && eventName.startsWith('Timing::MarkHostPlatformTiming')) {
        key = 'platForm' + metricKey;
    }
    if (key === 'paintEnd') {
        return { normalizedKey: 'paintEnd', eventType: 'single' };
    }
    if (key.endsWith('Start')) {
        return {
            normalizedKey: key.slice(0, -5),
            eventType: 'start',
        };
    }
    else if (key.endsWith('End')) {
        return {
            normalizedKey: key.slice(0, -3),
            eventType: 'end',
        };
    }
    if (key.endsWith('_start')) {
        return {
            normalizedKey: key.slice(0, -6),
            eventType: 'start',
        };
    }
    else if (key.endsWith('_end')) {
        return {
            normalizedKey: key.slice(0, -4),
            eventType: 'end',
        };
    }
    return { normalizedKey: key, eventType: 'single' };
}
async function getInstanceInfoMap(traceQuery) {
    const instanceInfoMap = {};
    const instanceInfoSql = `
      SELECT
      args.key as key,
      args.display_value as value
      FROM slice
      JOIN args ON slice.arg_set_id=args.arg_set_id
      WHERE slice.name='LynxLoadTemplate'
      ORDER BY slice.dur, slice.ts
  `;
    const instanceInfoResult = await traceQuery.query(instanceInfoSql);
    let url = '';
    let instanceId = '';
    for (const instanceInfo of instanceInfoResult) {
        if (instanceInfo['key'] === 'debug.url') {
            url = getBundleFromUrl(instanceInfo['value']);
        }
        else if (instanceInfo['key'] === 'debug.instance_id') {
            instanceId = instanceInfo['value'];
        }
        if (url && instanceId) {
            instanceInfoMap[instanceId] = url;
            url = '';
            instanceId = '';
        }
    }
    return instanceInfoMap;
}
async function queryPipelineOrigins(traceQuery) {
    const sql = `
    SELECT 
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.pipeline_id' THEN a.display_value 
          ELSE NULL 
        END
      ) as pipeline_id,
      GROUP_CONCAT(
        CASE 
          WHEN a.key = 'debug.pipeline_origin' THEN a.display_value 
          ELSE NULL 
        END
      ) as pipeline_origin,
      s.ts
    FROM slice s
    JOIN args a ON s.arg_set_id = a.arg_set_id
    WHERE s.name = 'Timing::OnPipelineStart'
    GROUP BY s.id, s.name, s.arg_set_id
    HAVING MAX(CASE WHEN a.key = 'debug.timing_flags' THEN 1 ELSE 0 END) = 1
    ORDER BY s.ts;
  `;
    const result = await traceQuery.query(sql);
    const pipelineToOrigin = new Map();
    for (const item of result) {
        pipelineToOrigin.set(item['pipeline_id'], { ts: item['ts'], origin: item['pipeline_origin'] });
    }
    return pipelineToOrigin;
}
function getBundleFromUrl(url) {
    const pattern1 = /\/([^/]+\/[^/]+)\/template\.js/;
    const match1 = url.match(pattern1);
    if (match1) {
        return match1[1] ?? '';
    }
    const pattern2 = /bundle=([^&]+)/;
    const match2 = url.match(pattern2);
    if (match2) {
        return match2[1] ?? '';
    }
    return url;
}
//# sourceMappingURL=query_metrics.js.map

/***/ },

/***/ 7100
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryPipelineIds = queryPipelineIds;
async function queryPipelineIds(traceQuery, instance_id) {
    const result = [];
    const paintEndWithPipelineIdSql = `
      SELECT
      s.id AS id,
      MAX(CASE WHEN a2.key = 'debug.pipeline_id' THEN a2.display_value END) AS pipeline_id,
      MAX(CASE WHEN a1.key = 'debug.timing_flags' THEN a1.display_value END) AS timing_flags,
      MAX(CASE WHEN a3.key = 'debug.instance_id' THEN a3.display_value END) AS instance_id
      FROM slice s
      JOIN args a1 ON s.arg_set_id = a1.arg_set_id AND a1.key = 'debug.timing_flags' AND a1.display_value IS NOT NULL AND a1.display_value != ''
      JOIN args a2 ON s.arg_set_id = a2.arg_set_id AND a2.key = 'debug.pipeline_id'
      JOIN args a3 ON s.arg_set_id = a3.arg_set_id AND a3.key = 'debug.instance_id' AND a3.display_value = '${instance_id}'
      WHERE s.name = 'Timing::Mark.paintEnd'
      GROUP BY s.id
  `;
    const paintEndWithPipelineIdResult = await traceQuery.query(paintEndWithPipelineIdSql);
    const uniquePipelineIdSet = new Set();
    const uniqueTimingFlagsSet = new Set();
    for (const paintEndWithPipelineId of paintEndWithPipelineIdResult) {
        if (!paintEndWithPipelineId['pipeline_id'] ||
            uniquePipelineIdSet.has(paintEndWithPipelineId['pipeline_id'])) {
            continue;
        }
        uniquePipelineIdSet.add(paintEndWithPipelineId['pipeline_id']);
        if (!uniqueTimingFlagsSet.has(paintEndWithPipelineId['timing_flags'])) {
            uniqueTimingFlagsSet.add(paintEndWithPipelineId['timing_flags']);
            result.push(paintEndWithPipelineId['pipeline_id']);
        }
    }
    return result;
}
//# sourceMappingURL=query_pipeline_ids.js.map

/***/ },

/***/ 9263
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryPipelineOverviewEvents = queryPipelineOverviewEvents;
const readable_trace_1 = __webpack_require__(6239);
async function queryPipelineOverviewEvents(traceQuery, pipeline_id, keepNonTopUpdateEvent = false) {
    const paintEndWithPipelineIdSql = `
      SELECT
      s.id AS id,
      s.ts AS ts,
      MAX(CASE WHEN a2.key = 'debug.pipeline_id' THEN a2.display_value END) AS pipeline_id,
      MAX(CASE WHEN a1.key = 'debug.timing_flags' THEN a1.display_value END) AS timing_flags,
      MAX(CASE WHEN a3.key = 'debug.instance_id' THEN a3.display_value END) AS instance_id
      FROM slice s
      JOIN args a1 ON s.arg_set_id = a1.arg_set_id AND a1.key = 'debug.timing_flags' AND a1.display_value IS NOT NULL AND a1.display_value != ''
      JOIN args a2 ON s.arg_set_id = a2.arg_set_id AND a2.key = 'debug.pipeline_id' AND a2.display_value = '${pipeline_id}'
      JOIN args a3 ON s.arg_set_id = a3.arg_set_id AND a3.key = 'debug.instance_id'
      WHERE s.name = 'Timing::Mark.paintEnd'
      GROUP BY s.id
  `;
    const paintEndWithPipelineIdResult = await traceQuery.query(paintEndWithPipelineIdSql);
    if (paintEndWithPipelineIdResult.length === 0 || paintEndWithPipelineIdResult[0] === undefined) {
        return {};
    }
    const paintEndId = paintEndWithPipelineIdResult[0]['id'];
    const timingFlags = paintEndWithPipelineIdResult[0]['timing_flags'];
    const instance_id = paintEndWithPipelineIdResult[0]['instance_id'];
    let flowIdRelatedTraces = await queryFlowIdRelatedTrace(traceQuery, paintEndId);
    flowIdRelatedTraces = await filterFlowIdRelatedTraces(flowIdRelatedTraces, pipeline_id, traceQuery);
    const pipelineOverviewEventIds = new Set();
    pipelineOverviewEventIds.add(paintEndId);
    for (const flowIdRelatedTrace of flowIdRelatedTraces) {
        pipelineOverviewEventIds.add(flowIdRelatedTrace['id']);
    }
    if (timingFlags && timingFlags.includes('Lynx FCP')) {
        const onAttachedToWindowsEvent = await queryEventByName(traceQuery, instance_id, 'LynxView.onAttachedToWindow');
        if (onAttachedToWindowsEvent.length > 0 && onAttachedToWindowsEvent[0] !== undefined) {
            pipelineOverviewEventIds.add(onAttachedToWindowsEvent[0]['id']);
        }
    }
    if (flowIdRelatedTraces.length > 0 && flowIdRelatedTraces[0] !== undefined) {
        const updateEventIds = await queryAncestorUpdateEvent(traceQuery, flowIdRelatedTraces[0]['id']);
        for (const eventId of updateEventIds) {
            pipelineOverviewEventIds.add(eventId);
        }
        if (updateEventIds.size > 0 && lynxUpdateEvent(flowIdRelatedTraces[0]['name']) && !keepNonTopUpdateEvent) {
            pipelineOverviewEventIds.delete(flowIdRelatedTraces[0]['id']);
        }
    }
    const track_id = flowIdRelatedTraces.length > 0 && flowIdRelatedTraces[0] !== undefined
        ? flowIdRelatedTraces[0]['track_id']
        : paintEndWithPipelineIdResult[0]['track_id'];
    const loadJsAppEventId = await firstJsUpdatePipelineWithLoadJSAppEvent(traceQuery, instance_id, paintEndWithPipelineIdResult[0]['ts'], track_id);
    if (loadJsAppEventId) {
        pipelineOverviewEventIds.add(loadJsAppEventId);
    }
    const eventIdsStr = Array.from(pipelineOverviewEventIds).join(',');
    const overviewEventsSql = `
      SELECT s.*, t.name as thread_name, t.tid as thread_tid
      FROM slice s
      JOIN thread_track tt ON s.track_id = tt.id
      JOIN thread t ON tt.utid = t.utid
      WHERE s.id IN (${eventIdsStr})
      ORDER BY s.ts
  `;
    const overviewEvents = await traceQuery.query(overviewEventsSql);
    const readableTracesCrop = await (0, readable_trace_1.getReadableTrace)(traceQuery, overviewEvents);
    const result = {};
    result[timingFlags || ''] = readableTracesCrop;
    const loadBundleEvents = await queryEventByName(traceQuery, instance_id, 'LynxLoadTemplate');
    if (loadBundleEvents.length > 0 && loadBundleEvents[0] !== undefined) {
        const loadBundleEvent = loadBundleEvents[0];
        result['total_cost'] = ((paintEndWithPipelineIdResult[0]['ts'] - loadBundleEvent.ts) / 1000000).toFixed(1) + 'ms';
    }
    return result;
}
async function firstJsUpdatePipelineWithLoadJSAppEvent(traceQuery, instance_id, timestamp, track_id) {
    const loadJSAppEvents = await queryEventByName(traceQuery, instance_id, 'LoadJSApp');
    if (loadJSAppEvents.length === 0 || loadJSAppEvents[0] === undefined) {
        return null;
    }
    const loadJSAppEvent = loadJSAppEvents[0];
    const paintEndWithPipelineIdSql = `
      SELECT
      s.id AS id,
      MAX(CASE WHEN a2.key = 'debug.pipeline_id' THEN a2.display_value END) AS pipeline_id,
      MAX(CASE WHEN a1.key = 'debug.timing_flags' THEN a1.display_value END) AS timing_flags,
      MAX(CASE WHEN a3.key = 'debug.instance_id' THEN a3.display_value END) AS instance_id
      FROM slice s
      JOIN args a1 ON s.arg_set_id = a1.arg_set_id AND a1.key = 'debug.timing_flags' AND a1.display_value IS NOT NULL AND a1.display_value != ''
      JOIN args a2 ON s.arg_set_id = a2.arg_set_id AND a2.key = 'debug.pipeline_id' AND a2.display_value IS NOT NULL AND a2.display_value != ''
      JOIN args a3 ON s.arg_set_id = a3.arg_set_id AND a3.key = 'debug.instance_id' AND a3.display_value = '${instance_id}'
      WHERE s.name = 'Timing::Mark.paintEnd' AND s.ts < ${timestamp}
      GROUP BY s.id
  `;
    const paintEndWithPipelineIdResult = await traceQuery.query(paintEndWithPipelineIdSql);
    for (const row of paintEndWithPipelineIdResult) {
        let flowIdRelatedTraces = await queryFlowIdRelatedTrace(traceQuery, row['id']);
        flowIdRelatedTraces = await filterFlowIdRelatedTraces(flowIdRelatedTraces, row['pipeline_id'], traceQuery);
        if (flowIdRelatedTraces.length > 0 &&
            flowIdRelatedTraces[0] !== undefined &&
            flowIdRelatedTraces[0]['track_id'] === loadJSAppEvent['track_id']) {
            return null;
        }
    }
    if (loadJSAppEvent['track_id'] !== track_id) {
        return null;
    }
    return loadJSAppEvent['id'];
}
async function queryFlowIdRelatedTrace(tp, sliceId) {
    const sql = `
      WITH connected_flows AS (
      SELECT slice_out AS slice_id FROM directly_connected_flow(${sliceId})
      UNION ALL
      SELECT slice_in AS slice_id FROM directly_connected_flow(${sliceId})
      UNION ALL
      SELECT slice_out AS slice_id FROM preceding_flow(${sliceId})
      UNION ALL
      SELECT slice_in AS slice_id FROM preceding_flow(${sliceId})
      ),
      unique_slice_ids AS ( 
      SELECT DISTINCT slice_id FROM connected_flows 
      )
      SELECT s.id, s.track_id, s.ts, s.dur, s.name,
      '{' || GROUP_CONCAT(printf('"%s": "%s"', a.key, a.display_value), ', ') || '}' AS args,
      extract_arg(s.arg_set_id, 'debug.pipeline_id') as pipelineId
      FROM unique_slice_ids usi
      JOIN slice s ON usi.slice_id = s.id
      LEFT JOIN args a ON s.arg_set_id = a.arg_set_id AND a.key != 'debug.url'
      GROUP BY s.id ORDER BY s.ts
  `;
    return tp.query(sql);
}
async function filterFlowIdRelatedTraces(flowidRelatedTraces, pipelineId, tp) {
    const filterPipelineTraceIds = new Set();
    for (const trace of flowidRelatedTraces) {
        if (trace['pipelineId'] && trace['pipelineId'] !== pipelineId) {
            filterPipelineTraceIds.add(trace['id']);
        }
    }
    const filterProcedingTraceIds = new Set();
    for (const id of filterPipelineTraceIds) {
        const query = `
  INCLUDE PERFETTO MODULE slices.flow;
  select
  f.slice_out as beginSliceId,
  f.slice_in as endSliceId
  from preceding_flow(${id}) f
  `;
        const results = await tp.query(query);
        for (const result of results) {
            filterProcedingTraceIds.add(result['beginSliceId']);
            filterProcedingTraceIds.add(result['endSliceId']);
        }
    }
    return flowidRelatedTraces.filter((trace) => !filterProcedingTraceIds.has(trace['id']) && !filterPipelineTraceIds.has(trace['id']));
}
async function queryAncestorUpdateEvent(tp, sliceId) {
    const ancestorUpdateDataSql = `
      select *
      FROM ancestor_slice(${sliceId})
      WHERE dur > 0
  `;
    const eventIds = new Set();
    const ancestorUpdateDatas = await tp.query(ancestorUpdateDataSql);
    for (const updateData of ancestorUpdateDatas) {
        if (lynxUpdateEvent(updateData['name'])) {
            eventIds.add(updateData['id']);
        }
    }
    return eventIds;
}
async function queryEventByName(tp, instance_id, eventName) {
    const query = `select s.*, MAX(CASE WHEN a.key = 'debug.instance_id' THEN a.display_value END) AS instance_id, t.name as thread_name, t.tid as thread_tid
      from slice s 
      JOIN args a ON s.arg_set_id = a.arg_set_id AND a.key = 'debug.instance_id' 
      JOIN thread_track tt ON s.track_id = tt.id 
      JOIN thread t ON tt.utid = t.utid 
      where s.name = '${eventName}' 
      GROUP BY s.id 
      ORDER BY s.ts`;
    const iter = await tp.query(query);
    const events = [];
    for (let i = iter.length - 1; i >= 0; i--) {
        const event = iter[i];
        if (event && String(event['instance_id']) === instance_id) {
            events.push({
                id: event['id'],
                ts: event['ts'],
                dur: event['dur'],
                track_id: event['track_id'],
                name: event['name'],
                depth: event['depth'],
                arg_set_id: event['arg_set_id'],
                thread_name: event['thread_name'],
                thread_tid: event['thread_tid'],
            });
        }
    }
    return events;
}
function lynxUpdateEvent(eventName) {
    return (eventName === 'TemplateAssembler::CallLepusMethod' ||
        eventName === 'LynxUpdateData' ||
        eventName === 'UpdateComponentData' ||
        eventName === 'LynxLoadTemplate' ||
        eventName === 'UpdateData');
}
//# sourceMappingURL=query_pipeline_overview_events.js.map

/***/ },

/***/ 6778
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryThreads = queryThreads;
async function queryThreads(traceQuery, lynxThreadOnly = true) {
    const sql = `
    SELECT tt.id, t.tid, t.name
    FROM thread t
    LEFT JOIN thread_track tt ON t.utid = tt.utid
    WHERE t.utid != 0 and tt.id is not NULL
    ORDER BY t.tid
  `;
    let result = await traceQuery.query(sql);
    if (result.length === 0 || result[0] === undefined) {
        return [];
    }
    const mainThread = result[0];
    if (lynxThreadOnly) {
        result = result.filter((row) => row.name && (row.name.startsWith('lynx') || row.name.startsWith('Lynx')));
    }
    result.push(mainThread);
    return result.map((row) => ({
        track_id: row.id,
        tid: row.tid,
        name: row.name || `Thread ${row.tid}`,
        isMainThread: row.id === mainThread['id'],
    }));
}
//# sourceMappingURL=query_threads.js.map

/***/ },

/***/ 2220
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.queryTraceMetadata = queryTraceMetadata;
const constant_1 = __webpack_require__(7309);
async function queryTraceMetadata(traceQuery) {
    const infoSQL = ` SELECT
  MAX(CASE WHEN name = 'system_name' THEN str_value END) AS system_name,
  MAX(CASE WHEN name = 'system_machine' THEN str_value END) AS system_machine,
  MAX(CASE WHEN name = 'android_device_manufacturer' THEN str_value END) AS android_device_manufacturer,
  MAX(CASE WHEN name = 'android_ram_model' THEN str_value END) AS android_ram_model,
  MAX(CASE WHEN name = 'tracing_started_ns' THEN int_value END) AS tracing_started_ns,
  MAX(CASE WHEN name = 'tracing_disabled_ns' THEN int_value END) AS tracing_disabled_ns
  FROM metadata;`;
    const baseInfo = {};
    const infoIter = await traceQuery.query(infoSQL);
    if (infoIter.length < 1) {
        return {};
    }
    else {
        const info = infoIter[0];
        if (!info) {
            return {};
        }
        if (info['system_name'] === 'Linux') {
            baseInfo['os'] = 'Android';
            baseInfo['device_manufacturer'] = info['android_device_manufacturer'];
            baseInfo['ram_model'] = info['android_ram_model'];
        }
        else if (info['system_name'] === 'Darwin') {
            const system_machine = info['system_machine'];
            baseInfo['os'] = system_machine.indexOf('iPhone') !== -1 ? 'iPhone' : 'Mac';
            baseInfo['system_machine'] = system_machine;
        }
        else if (info['system_name'] === 'HarmonyOS') {
            baseInfo['os'] = info['system_name'];
        }
        else {
            baseInfo['os'] = 'Windows';
        }
        baseInfo['tracing_started_ms'] = (info['tracing_started_ns'] / constant_1.NS_TO_MS).toFixed(1);
        baseInfo['tracing_ended_ms'] = (info['tracing_disabled_ns'] / constant_1.NS_TO_MS).toFixed(1);
    }
    const versionSQL = "SELECT a.display_value as value FROM slice s LEFT JOIN args a ON s.arg_set_id = a.arg_set_id WHERE (s.name = 'LynxEngineVersion' or s.name = 'Version') and (a.key = 'debug.version' or a.key = 'args.version')";
    const versionIter = await traceQuery.query(versionSQL);
    if (versionIter.length < 1 || versionIter[0] === undefined || versionIter[0]['value'] === undefined) {
        baseInfo['lynx_engine_version'] = 'Unknown';
    }
    else {
        baseInfo['lynx_engine_version'] = versionIter[0]['value'] ?? 'Unknown';
    }
    const profileSQL = "SELECT EXISTS (SELECT 1 FROM slice WHERE category IN ('jsprofile', 'jsprofile_decode')) AS has_jsprofile;";
    const profileIter = await traceQuery.query(profileSQL);
    if (profileIter.length < 1 || profileIter[0] === undefined || profileIter[0]['has_jsprofile'] === 0) {
        baseInfo['open_jsprofile'] = 'false';
    }
    else {
        baseInfo['open_jsprofile'] = 'true';
    }
    return baseInfo;
}
//# sourceMappingURL=query_trace_metadata.js.map

/***/ },

/***/ 1302
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TraceProcessorConfig = void 0;
/**
 * Configuration for TraceProcessor instances.
 * Corresponds to Python's TraceProcessorConfig.
 */
class TraceProcessorConfig {
    constructor(options = {}) {
        this.binPath = options.binPath;
        this.uniquePort = options.uniquePort ?? true;
        this.verbose = options.verbose ?? false;
        this.ingestFtraceInRaw = options.ingestFtraceInRaw ?? false;
        this.enableDevFeatures = options.enableDevFeatures ?? false;
        this.loadTimeout = options.loadTimeout ?? 2;
        this.extraFlags = options.extraFlags ?? [];
    }
}
exports.TraceProcessorConfig = TraceProcessorConfig;
//# sourceMappingURL=config.js.map

/***/ },

/***/ 3642
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TraceProcessorException = void 0;
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/**
 * Custom exception raised if any trace_processor functions return a
 * response with an error defined.
 * Corresponds to Python's TraceProcessorException.
 */
class TraceProcessorException extends Error {
    constructor(message) {
        super(message);
        this.name = 'TraceProcessorException';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TraceProcessorException);
        }
    }
}
exports.TraceProcessorException = TraceProcessorException;
//# sourceMappingURL=exceptions.js.map

/***/ },

/***/ 2676
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TraceProcessorHttpClient = void 0;
const fs = __importStar(__webpack_require__(9896));
const node_fetch_1 = __importDefault(__webpack_require__(5287));
// @ts-expect-error protos.js and protos.d.ts are auto-generated files by compile_proto.mjs during build
const protos_js_1 = __importDefault(__webpack_require__(5943));
class TraceProcessorHttpClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async executeQuery(sql) {
        const queryArgs = protos_js_1.default.perfetto.protos.QueryArgs.create({
            sqlQuery: sql,
        });
        try {
            const requestBuffer = protos_js_1.default.perfetto.protos.QueryArgs.encode(queryArgs).finish();
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-protobuf',
                },
                body: Buffer.from(requestBuffer),
            });
            if (!response.ok) {
                throw new Error(`${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const responseBuffer = new Uint8Array(arrayBuffer);
            if (responseBuffer.length === 0) {
                throw new Error('Empty response from server');
            }
            const queryResult = protos_js_1.default.perfetto.protos.QueryResult.decode(responseBuffer);
            if (queryResult.error) {
                throw new Error(`${queryResult.error}`);
            }
            return queryResult;
        }
        catch (error) {
            throw new Error(`execute trace query failed: ${error}`);
        }
    }
    /**
     * Compute metrics for the loaded trace.
     */
    async computeMetric(metrics) {
        const metricArgs = protos_js_1.default.perfetto.protos.ComputeMetricArgs.create({
            metricNames: metrics,
            format: protos_js_1.default.perfetto.protos.ComputeMetricArgs.ResultFormat.TEXTPROTO,
        });
        const requestBuffer = protos_js_1.default.perfetto.protos.ComputeMetricArgs.encode(metricArgs).finish();
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/compute_metric`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-protobuf',
            },
            body: Buffer.from(requestBuffer),
        });
        if (!response.ok) {
            throw new Error(`Compute metric failed: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const responseBuffer = new Uint8Array(arrayBuffer);
        if (responseBuffer.length === 0) {
            throw new Error('Empty response from server');
        }
        try {
            const metricResult = protos_js_1.default.perfetto.protos.ComputeMetricResult.decode(responseBuffer);
            return metricResult;
        }
        catch (error) {
            throw new Error(`Failed to decode metric response: ${error}`);
        }
    }
    /**
     * Parse trace data in chunks to avoid sending large files at once.
     */
    async parse(trace) {
        if (trace.source === 'FILE' && trace.file) {
            // Read file in chunks to avoid memory issues and server rejection
            const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks, same as Python implementation
            const fileHandle = fs.openSync(trace.file, 'r');
            const buffer = Buffer.alloc(CHUNK_SIZE);
            let position = 0;
            let chunkCount = 0;
            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const bytesRead = fs.readSync(fileHandle, buffer, 0, CHUNK_SIZE, position);
                    if (bytesRead === 0) {
                        break; // End of file
                    }
                    chunkCount++;
                    const chunk = buffer.subarray(0, bytesRead);
                    const response = await (0, node_fetch_1.default)(`${this.baseUrl}/parse`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                        },
                        body: chunk,
                    });
                    if (!response.ok) {
                        throw new Error(`Parse failed on chunk ${chunkCount}: ${response.statusText}`);
                    }
                    // Check if there's any response content
                    const arrayBuffer = await response.arrayBuffer();
                    if (arrayBuffer.byteLength > 0) {
                        // Handle protobuf response if present
                        const responseBuffer = new Uint8Array(arrayBuffer);
                        try {
                            const result = protos_js_1.default.perfetto.protos.AppendTraceDataResult.decode(responseBuffer);
                            if (result.error) {
                                throw new Error(`Parse failed on chunk ${chunkCount}: ${result.error}`);
                            }
                        }
                        catch (error) {
                            // If it's not a valid protobuf, that's okay for parse endpoint
                            console.warn(`Could not decode response as protobuf for chunk ${chunkCount}:`, error);
                        }
                    }
                    position += bytesRead;
                }
            }
            finally {
                fs.closeSync(fileHandle);
            }
        }
        else {
            throw new Error('Only FILE source is supported');
        }
    }
    /**
     * Notify trace processor that no more data will be sent.
     */
    async notifyEof() {
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/notify_eof`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Notify EOF failed: ${response.statusText}`);
        }
    }
    /**
     * Get status of the trace processor.
     */
    async getStatus() {
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/status`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Get status failed: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const responseBuffer = new Uint8Array(arrayBuffer);
        if (responseBuffer.length === 0) {
            return {};
        }
        try {
            const statusResult = protos_js_1.default.perfetto.protos.StatusResult.decode(responseBuffer);
            return statusResult;
        }
        catch (error) {
            throw new Error(`Failed to decode status response: ${error}`);
        }
    }
    /**
     * Enable metatrace.
     */
    async enableMetatrace() {
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/enable_metatrace`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Enable metatrace failed: ${response.statusText}`);
        }
    }
    /**
     * Disable and read metatrace.
     */
    async disableAndReadMetatrace() {
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/disable_and_read_metatrace`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`Disable and read metatrace failed: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const responseBuffer = new Uint8Array(arrayBuffer);
        if (responseBuffer.length === 0) {
            return {};
        }
        try {
            const metatraceResult = protos_js_1.default.perfetto.protos.DisableAndReadMetatraceResult.decode(responseBuffer);
            return metatraceResult;
        }
        catch (error) {
            throw new Error(`Failed to decode metatrace response: ${error}`);
        }
    }
}
exports.TraceProcessorHttpClient = TraceProcessorHttpClient;
//# sourceMappingURL=http.js.map

/***/ },

/***/ 2158
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadShell = exports.TraceProcessorHttpClient = exports.TraceProcessorException = exports.Row = exports.QueryResultIterator = exports.TraceProcessorConfig = exports.TraceProcessor = void 0;
// Main exports
var trace_processor_1 = __webpack_require__(3062);
Object.defineProperty(exports, "TraceProcessor", ({ enumerable: true, get: function () { return trace_processor_1.TraceProcessor; } }));
var config_1 = __webpack_require__(1302);
Object.defineProperty(exports, "TraceProcessorConfig", ({ enumerable: true, get: function () { return config_1.TraceProcessorConfig; } }));
var query_result_iterator_1 = __webpack_require__(185);
Object.defineProperty(exports, "QueryResultIterator", ({ enumerable: true, get: function () { return query_result_iterator_1.QueryResultIterator; } }));
Object.defineProperty(exports, "Row", ({ enumerable: true, get: function () { return query_result_iterator_1.Row; } }));
var exceptions_1 = __webpack_require__(3642);
Object.defineProperty(exports, "TraceProcessorException", ({ enumerable: true, get: function () { return exceptions_1.TraceProcessorException; } }));
var http_1 = __webpack_require__(2676);
Object.defineProperty(exports, "TraceProcessorHttpClient", ({ enumerable: true, get: function () { return http_1.TraceProcessorHttpClient; } }));
var shell_1 = __webpack_require__(3184);
Object.defineProperty(exports, "loadShell", ({ enumerable: true, get: function () { return shell_1.loadShell; } }));
// Default export
const trace_processor_2 = __webpack_require__(3062);
exports["default"] = trace_processor_2.TraceProcessor;
//# sourceMappingURL=index.js.map

/***/ },

/***/ 5943
(module, __unused_webpack_exports, __webpack_require__) {

/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/


var $protobuf = __webpack_require__(9472);

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.perfetto = (function() {

    /**
     * Namespace perfetto.
     * @exports perfetto
     * @namespace
     */
    var perfetto = {};

    perfetto.protos = (function() {

        /**
         * Namespace protos.
         * @memberof perfetto
         * @namespace
         */
        var protos = {};

        /**
         * TraceProcessorApiVersion enum.
         * @name perfetto.protos.TraceProcessorApiVersion
         * @enum {number}
         * @property {number} TRACE_PROCESSOR_CURRENT_API_VERSION=14 TRACE_PROCESSOR_CURRENT_API_VERSION value
         */
        protos.TraceProcessorApiVersion = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[14] = "TRACE_PROCESSOR_CURRENT_API_VERSION"] = 14;
            return values;
        })();

        protos.TraceProcessorRpcStream = (function() {

            /**
             * Properties of a TraceProcessorRpcStream.
             * @memberof perfetto.protos
             * @interface ITraceProcessorRpcStream
             * @property {Array.<perfetto.protos.ITraceProcessorRpc>|null} [msg] TraceProcessorRpcStream msg
             */

            /**
             * Constructs a new TraceProcessorRpcStream.
             * @memberof perfetto.protos
             * @classdesc Represents a TraceProcessorRpcStream.
             * @implements ITraceProcessorRpcStream
             * @constructor
             * @param {perfetto.protos.ITraceProcessorRpcStream=} [p] Properties to set
             */
            function TraceProcessorRpcStream(p) {
                this.msg = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * TraceProcessorRpcStream msg.
             * @member {Array.<perfetto.protos.ITraceProcessorRpc>} msg
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @instance
             */
            TraceProcessorRpcStream.prototype.msg = $util.emptyArray;

            /**
             * Creates a new TraceProcessorRpcStream instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {perfetto.protos.ITraceProcessorRpcStream=} [properties] Properties to set
             * @returns {perfetto.protos.TraceProcessorRpcStream} TraceProcessorRpcStream instance
             */
            TraceProcessorRpcStream.create = function create(properties) {
                return new TraceProcessorRpcStream(properties);
            };

            /**
             * Encodes the specified TraceProcessorRpcStream message. Does not implicitly {@link perfetto.protos.TraceProcessorRpcStream.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {perfetto.protos.ITraceProcessorRpcStream} m TraceProcessorRpcStream message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TraceProcessorRpcStream.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.msg != null && m.msg.length) {
                    for (var i = 0; i < m.msg.length; ++i)
                        $root.perfetto.protos.TraceProcessorRpc.encode(m.msg[i], w.uint32(10).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes a TraceProcessorRpcStream message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.TraceProcessorRpcStream} TraceProcessorRpcStream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TraceProcessorRpcStream.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.TraceProcessorRpcStream();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.msg && m.msg.length))
                                m.msg = [];
                            m.msg.push($root.perfetto.protos.TraceProcessorRpc.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a TraceProcessorRpcStream message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.TraceProcessorRpcStream} TraceProcessorRpcStream
             */
            TraceProcessorRpcStream.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.TraceProcessorRpcStream)
                    return d;
                var m = new $root.perfetto.protos.TraceProcessorRpcStream();
                if (d.msg) {
                    if (!Array.isArray(d.msg))
                        throw TypeError(".perfetto.protos.TraceProcessorRpcStream.msg: array expected");
                    m.msg = [];
                    for (var i = 0; i < d.msg.length; ++i) {
                        if (typeof d.msg[i] !== "object")
                            throw TypeError(".perfetto.protos.TraceProcessorRpcStream.msg: object expected");
                        m.msg[i] = $root.perfetto.protos.TraceProcessorRpc.fromObject(d.msg[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a TraceProcessorRpcStream message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {perfetto.protos.TraceProcessorRpcStream} m TraceProcessorRpcStream
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TraceProcessorRpcStream.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.msg = [];
                }
                if (m.msg && m.msg.length) {
                    d.msg = [];
                    for (var j = 0; j < m.msg.length; ++j) {
                        d.msg[j] = $root.perfetto.protos.TraceProcessorRpc.toObject(m.msg[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this TraceProcessorRpcStream to JSON.
             * @function toJSON
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TraceProcessorRpcStream.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for TraceProcessorRpcStream
             * @function getTypeUrl
             * @memberof perfetto.protos.TraceProcessorRpcStream
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            TraceProcessorRpcStream.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.TraceProcessorRpcStream";
            };

            return TraceProcessorRpcStream;
        })();

        protos.TraceProcessorRpc = (function() {

            /**
             * Properties of a TraceProcessorRpc.
             * @memberof perfetto.protos
             * @interface ITraceProcessorRpc
             * @property {number|null} [seq] TraceProcessorRpc seq
             * @property {string|null} [fatalError] TraceProcessorRpc fatalError
             * @property {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null} [request] TraceProcessorRpc request
             * @property {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null} [response] TraceProcessorRpc response
             * @property {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null} [invalidRequest] TraceProcessorRpc invalidRequest
             * @property {Uint8Array|null} [appendTraceData] TraceProcessorRpc appendTraceData
             * @property {perfetto.protos.IQueryArgs|null} [queryArgs] TraceProcessorRpc queryArgs
             * @property {perfetto.protos.IComputeMetricArgs|null} [computeMetricArgs] TraceProcessorRpc computeMetricArgs
             * @property {perfetto.protos.IEnableMetatraceArgs|null} [enableMetatraceArgs] TraceProcessorRpc enableMetatraceArgs
             * @property {perfetto.protos.IResetTraceProcessorArgs|null} [resetTraceProcessorArgs] TraceProcessorRpc resetTraceProcessorArgs
             * @property {perfetto.protos.IRegisterSqlPackageArgs|null} [registerSqlPackageArgs] TraceProcessorRpc registerSqlPackageArgs
             * @property {perfetto.protos.IAnalyzeStructuredQueryArgs|null} [analyzeStructuredQueryArgs] TraceProcessorRpc analyzeStructuredQueryArgs
             * @property {perfetto.protos.IAppendTraceDataResult|null} [appendResult] TraceProcessorRpc appendResult
             * @property {perfetto.protos.IQueryResult|null} [queryResult] TraceProcessorRpc queryResult
             * @property {perfetto.protos.IComputeMetricResult|null} [metricResult] TraceProcessorRpc metricResult
             * @property {perfetto.protos.IDescriptorSet|null} [metricDescriptors] TraceProcessorRpc metricDescriptors
             * @property {perfetto.protos.IDisableAndReadMetatraceResult|null} [metatrace] TraceProcessorRpc metatrace
             * @property {perfetto.protos.IStatusResult|null} [status] TraceProcessorRpc status
             * @property {perfetto.protos.IRegisterSqlPackageResult|null} [registerSqlPackageResult] TraceProcessorRpc registerSqlPackageResult
             * @property {perfetto.protos.IFinalizeDataResult|null} [finalizeDataResult] TraceProcessorRpc finalizeDataResult
             * @property {perfetto.protos.IAnalyzeStructuredQueryResult|null} [analyzeStructuredQueryResult] TraceProcessorRpc analyzeStructuredQueryResult
             */

            /**
             * Constructs a new TraceProcessorRpc.
             * @memberof perfetto.protos
             * @classdesc Represents a TraceProcessorRpc.
             * @implements ITraceProcessorRpc
             * @constructor
             * @param {perfetto.protos.ITraceProcessorRpc=} [p] Properties to set
             */
            function TraceProcessorRpc(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * TraceProcessorRpc seq.
             * @member {number} seq
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.seq = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * TraceProcessorRpc fatalError.
             * @member {string} fatalError
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.fatalError = "";

            /**
             * TraceProcessorRpc request.
             * @member {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null|undefined} request
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.request = null;

            /**
             * TraceProcessorRpc response.
             * @member {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null|undefined} response
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.response = null;

            /**
             * TraceProcessorRpc invalidRequest.
             * @member {perfetto.protos.TraceProcessorRpc.TraceProcessorMethod|null|undefined} invalidRequest
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.invalidRequest = null;

            /**
             * TraceProcessorRpc appendTraceData.
             * @member {Uint8Array|null|undefined} appendTraceData
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.appendTraceData = null;

            /**
             * TraceProcessorRpc queryArgs.
             * @member {perfetto.protos.IQueryArgs|null|undefined} queryArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.queryArgs = null;

            /**
             * TraceProcessorRpc computeMetricArgs.
             * @member {perfetto.protos.IComputeMetricArgs|null|undefined} computeMetricArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.computeMetricArgs = null;

            /**
             * TraceProcessorRpc enableMetatraceArgs.
             * @member {perfetto.protos.IEnableMetatraceArgs|null|undefined} enableMetatraceArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.enableMetatraceArgs = null;

            /**
             * TraceProcessorRpc resetTraceProcessorArgs.
             * @member {perfetto.protos.IResetTraceProcessorArgs|null|undefined} resetTraceProcessorArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.resetTraceProcessorArgs = null;

            /**
             * TraceProcessorRpc registerSqlPackageArgs.
             * @member {perfetto.protos.IRegisterSqlPackageArgs|null|undefined} registerSqlPackageArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.registerSqlPackageArgs = null;

            /**
             * TraceProcessorRpc analyzeStructuredQueryArgs.
             * @member {perfetto.protos.IAnalyzeStructuredQueryArgs|null|undefined} analyzeStructuredQueryArgs
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.analyzeStructuredQueryArgs = null;

            /**
             * TraceProcessorRpc appendResult.
             * @member {perfetto.protos.IAppendTraceDataResult|null|undefined} appendResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.appendResult = null;

            /**
             * TraceProcessorRpc queryResult.
             * @member {perfetto.protos.IQueryResult|null|undefined} queryResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.queryResult = null;

            /**
             * TraceProcessorRpc metricResult.
             * @member {perfetto.protos.IComputeMetricResult|null|undefined} metricResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.metricResult = null;

            /**
             * TraceProcessorRpc metricDescriptors.
             * @member {perfetto.protos.IDescriptorSet|null|undefined} metricDescriptors
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.metricDescriptors = null;

            /**
             * TraceProcessorRpc metatrace.
             * @member {perfetto.protos.IDisableAndReadMetatraceResult|null|undefined} metatrace
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.metatrace = null;

            /**
             * TraceProcessorRpc status.
             * @member {perfetto.protos.IStatusResult|null|undefined} status
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.status = null;

            /**
             * TraceProcessorRpc registerSqlPackageResult.
             * @member {perfetto.protos.IRegisterSqlPackageResult|null|undefined} registerSqlPackageResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.registerSqlPackageResult = null;

            /**
             * TraceProcessorRpc finalizeDataResult.
             * @member {perfetto.protos.IFinalizeDataResult|null|undefined} finalizeDataResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.finalizeDataResult = null;

            /**
             * TraceProcessorRpc analyzeStructuredQueryResult.
             * @member {perfetto.protos.IAnalyzeStructuredQueryResult|null|undefined} analyzeStructuredQueryResult
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            TraceProcessorRpc.prototype.analyzeStructuredQueryResult = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * TraceProcessorRpc type.
             * @member {"request"|"response"|"invalidRequest"|undefined} type
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            Object.defineProperty(TraceProcessorRpc.prototype, "type", {
                get: $util.oneOfGetter($oneOfFields = ["request", "response", "invalidRequest"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * TraceProcessorRpc args.
             * @member {"appendTraceData"|"queryArgs"|"computeMetricArgs"|"enableMetatraceArgs"|"resetTraceProcessorArgs"|"registerSqlPackageArgs"|"analyzeStructuredQueryArgs"|"appendResult"|"queryResult"|"metricResult"|"metricDescriptors"|"metatrace"|"status"|"registerSqlPackageResult"|"finalizeDataResult"|"analyzeStructuredQueryResult"|undefined} args
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             */
            Object.defineProperty(TraceProcessorRpc.prototype, "args", {
                get: $util.oneOfGetter($oneOfFields = ["appendTraceData", "queryArgs", "computeMetricArgs", "enableMetatraceArgs", "resetTraceProcessorArgs", "registerSqlPackageArgs", "analyzeStructuredQueryArgs", "appendResult", "queryResult", "metricResult", "metricDescriptors", "metatrace", "status", "registerSqlPackageResult", "finalizeDataResult", "analyzeStructuredQueryResult"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new TraceProcessorRpc instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {perfetto.protos.ITraceProcessorRpc=} [properties] Properties to set
             * @returns {perfetto.protos.TraceProcessorRpc} TraceProcessorRpc instance
             */
            TraceProcessorRpc.create = function create(properties) {
                return new TraceProcessorRpc(properties);
            };

            /**
             * Encodes the specified TraceProcessorRpc message. Does not implicitly {@link perfetto.protos.TraceProcessorRpc.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {perfetto.protos.ITraceProcessorRpc} m TraceProcessorRpc message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TraceProcessorRpc.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.seq != null && Object.hasOwnProperty.call(m, "seq"))
                    w.uint32(8).int64(m.seq);
                if (m.request != null && Object.hasOwnProperty.call(m, "request"))
                    w.uint32(16).int32(m.request);
                if (m.response != null && Object.hasOwnProperty.call(m, "response"))
                    w.uint32(24).int32(m.response);
                if (m.invalidRequest != null && Object.hasOwnProperty.call(m, "invalidRequest"))
                    w.uint32(32).int32(m.invalidRequest);
                if (m.fatalError != null && Object.hasOwnProperty.call(m, "fatalError"))
                    w.uint32(42).string(m.fatalError);
                if (m.appendTraceData != null && Object.hasOwnProperty.call(m, "appendTraceData"))
                    w.uint32(810).bytes(m.appendTraceData);
                if (m.queryArgs != null && Object.hasOwnProperty.call(m, "queryArgs"))
                    $root.perfetto.protos.QueryArgs.encode(m.queryArgs, w.uint32(826).fork()).ldelim();
                if (m.computeMetricArgs != null && Object.hasOwnProperty.call(m, "computeMetricArgs"))
                    $root.perfetto.protos.ComputeMetricArgs.encode(m.computeMetricArgs, w.uint32(842).fork()).ldelim();
                if (m.enableMetatraceArgs != null && Object.hasOwnProperty.call(m, "enableMetatraceArgs"))
                    $root.perfetto.protos.EnableMetatraceArgs.encode(m.enableMetatraceArgs, w.uint32(850).fork()).ldelim();
                if (m.resetTraceProcessorArgs != null && Object.hasOwnProperty.call(m, "resetTraceProcessorArgs"))
                    $root.perfetto.protos.ResetTraceProcessorArgs.encode(m.resetTraceProcessorArgs, w.uint32(858).fork()).ldelim();
                if (m.registerSqlPackageArgs != null && Object.hasOwnProperty.call(m, "registerSqlPackageArgs"))
                    $root.perfetto.protos.RegisterSqlPackageArgs.encode(m.registerSqlPackageArgs, w.uint32(866).fork()).ldelim();
                if (m.analyzeStructuredQueryArgs != null && Object.hasOwnProperty.call(m, "analyzeStructuredQueryArgs"))
                    $root.perfetto.protos.AnalyzeStructuredQueryArgs.encode(m.analyzeStructuredQueryArgs, w.uint32(874).fork()).ldelim();
                if (m.appendResult != null && Object.hasOwnProperty.call(m, "appendResult"))
                    $root.perfetto.protos.AppendTraceDataResult.encode(m.appendResult, w.uint32(1610).fork()).ldelim();
                if (m.queryResult != null && Object.hasOwnProperty.call(m, "queryResult"))
                    $root.perfetto.protos.QueryResult.encode(m.queryResult, w.uint32(1626).fork()).ldelim();
                if (m.metricResult != null && Object.hasOwnProperty.call(m, "metricResult"))
                    $root.perfetto.protos.ComputeMetricResult.encode(m.metricResult, w.uint32(1642).fork()).ldelim();
                if (m.metricDescriptors != null && Object.hasOwnProperty.call(m, "metricDescriptors"))
                    $root.perfetto.protos.DescriptorSet.encode(m.metricDescriptors, w.uint32(1650).fork()).ldelim();
                if (m.metatrace != null && Object.hasOwnProperty.call(m, "metatrace"))
                    $root.perfetto.protos.DisableAndReadMetatraceResult.encode(m.metatrace, w.uint32(1674).fork()).ldelim();
                if (m.status != null && Object.hasOwnProperty.call(m, "status"))
                    $root.perfetto.protos.StatusResult.encode(m.status, w.uint32(1682).fork()).ldelim();
                if (m.registerSqlPackageResult != null && Object.hasOwnProperty.call(m, "registerSqlPackageResult"))
                    $root.perfetto.protos.RegisterSqlPackageResult.encode(m.registerSqlPackageResult, w.uint32(1690).fork()).ldelim();
                if (m.finalizeDataResult != null && Object.hasOwnProperty.call(m, "finalizeDataResult"))
                    $root.perfetto.protos.FinalizeDataResult.encode(m.finalizeDataResult, w.uint32(1698).fork()).ldelim();
                if (m.analyzeStructuredQueryResult != null && Object.hasOwnProperty.call(m, "analyzeStructuredQueryResult"))
                    $root.perfetto.protos.AnalyzeStructuredQueryResult.encode(m.analyzeStructuredQueryResult, w.uint32(1706).fork()).ldelim();
                return w;
            };

            /**
             * Decodes a TraceProcessorRpc message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.TraceProcessorRpc} TraceProcessorRpc
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TraceProcessorRpc.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.TraceProcessorRpc();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.seq = r.int64();
                            break;
                        }
                    case 5: {
                            m.fatalError = r.string();
                            break;
                        }
                    case 2: {
                            m.request = r.int32();
                            break;
                        }
                    case 3: {
                            m.response = r.int32();
                            break;
                        }
                    case 4: {
                            m.invalidRequest = r.int32();
                            break;
                        }
                    case 101: {
                            m.appendTraceData = r.bytes();
                            break;
                        }
                    case 103: {
                            m.queryArgs = $root.perfetto.protos.QueryArgs.decode(r, r.uint32());
                            break;
                        }
                    case 105: {
                            m.computeMetricArgs = $root.perfetto.protos.ComputeMetricArgs.decode(r, r.uint32());
                            break;
                        }
                    case 106: {
                            m.enableMetatraceArgs = $root.perfetto.protos.EnableMetatraceArgs.decode(r, r.uint32());
                            break;
                        }
                    case 107: {
                            m.resetTraceProcessorArgs = $root.perfetto.protos.ResetTraceProcessorArgs.decode(r, r.uint32());
                            break;
                        }
                    case 108: {
                            m.registerSqlPackageArgs = $root.perfetto.protos.RegisterSqlPackageArgs.decode(r, r.uint32());
                            break;
                        }
                    case 109: {
                            m.analyzeStructuredQueryArgs = $root.perfetto.protos.AnalyzeStructuredQueryArgs.decode(r, r.uint32());
                            break;
                        }
                    case 201: {
                            m.appendResult = $root.perfetto.protos.AppendTraceDataResult.decode(r, r.uint32());
                            break;
                        }
                    case 203: {
                            m.queryResult = $root.perfetto.protos.QueryResult.decode(r, r.uint32());
                            break;
                        }
                    case 205: {
                            m.metricResult = $root.perfetto.protos.ComputeMetricResult.decode(r, r.uint32());
                            break;
                        }
                    case 206: {
                            m.metricDescriptors = $root.perfetto.protos.DescriptorSet.decode(r, r.uint32());
                            break;
                        }
                    case 209: {
                            m.metatrace = $root.perfetto.protos.DisableAndReadMetatraceResult.decode(r, r.uint32());
                            break;
                        }
                    case 210: {
                            m.status = $root.perfetto.protos.StatusResult.decode(r, r.uint32());
                            break;
                        }
                    case 211: {
                            m.registerSqlPackageResult = $root.perfetto.protos.RegisterSqlPackageResult.decode(r, r.uint32());
                            break;
                        }
                    case 212: {
                            m.finalizeDataResult = $root.perfetto.protos.FinalizeDataResult.decode(r, r.uint32());
                            break;
                        }
                    case 213: {
                            m.analyzeStructuredQueryResult = $root.perfetto.protos.AnalyzeStructuredQueryResult.decode(r, r.uint32());
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a TraceProcessorRpc message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.TraceProcessorRpc} TraceProcessorRpc
             */
            TraceProcessorRpc.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.TraceProcessorRpc)
                    return d;
                var m = new $root.perfetto.protos.TraceProcessorRpc();
                if (d.seq != null) {
                    if ($util.Long)
                        (m.seq = $util.Long.fromValue(d.seq)).unsigned = false;
                    else if (typeof d.seq === "string")
                        m.seq = parseInt(d.seq, 10);
                    else if (typeof d.seq === "number")
                        m.seq = d.seq;
                    else if (typeof d.seq === "object")
                        m.seq = new $util.LongBits(d.seq.low >>> 0, d.seq.high >>> 0).toNumber();
                }
                if (d.fatalError != null) {
                    m.fatalError = String(d.fatalError);
                }
                switch (d.request) {
                default:
                    if (typeof d.request === "number") {
                        m.request = d.request;
                        break;
                    }
                    break;
                case "TPM_UNSPECIFIED":
                case 0:
                    m.request = 0;
                    break;
                case "TPM_APPEND_TRACE_DATA":
                case 1:
                    m.request = 1;
                    break;
                case "TPM_FINALIZE_TRACE_DATA":
                case 2:
                    m.request = 2;
                    break;
                case "TPM_QUERY_STREAMING":
                case 3:
                    m.request = 3;
                    break;
                case "TPM_COMPUTE_METRIC":
                case 5:
                    m.request = 5;
                    break;
                case "TPM_GET_METRIC_DESCRIPTORS":
                case 6:
                    m.request = 6;
                    break;
                case "TPM_RESTORE_INITIAL_TABLES":
                case 7:
                    m.request = 7;
                    break;
                case "TPM_ENABLE_METATRACE":
                case 8:
                    m.request = 8;
                    break;
                case "TPM_DISABLE_AND_READ_METATRACE":
                case 9:
                    m.request = 9;
                    break;
                case "TPM_GET_STATUS":
                case 10:
                    m.request = 10;
                    break;
                case "TPM_RESET_TRACE_PROCESSOR":
                case 11:
                    m.request = 11;
                    break;
                case "TPM_REGISTER_SQL_PACKAGE":
                case 13:
                    m.request = 13;
                    break;
                case "TPM_ANALYZE_STRUCTURED_QUERY":
                case 14:
                    m.request = 14;
                    break;
                }
                switch (d.response) {
                default:
                    if (typeof d.response === "number") {
                        m.response = d.response;
                        break;
                    }
                    break;
                case "TPM_UNSPECIFIED":
                case 0:
                    m.response = 0;
                    break;
                case "TPM_APPEND_TRACE_DATA":
                case 1:
                    m.response = 1;
                    break;
                case "TPM_FINALIZE_TRACE_DATA":
                case 2:
                    m.response = 2;
                    break;
                case "TPM_QUERY_STREAMING":
                case 3:
                    m.response = 3;
                    break;
                case "TPM_COMPUTE_METRIC":
                case 5:
                    m.response = 5;
                    break;
                case "TPM_GET_METRIC_DESCRIPTORS":
                case 6:
                    m.response = 6;
                    break;
                case "TPM_RESTORE_INITIAL_TABLES":
                case 7:
                    m.response = 7;
                    break;
                case "TPM_ENABLE_METATRACE":
                case 8:
                    m.response = 8;
                    break;
                case "TPM_DISABLE_AND_READ_METATRACE":
                case 9:
                    m.response = 9;
                    break;
                case "TPM_GET_STATUS":
                case 10:
                    m.response = 10;
                    break;
                case "TPM_RESET_TRACE_PROCESSOR":
                case 11:
                    m.response = 11;
                    break;
                case "TPM_REGISTER_SQL_PACKAGE":
                case 13:
                    m.response = 13;
                    break;
                case "TPM_ANALYZE_STRUCTURED_QUERY":
                case 14:
                    m.response = 14;
                    break;
                }
                switch (d.invalidRequest) {
                default:
                    if (typeof d.invalidRequest === "number") {
                        m.invalidRequest = d.invalidRequest;
                        break;
                    }
                    break;
                case "TPM_UNSPECIFIED":
                case 0:
                    m.invalidRequest = 0;
                    break;
                case "TPM_APPEND_TRACE_DATA":
                case 1:
                    m.invalidRequest = 1;
                    break;
                case "TPM_FINALIZE_TRACE_DATA":
                case 2:
                    m.invalidRequest = 2;
                    break;
                case "TPM_QUERY_STREAMING":
                case 3:
                    m.invalidRequest = 3;
                    break;
                case "TPM_COMPUTE_METRIC":
                case 5:
                    m.invalidRequest = 5;
                    break;
                case "TPM_GET_METRIC_DESCRIPTORS":
                case 6:
                    m.invalidRequest = 6;
                    break;
                case "TPM_RESTORE_INITIAL_TABLES":
                case 7:
                    m.invalidRequest = 7;
                    break;
                case "TPM_ENABLE_METATRACE":
                case 8:
                    m.invalidRequest = 8;
                    break;
                case "TPM_DISABLE_AND_READ_METATRACE":
                case 9:
                    m.invalidRequest = 9;
                    break;
                case "TPM_GET_STATUS":
                case 10:
                    m.invalidRequest = 10;
                    break;
                case "TPM_RESET_TRACE_PROCESSOR":
                case 11:
                    m.invalidRequest = 11;
                    break;
                case "TPM_REGISTER_SQL_PACKAGE":
                case 13:
                    m.invalidRequest = 13;
                    break;
                case "TPM_ANALYZE_STRUCTURED_QUERY":
                case 14:
                    m.invalidRequest = 14;
                    break;
                }
                if (d.appendTraceData != null) {
                    if (typeof d.appendTraceData === "string")
                        $util.base64.decode(d.appendTraceData, m.appendTraceData = $util.newBuffer($util.base64.length(d.appendTraceData)), 0);
                    else if (d.appendTraceData.length >= 0)
                        m.appendTraceData = d.appendTraceData;
                }
                if (d.queryArgs != null) {
                    if (typeof d.queryArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.queryArgs: object expected");
                    m.queryArgs = $root.perfetto.protos.QueryArgs.fromObject(d.queryArgs);
                }
                if (d.computeMetricArgs != null) {
                    if (typeof d.computeMetricArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.computeMetricArgs: object expected");
                    m.computeMetricArgs = $root.perfetto.protos.ComputeMetricArgs.fromObject(d.computeMetricArgs);
                }
                if (d.enableMetatraceArgs != null) {
                    if (typeof d.enableMetatraceArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.enableMetatraceArgs: object expected");
                    m.enableMetatraceArgs = $root.perfetto.protos.EnableMetatraceArgs.fromObject(d.enableMetatraceArgs);
                }
                if (d.resetTraceProcessorArgs != null) {
                    if (typeof d.resetTraceProcessorArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.resetTraceProcessorArgs: object expected");
                    m.resetTraceProcessorArgs = $root.perfetto.protos.ResetTraceProcessorArgs.fromObject(d.resetTraceProcessorArgs);
                }
                if (d.registerSqlPackageArgs != null) {
                    if (typeof d.registerSqlPackageArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.registerSqlPackageArgs: object expected");
                    m.registerSqlPackageArgs = $root.perfetto.protos.RegisterSqlPackageArgs.fromObject(d.registerSqlPackageArgs);
                }
                if (d.analyzeStructuredQueryArgs != null) {
                    if (typeof d.analyzeStructuredQueryArgs !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.analyzeStructuredQueryArgs: object expected");
                    m.analyzeStructuredQueryArgs = $root.perfetto.protos.AnalyzeStructuredQueryArgs.fromObject(d.analyzeStructuredQueryArgs);
                }
                if (d.appendResult != null) {
                    if (typeof d.appendResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.appendResult: object expected");
                    m.appendResult = $root.perfetto.protos.AppendTraceDataResult.fromObject(d.appendResult);
                }
                if (d.queryResult != null) {
                    if (typeof d.queryResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.queryResult: object expected");
                    m.queryResult = $root.perfetto.protos.QueryResult.fromObject(d.queryResult);
                }
                if (d.metricResult != null) {
                    if (typeof d.metricResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.metricResult: object expected");
                    m.metricResult = $root.perfetto.protos.ComputeMetricResult.fromObject(d.metricResult);
                }
                if (d.metricDescriptors != null) {
                    if (typeof d.metricDescriptors !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.metricDescriptors: object expected");
                    m.metricDescriptors = $root.perfetto.protos.DescriptorSet.fromObject(d.metricDescriptors);
                }
                if (d.metatrace != null) {
                    if (typeof d.metatrace !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.metatrace: object expected");
                    m.metatrace = $root.perfetto.protos.DisableAndReadMetatraceResult.fromObject(d.metatrace);
                }
                if (d.status != null) {
                    if (typeof d.status !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.status: object expected");
                    m.status = $root.perfetto.protos.StatusResult.fromObject(d.status);
                }
                if (d.registerSqlPackageResult != null) {
                    if (typeof d.registerSqlPackageResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.registerSqlPackageResult: object expected");
                    m.registerSqlPackageResult = $root.perfetto.protos.RegisterSqlPackageResult.fromObject(d.registerSqlPackageResult);
                }
                if (d.finalizeDataResult != null) {
                    if (typeof d.finalizeDataResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.finalizeDataResult: object expected");
                    m.finalizeDataResult = $root.perfetto.protos.FinalizeDataResult.fromObject(d.finalizeDataResult);
                }
                if (d.analyzeStructuredQueryResult != null) {
                    if (typeof d.analyzeStructuredQueryResult !== "object")
                        throw TypeError(".perfetto.protos.TraceProcessorRpc.analyzeStructuredQueryResult: object expected");
                    m.analyzeStructuredQueryResult = $root.perfetto.protos.AnalyzeStructuredQueryResult.fromObject(d.analyzeStructuredQueryResult);
                }
                return m;
            };

            /**
             * Creates a plain object from a TraceProcessorRpc message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {perfetto.protos.TraceProcessorRpc} m TraceProcessorRpc
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TraceProcessorRpc.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    if ($util.Long) {
                        var n = new $util.Long(0, 0, false);
                        d.seq = o.longs === String ? n.toString() : o.longs === Number ? n.toNumber() : n;
                    } else
                        d.seq = o.longs === String ? "0" : 0;
                    d.fatalError = "";
                }
                if (m.seq != null && m.hasOwnProperty("seq")) {
                    if (typeof m.seq === "number")
                        d.seq = o.longs === String ? String(m.seq) : m.seq;
                    else
                        d.seq = o.longs === String ? $util.Long.prototype.toString.call(m.seq) : o.longs === Number ? new $util.LongBits(m.seq.low >>> 0, m.seq.high >>> 0).toNumber() : m.seq;
                }
                if (m.request != null && m.hasOwnProperty("request")) {
                    d.request = o.enums === String ? $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.request] === undefined ? m.request : $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.request] : m.request;
                    if (o.oneofs)
                        d.type = "request";
                }
                if (m.response != null && m.hasOwnProperty("response")) {
                    d.response = o.enums === String ? $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.response] === undefined ? m.response : $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.response] : m.response;
                    if (o.oneofs)
                        d.type = "response";
                }
                if (m.invalidRequest != null && m.hasOwnProperty("invalidRequest")) {
                    d.invalidRequest = o.enums === String ? $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.invalidRequest] === undefined ? m.invalidRequest : $root.perfetto.protos.TraceProcessorRpc.TraceProcessorMethod[m.invalidRequest] : m.invalidRequest;
                    if (o.oneofs)
                        d.type = "invalidRequest";
                }
                if (m.fatalError != null && m.hasOwnProperty("fatalError")) {
                    d.fatalError = m.fatalError;
                }
                if (m.appendTraceData != null && m.hasOwnProperty("appendTraceData")) {
                    d.appendTraceData = o.bytes === String ? $util.base64.encode(m.appendTraceData, 0, m.appendTraceData.length) : o.bytes === Array ? Array.prototype.slice.call(m.appendTraceData) : m.appendTraceData;
                    if (o.oneofs)
                        d.args = "appendTraceData";
                }
                if (m.queryArgs != null && m.hasOwnProperty("queryArgs")) {
                    d.queryArgs = $root.perfetto.protos.QueryArgs.toObject(m.queryArgs, o);
                    if (o.oneofs)
                        d.args = "queryArgs";
                }
                if (m.computeMetricArgs != null && m.hasOwnProperty("computeMetricArgs")) {
                    d.computeMetricArgs = $root.perfetto.protos.ComputeMetricArgs.toObject(m.computeMetricArgs, o);
                    if (o.oneofs)
                        d.args = "computeMetricArgs";
                }
                if (m.enableMetatraceArgs != null && m.hasOwnProperty("enableMetatraceArgs")) {
                    d.enableMetatraceArgs = $root.perfetto.protos.EnableMetatraceArgs.toObject(m.enableMetatraceArgs, o);
                    if (o.oneofs)
                        d.args = "enableMetatraceArgs";
                }
                if (m.resetTraceProcessorArgs != null && m.hasOwnProperty("resetTraceProcessorArgs")) {
                    d.resetTraceProcessorArgs = $root.perfetto.protos.ResetTraceProcessorArgs.toObject(m.resetTraceProcessorArgs, o);
                    if (o.oneofs)
                        d.args = "resetTraceProcessorArgs";
                }
                if (m.registerSqlPackageArgs != null && m.hasOwnProperty("registerSqlPackageArgs")) {
                    d.registerSqlPackageArgs = $root.perfetto.protos.RegisterSqlPackageArgs.toObject(m.registerSqlPackageArgs, o);
                    if (o.oneofs)
                        d.args = "registerSqlPackageArgs";
                }
                if (m.analyzeStructuredQueryArgs != null && m.hasOwnProperty("analyzeStructuredQueryArgs")) {
                    d.analyzeStructuredQueryArgs = $root.perfetto.protos.AnalyzeStructuredQueryArgs.toObject(m.analyzeStructuredQueryArgs, o);
                    if (o.oneofs)
                        d.args = "analyzeStructuredQueryArgs";
                }
                if (m.appendResult != null && m.hasOwnProperty("appendResult")) {
                    d.appendResult = $root.perfetto.protos.AppendTraceDataResult.toObject(m.appendResult, o);
                    if (o.oneofs)
                        d.args = "appendResult";
                }
                if (m.queryResult != null && m.hasOwnProperty("queryResult")) {
                    d.queryResult = $root.perfetto.protos.QueryResult.toObject(m.queryResult, o);
                    if (o.oneofs)
                        d.args = "queryResult";
                }
                if (m.metricResult != null && m.hasOwnProperty("metricResult")) {
                    d.metricResult = $root.perfetto.protos.ComputeMetricResult.toObject(m.metricResult, o);
                    if (o.oneofs)
                        d.args = "metricResult";
                }
                if (m.metricDescriptors != null && m.hasOwnProperty("metricDescriptors")) {
                    d.metricDescriptors = $root.perfetto.protos.DescriptorSet.toObject(m.metricDescriptors, o);
                    if (o.oneofs)
                        d.args = "metricDescriptors";
                }
                if (m.metatrace != null && m.hasOwnProperty("metatrace")) {
                    d.metatrace = $root.perfetto.protos.DisableAndReadMetatraceResult.toObject(m.metatrace, o);
                    if (o.oneofs)
                        d.args = "metatrace";
                }
                if (m.status != null && m.hasOwnProperty("status")) {
                    d.status = $root.perfetto.protos.StatusResult.toObject(m.status, o);
                    if (o.oneofs)
                        d.args = "status";
                }
                if (m.registerSqlPackageResult != null && m.hasOwnProperty("registerSqlPackageResult")) {
                    d.registerSqlPackageResult = $root.perfetto.protos.RegisterSqlPackageResult.toObject(m.registerSqlPackageResult, o);
                    if (o.oneofs)
                        d.args = "registerSqlPackageResult";
                }
                if (m.finalizeDataResult != null && m.hasOwnProperty("finalizeDataResult")) {
                    d.finalizeDataResult = $root.perfetto.protos.FinalizeDataResult.toObject(m.finalizeDataResult, o);
                    if (o.oneofs)
                        d.args = "finalizeDataResult";
                }
                if (m.analyzeStructuredQueryResult != null && m.hasOwnProperty("analyzeStructuredQueryResult")) {
                    d.analyzeStructuredQueryResult = $root.perfetto.protos.AnalyzeStructuredQueryResult.toObject(m.analyzeStructuredQueryResult, o);
                    if (o.oneofs)
                        d.args = "analyzeStructuredQueryResult";
                }
                return d;
            };

            /**
             * Converts this TraceProcessorRpc to JSON.
             * @function toJSON
             * @memberof perfetto.protos.TraceProcessorRpc
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TraceProcessorRpc.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for TraceProcessorRpc
             * @function getTypeUrl
             * @memberof perfetto.protos.TraceProcessorRpc
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            TraceProcessorRpc.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.TraceProcessorRpc";
            };

            /**
             * TraceProcessorMethod enum.
             * @name perfetto.protos.TraceProcessorRpc.TraceProcessorMethod
             * @enum {number}
             * @property {number} TPM_UNSPECIFIED=0 TPM_UNSPECIFIED value
             * @property {number} TPM_APPEND_TRACE_DATA=1 TPM_APPEND_TRACE_DATA value
             * @property {number} TPM_FINALIZE_TRACE_DATA=2 TPM_FINALIZE_TRACE_DATA value
             * @property {number} TPM_QUERY_STREAMING=3 TPM_QUERY_STREAMING value
             * @property {number} TPM_COMPUTE_METRIC=5 TPM_COMPUTE_METRIC value
             * @property {number} TPM_GET_METRIC_DESCRIPTORS=6 TPM_GET_METRIC_DESCRIPTORS value
             * @property {number} TPM_RESTORE_INITIAL_TABLES=7 TPM_RESTORE_INITIAL_TABLES value
             * @property {number} TPM_ENABLE_METATRACE=8 TPM_ENABLE_METATRACE value
             * @property {number} TPM_DISABLE_AND_READ_METATRACE=9 TPM_DISABLE_AND_READ_METATRACE value
             * @property {number} TPM_GET_STATUS=10 TPM_GET_STATUS value
             * @property {number} TPM_RESET_TRACE_PROCESSOR=11 TPM_RESET_TRACE_PROCESSOR value
             * @property {number} TPM_REGISTER_SQL_PACKAGE=13 TPM_REGISTER_SQL_PACKAGE value
             * @property {number} TPM_ANALYZE_STRUCTURED_QUERY=14 TPM_ANALYZE_STRUCTURED_QUERY value
             */
            TraceProcessorRpc.TraceProcessorMethod = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "TPM_UNSPECIFIED"] = 0;
                values[valuesById[1] = "TPM_APPEND_TRACE_DATA"] = 1;
                values[valuesById[2] = "TPM_FINALIZE_TRACE_DATA"] = 2;
                values[valuesById[3] = "TPM_QUERY_STREAMING"] = 3;
                values[valuesById[5] = "TPM_COMPUTE_METRIC"] = 5;
                values[valuesById[6] = "TPM_GET_METRIC_DESCRIPTORS"] = 6;
                values[valuesById[7] = "TPM_RESTORE_INITIAL_TABLES"] = 7;
                values[valuesById[8] = "TPM_ENABLE_METATRACE"] = 8;
                values[valuesById[9] = "TPM_DISABLE_AND_READ_METATRACE"] = 9;
                values[valuesById[10] = "TPM_GET_STATUS"] = 10;
                values[valuesById[11] = "TPM_RESET_TRACE_PROCESSOR"] = 11;
                values[valuesById[13] = "TPM_REGISTER_SQL_PACKAGE"] = 13;
                values[valuesById[14] = "TPM_ANALYZE_STRUCTURED_QUERY"] = 14;
                return values;
            })();

            return TraceProcessorRpc;
        })();

        protos.AppendTraceDataResult = (function() {

            /**
             * Properties of an AppendTraceDataResult.
             * @memberof perfetto.protos
             * @interface IAppendTraceDataResult
             * @property {number|null} [totalBytesParsed] AppendTraceDataResult totalBytesParsed
             * @property {string|null} [error] AppendTraceDataResult error
             */

            /**
             * Constructs a new AppendTraceDataResult.
             * @memberof perfetto.protos
             * @classdesc Represents an AppendTraceDataResult.
             * @implements IAppendTraceDataResult
             * @constructor
             * @param {perfetto.protos.IAppendTraceDataResult=} [p] Properties to set
             */
            function AppendTraceDataResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * AppendTraceDataResult totalBytesParsed.
             * @member {number} totalBytesParsed
             * @memberof perfetto.protos.AppendTraceDataResult
             * @instance
             */
            AppendTraceDataResult.prototype.totalBytesParsed = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * AppendTraceDataResult error.
             * @member {string} error
             * @memberof perfetto.protos.AppendTraceDataResult
             * @instance
             */
            AppendTraceDataResult.prototype.error = "";

            /**
             * Creates a new AppendTraceDataResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {perfetto.protos.IAppendTraceDataResult=} [properties] Properties to set
             * @returns {perfetto.protos.AppendTraceDataResult} AppendTraceDataResult instance
             */
            AppendTraceDataResult.create = function create(properties) {
                return new AppendTraceDataResult(properties);
            };

            /**
             * Encodes the specified AppendTraceDataResult message. Does not implicitly {@link perfetto.protos.AppendTraceDataResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {perfetto.protos.IAppendTraceDataResult} m AppendTraceDataResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AppendTraceDataResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.totalBytesParsed != null && Object.hasOwnProperty.call(m, "totalBytesParsed"))
                    w.uint32(8).int64(m.totalBytesParsed);
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(18).string(m.error);
                return w;
            };

            /**
             * Decodes an AppendTraceDataResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.AppendTraceDataResult} AppendTraceDataResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AppendTraceDataResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.AppendTraceDataResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.totalBytesParsed = r.int64();
                            break;
                        }
                    case 2: {
                            m.error = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an AppendTraceDataResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.AppendTraceDataResult} AppendTraceDataResult
             */
            AppendTraceDataResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.AppendTraceDataResult)
                    return d;
                var m = new $root.perfetto.protos.AppendTraceDataResult();
                if (d.totalBytesParsed != null) {
                    if ($util.Long)
                        (m.totalBytesParsed = $util.Long.fromValue(d.totalBytesParsed)).unsigned = false;
                    else if (typeof d.totalBytesParsed === "string")
                        m.totalBytesParsed = parseInt(d.totalBytesParsed, 10);
                    else if (typeof d.totalBytesParsed === "number")
                        m.totalBytesParsed = d.totalBytesParsed;
                    else if (typeof d.totalBytesParsed === "object")
                        m.totalBytesParsed = new $util.LongBits(d.totalBytesParsed.low >>> 0, d.totalBytesParsed.high >>> 0).toNumber();
                }
                if (d.error != null) {
                    m.error = String(d.error);
                }
                return m;
            };

            /**
             * Creates a plain object from an AppendTraceDataResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {perfetto.protos.AppendTraceDataResult} m AppendTraceDataResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AppendTraceDataResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    if ($util.Long) {
                        var n = new $util.Long(0, 0, false);
                        d.totalBytesParsed = o.longs === String ? n.toString() : o.longs === Number ? n.toNumber() : n;
                    } else
                        d.totalBytesParsed = o.longs === String ? "0" : 0;
                    d.error = "";
                }
                if (m.totalBytesParsed != null && m.hasOwnProperty("totalBytesParsed")) {
                    if (typeof m.totalBytesParsed === "number")
                        d.totalBytesParsed = o.longs === String ? String(m.totalBytesParsed) : m.totalBytesParsed;
                    else
                        d.totalBytesParsed = o.longs === String ? $util.Long.prototype.toString.call(m.totalBytesParsed) : o.longs === Number ? new $util.LongBits(m.totalBytesParsed.low >>> 0, m.totalBytesParsed.high >>> 0).toNumber() : m.totalBytesParsed;
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                return d;
            };

            /**
             * Converts this AppendTraceDataResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.AppendTraceDataResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AppendTraceDataResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AppendTraceDataResult
             * @function getTypeUrl
             * @memberof perfetto.protos.AppendTraceDataResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AppendTraceDataResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.AppendTraceDataResult";
            };

            return AppendTraceDataResult;
        })();

        protos.QueryArgs = (function() {

            /**
             * Properties of a QueryArgs.
             * @memberof perfetto.protos
             * @interface IQueryArgs
             * @property {string|null} [sqlQuery] QueryArgs sqlQuery
             * @property {string|null} [tag] QueryArgs tag
             */

            /**
             * Constructs a new QueryArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a QueryArgs.
             * @implements IQueryArgs
             * @constructor
             * @param {perfetto.protos.IQueryArgs=} [p] Properties to set
             */
            function QueryArgs(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * QueryArgs sqlQuery.
             * @member {string} sqlQuery
             * @memberof perfetto.protos.QueryArgs
             * @instance
             */
            QueryArgs.prototype.sqlQuery = "";

            /**
             * QueryArgs tag.
             * @member {string} tag
             * @memberof perfetto.protos.QueryArgs
             * @instance
             */
            QueryArgs.prototype.tag = "";

            /**
             * Creates a new QueryArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {perfetto.protos.IQueryArgs=} [properties] Properties to set
             * @returns {perfetto.protos.QueryArgs} QueryArgs instance
             */
            QueryArgs.create = function create(properties) {
                return new QueryArgs(properties);
            };

            /**
             * Encodes the specified QueryArgs message. Does not implicitly {@link perfetto.protos.QueryArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {perfetto.protos.IQueryArgs} m QueryArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            QueryArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.sqlQuery != null && Object.hasOwnProperty.call(m, "sqlQuery"))
                    w.uint32(10).string(m.sqlQuery);
                if (m.tag != null && Object.hasOwnProperty.call(m, "tag"))
                    w.uint32(26).string(m.tag);
                return w;
            };

            /**
             * Decodes a QueryArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.QueryArgs} QueryArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            QueryArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.QueryArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.sqlQuery = r.string();
                            break;
                        }
                    case 3: {
                            m.tag = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a QueryArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.QueryArgs} QueryArgs
             */
            QueryArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.QueryArgs)
                    return d;
                var m = new $root.perfetto.protos.QueryArgs();
                if (d.sqlQuery != null) {
                    m.sqlQuery = String(d.sqlQuery);
                }
                if (d.tag != null) {
                    m.tag = String(d.tag);
                }
                return m;
            };

            /**
             * Creates a plain object from a QueryArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {perfetto.protos.QueryArgs} m QueryArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            QueryArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.sqlQuery = "";
                    d.tag = "";
                }
                if (m.sqlQuery != null && m.hasOwnProperty("sqlQuery")) {
                    d.sqlQuery = m.sqlQuery;
                }
                if (m.tag != null && m.hasOwnProperty("tag")) {
                    d.tag = m.tag;
                }
                return d;
            };

            /**
             * Converts this QueryArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.QueryArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            QueryArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for QueryArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.QueryArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            QueryArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.QueryArgs";
            };

            return QueryArgs;
        })();

        protos.QueryResult = (function() {

            /**
             * Properties of a QueryResult.
             * @memberof perfetto.protos
             * @interface IQueryResult
             * @property {Array.<string>|null} [columnNames] QueryResult columnNames
             * @property {string|null} [error] QueryResult error
             * @property {Array.<perfetto.protos.QueryResult.ICellsBatch>|null} [batch] QueryResult batch
             * @property {number|null} [statementCount] QueryResult statementCount
             * @property {number|null} [statementWithOutputCount] QueryResult statementWithOutputCount
             * @property {string|null} [lastStatementSql] QueryResult lastStatementSql
             */

            /**
             * Constructs a new QueryResult.
             * @memberof perfetto.protos
             * @classdesc Represents a QueryResult.
             * @implements IQueryResult
             * @constructor
             * @param {perfetto.protos.IQueryResult=} [p] Properties to set
             */
            function QueryResult(p) {
                this.columnNames = [];
                this.batch = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * QueryResult columnNames.
             * @member {Array.<string>} columnNames
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.columnNames = $util.emptyArray;

            /**
             * QueryResult error.
             * @member {string} error
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.error = "";

            /**
             * QueryResult batch.
             * @member {Array.<perfetto.protos.QueryResult.ICellsBatch>} batch
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.batch = $util.emptyArray;

            /**
             * QueryResult statementCount.
             * @member {number} statementCount
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.statementCount = 0;

            /**
             * QueryResult statementWithOutputCount.
             * @member {number} statementWithOutputCount
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.statementWithOutputCount = 0;

            /**
             * QueryResult lastStatementSql.
             * @member {string} lastStatementSql
             * @memberof perfetto.protos.QueryResult
             * @instance
             */
            QueryResult.prototype.lastStatementSql = "";

            /**
             * Creates a new QueryResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {perfetto.protos.IQueryResult=} [properties] Properties to set
             * @returns {perfetto.protos.QueryResult} QueryResult instance
             */
            QueryResult.create = function create(properties) {
                return new QueryResult(properties);
            };

            /**
             * Encodes the specified QueryResult message. Does not implicitly {@link perfetto.protos.QueryResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {perfetto.protos.IQueryResult} m QueryResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            QueryResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.columnNames != null && m.columnNames.length) {
                    for (var i = 0; i < m.columnNames.length; ++i)
                        w.uint32(10).string(m.columnNames[i]);
                }
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(18).string(m.error);
                if (m.batch != null && m.batch.length) {
                    for (var i = 0; i < m.batch.length; ++i)
                        $root.perfetto.protos.QueryResult.CellsBatch.encode(m.batch[i], w.uint32(26).fork()).ldelim();
                }
                if (m.statementCount != null && Object.hasOwnProperty.call(m, "statementCount"))
                    w.uint32(32).uint32(m.statementCount);
                if (m.statementWithOutputCount != null && Object.hasOwnProperty.call(m, "statementWithOutputCount"))
                    w.uint32(40).uint32(m.statementWithOutputCount);
                if (m.lastStatementSql != null && Object.hasOwnProperty.call(m, "lastStatementSql"))
                    w.uint32(50).string(m.lastStatementSql);
                return w;
            };

            /**
             * Decodes a QueryResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.QueryResult} QueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            QueryResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.QueryResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.columnNames && m.columnNames.length))
                                m.columnNames = [];
                            m.columnNames.push(r.string());
                            break;
                        }
                    case 2: {
                            m.error = r.string();
                            break;
                        }
                    case 3: {
                            if (!(m.batch && m.batch.length))
                                m.batch = [];
                            m.batch.push($root.perfetto.protos.QueryResult.CellsBatch.decode(r, r.uint32()));
                            break;
                        }
                    case 4: {
                            m.statementCount = r.uint32();
                            break;
                        }
                    case 5: {
                            m.statementWithOutputCount = r.uint32();
                            break;
                        }
                    case 6: {
                            m.lastStatementSql = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a QueryResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.QueryResult} QueryResult
             */
            QueryResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.QueryResult)
                    return d;
                var m = new $root.perfetto.protos.QueryResult();
                if (d.columnNames) {
                    if (!Array.isArray(d.columnNames))
                        throw TypeError(".perfetto.protos.QueryResult.columnNames: array expected");
                    m.columnNames = [];
                    for (var i = 0; i < d.columnNames.length; ++i) {
                        m.columnNames[i] = String(d.columnNames[i]);
                    }
                }
                if (d.error != null) {
                    m.error = String(d.error);
                }
                if (d.batch) {
                    if (!Array.isArray(d.batch))
                        throw TypeError(".perfetto.protos.QueryResult.batch: array expected");
                    m.batch = [];
                    for (var i = 0; i < d.batch.length; ++i) {
                        if (typeof d.batch[i] !== "object")
                            throw TypeError(".perfetto.protos.QueryResult.batch: object expected");
                        m.batch[i] = $root.perfetto.protos.QueryResult.CellsBatch.fromObject(d.batch[i]);
                    }
                }
                if (d.statementCount != null) {
                    m.statementCount = d.statementCount >>> 0;
                }
                if (d.statementWithOutputCount != null) {
                    m.statementWithOutputCount = d.statementWithOutputCount >>> 0;
                }
                if (d.lastStatementSql != null) {
                    m.lastStatementSql = String(d.lastStatementSql);
                }
                return m;
            };

            /**
             * Creates a plain object from a QueryResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {perfetto.protos.QueryResult} m QueryResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            QueryResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.columnNames = [];
                    d.batch = [];
                }
                if (o.defaults) {
                    d.error = "";
                    d.statementCount = 0;
                    d.statementWithOutputCount = 0;
                    d.lastStatementSql = "";
                }
                if (m.columnNames && m.columnNames.length) {
                    d.columnNames = [];
                    for (var j = 0; j < m.columnNames.length; ++j) {
                        d.columnNames[j] = m.columnNames[j];
                    }
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                if (m.batch && m.batch.length) {
                    d.batch = [];
                    for (var j = 0; j < m.batch.length; ++j) {
                        d.batch[j] = $root.perfetto.protos.QueryResult.CellsBatch.toObject(m.batch[j], o);
                    }
                }
                if (m.statementCount != null && m.hasOwnProperty("statementCount")) {
                    d.statementCount = m.statementCount;
                }
                if (m.statementWithOutputCount != null && m.hasOwnProperty("statementWithOutputCount")) {
                    d.statementWithOutputCount = m.statementWithOutputCount;
                }
                if (m.lastStatementSql != null && m.hasOwnProperty("lastStatementSql")) {
                    d.lastStatementSql = m.lastStatementSql;
                }
                return d;
            };

            /**
             * Converts this QueryResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.QueryResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            QueryResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for QueryResult
             * @function getTypeUrl
             * @memberof perfetto.protos.QueryResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            QueryResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.QueryResult";
            };

            QueryResult.CellsBatch = (function() {

                /**
                 * Properties of a CellsBatch.
                 * @memberof perfetto.protos.QueryResult
                 * @interface ICellsBatch
                 * @property {Array.<perfetto.protos.QueryResult.CellsBatch.CellType>|null} [cells] CellsBatch cells
                 * @property {Array.<number>|null} [varintCells] CellsBatch varintCells
                 * @property {Array.<number>|null} [float64Cells] CellsBatch float64Cells
                 * @property {Array.<Uint8Array>|null} [blobCells] CellsBatch blobCells
                 * @property {string|null} [stringCells] CellsBatch stringCells
                 * @property {boolean|null} [isLastBatch] CellsBatch isLastBatch
                 */

                /**
                 * Constructs a new CellsBatch.
                 * @memberof perfetto.protos.QueryResult
                 * @classdesc Represents a CellsBatch.
                 * @implements ICellsBatch
                 * @constructor
                 * @param {perfetto.protos.QueryResult.ICellsBatch=} [p] Properties to set
                 */
                function CellsBatch(p) {
                    this.cells = [];
                    this.varintCells = [];
                    this.float64Cells = [];
                    this.blobCells = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * CellsBatch cells.
                 * @member {Array.<perfetto.protos.QueryResult.CellsBatch.CellType>} cells
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.cells = $util.emptyArray;

                /**
                 * CellsBatch varintCells.
                 * @member {Array.<number>} varintCells
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.varintCells = $util.emptyArray;

                /**
                 * CellsBatch float64Cells.
                 * @member {Array.<number>} float64Cells
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.float64Cells = $util.emptyArray;

                /**
                 * CellsBatch blobCells.
                 * @member {Array.<Uint8Array>} blobCells
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.blobCells = $util.emptyArray;

                /**
                 * CellsBatch stringCells.
                 * @member {string} stringCells
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.stringCells = "";

                /**
                 * CellsBatch isLastBatch.
                 * @member {boolean} isLastBatch
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 */
                CellsBatch.prototype.isLastBatch = false;

                /**
                 * Creates a new CellsBatch instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {perfetto.protos.QueryResult.ICellsBatch=} [properties] Properties to set
                 * @returns {perfetto.protos.QueryResult.CellsBatch} CellsBatch instance
                 */
                CellsBatch.create = function create(properties) {
                    return new CellsBatch(properties);
                };

                /**
                 * Encodes the specified CellsBatch message. Does not implicitly {@link perfetto.protos.QueryResult.CellsBatch.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {perfetto.protos.QueryResult.ICellsBatch} m CellsBatch message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                CellsBatch.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.cells != null && m.cells.length) {
                        w.uint32(10).fork();
                        for (var i = 0; i < m.cells.length; ++i)
                            w.int32(m.cells[i]);
                        w.ldelim();
                    }
                    if (m.varintCells != null && m.varintCells.length) {
                        w.uint32(18).fork();
                        for (var i = 0; i < m.varintCells.length; ++i)
                            w.int64(m.varintCells[i]);
                        w.ldelim();
                    }
                    if (m.float64Cells != null && m.float64Cells.length) {
                        w.uint32(26).fork();
                        for (var i = 0; i < m.float64Cells.length; ++i)
                            w.double(m.float64Cells[i]);
                        w.ldelim();
                    }
                    if (m.blobCells != null && m.blobCells.length) {
                        for (var i = 0; i < m.blobCells.length; ++i)
                            w.uint32(34).bytes(m.blobCells[i]);
                    }
                    if (m.stringCells != null && Object.hasOwnProperty.call(m, "stringCells"))
                        w.uint32(42).string(m.stringCells);
                    if (m.isLastBatch != null && Object.hasOwnProperty.call(m, "isLastBatch"))
                        w.uint32(48).bool(m.isLastBatch);
                    return w;
                };

                /**
                 * Decodes a CellsBatch message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.QueryResult.CellsBatch} CellsBatch
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                CellsBatch.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.QueryResult.CellsBatch();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                if (!(m.cells && m.cells.length))
                                    m.cells = [];
                                if ((t & 7) === 2) {
                                    var c2 = r.uint32() + r.pos;
                                    while (r.pos < c2)
                                        m.cells.push(r.int32());
                                } else
                                    m.cells.push(r.int32());
                                break;
                            }
                        case 2: {
                                if (!(m.varintCells && m.varintCells.length))
                                    m.varintCells = [];
                                if ((t & 7) === 2) {
                                    var c2 = r.uint32() + r.pos;
                                    while (r.pos < c2)
                                        m.varintCells.push(r.int64());
                                } else
                                    m.varintCells.push(r.int64());
                                break;
                            }
                        case 3: {
                                if (!(m.float64Cells && m.float64Cells.length))
                                    m.float64Cells = [];
                                if ((t & 7) === 2) {
                                    var c2 = r.uint32() + r.pos;
                                    while (r.pos < c2)
                                        m.float64Cells.push(r.double());
                                } else
                                    m.float64Cells.push(r.double());
                                break;
                            }
                        case 4: {
                                if (!(m.blobCells && m.blobCells.length))
                                    m.blobCells = [];
                                m.blobCells.push(r.bytes());
                                break;
                            }
                        case 5: {
                                m.stringCells = r.string();
                                break;
                            }
                        case 6: {
                                m.isLastBatch = r.bool();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a CellsBatch message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.QueryResult.CellsBatch} CellsBatch
                 */
                CellsBatch.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.QueryResult.CellsBatch)
                        return d;
                    var m = new $root.perfetto.protos.QueryResult.CellsBatch();
                    if (d.cells) {
                        if (!Array.isArray(d.cells))
                            throw TypeError(".perfetto.protos.QueryResult.CellsBatch.cells: array expected");
                        m.cells = [];
                        for (var i = 0; i < d.cells.length; ++i) {
                            switch (d.cells[i]) {
                            default:
                                if (typeof d.cells[i] === "number") {
                                    m.cells[i] = d.cells[i];
                                    break;
                                }
                            case "CELL_INVALID":
                            case 0:
                                m.cells[i] = 0;
                                break;
                            case "CELL_NULL":
                            case 1:
                                m.cells[i] = 1;
                                break;
                            case "CELL_VARINT":
                            case 2:
                                m.cells[i] = 2;
                                break;
                            case "CELL_FLOAT64":
                            case 3:
                                m.cells[i] = 3;
                                break;
                            case "CELL_STRING":
                            case 4:
                                m.cells[i] = 4;
                                break;
                            case "CELL_BLOB":
                            case 5:
                                m.cells[i] = 5;
                                break;
                            }
                        }
                    }
                    if (d.varintCells) {
                        if (!Array.isArray(d.varintCells))
                            throw TypeError(".perfetto.protos.QueryResult.CellsBatch.varintCells: array expected");
                        m.varintCells = [];
                        for (var i = 0; i < d.varintCells.length; ++i) {
                            if ($util.Long)
                                (m.varintCells[i] = $util.Long.fromValue(d.varintCells[i])).unsigned = false;
                            else if (typeof d.varintCells[i] === "string")
                                m.varintCells[i] = parseInt(d.varintCells[i], 10);
                            else if (typeof d.varintCells[i] === "number")
                                m.varintCells[i] = d.varintCells[i];
                            else if (typeof d.varintCells[i] === "object")
                                m.varintCells[i] = new $util.LongBits(d.varintCells[i].low >>> 0, d.varintCells[i].high >>> 0).toNumber();
                        }
                    }
                    if (d.float64Cells) {
                        if (!Array.isArray(d.float64Cells))
                            throw TypeError(".perfetto.protos.QueryResult.CellsBatch.float64Cells: array expected");
                        m.float64Cells = [];
                        for (var i = 0; i < d.float64Cells.length; ++i) {
                            m.float64Cells[i] = Number(d.float64Cells[i]);
                        }
                    }
                    if (d.blobCells) {
                        if (!Array.isArray(d.blobCells))
                            throw TypeError(".perfetto.protos.QueryResult.CellsBatch.blobCells: array expected");
                        m.blobCells = [];
                        for (var i = 0; i < d.blobCells.length; ++i) {
                            if (typeof d.blobCells[i] === "string")
                                $util.base64.decode(d.blobCells[i], m.blobCells[i] = $util.newBuffer($util.base64.length(d.blobCells[i])), 0);
                            else if (d.blobCells[i].length >= 0)
                                m.blobCells[i] = d.blobCells[i];
                        }
                    }
                    if (d.stringCells != null) {
                        m.stringCells = String(d.stringCells);
                    }
                    if (d.isLastBatch != null) {
                        m.isLastBatch = Boolean(d.isLastBatch);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a CellsBatch message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {perfetto.protos.QueryResult.CellsBatch} m CellsBatch
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                CellsBatch.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.cells = [];
                        d.varintCells = [];
                        d.float64Cells = [];
                        d.blobCells = [];
                    }
                    if (o.defaults) {
                        d.stringCells = "";
                        d.isLastBatch = false;
                    }
                    if (m.cells && m.cells.length) {
                        d.cells = [];
                        for (var j = 0; j < m.cells.length; ++j) {
                            d.cells[j] = o.enums === String ? $root.perfetto.protos.QueryResult.CellsBatch.CellType[m.cells[j]] === undefined ? m.cells[j] : $root.perfetto.protos.QueryResult.CellsBatch.CellType[m.cells[j]] : m.cells[j];
                        }
                    }
                    if (m.varintCells && m.varintCells.length) {
                        d.varintCells = [];
                        for (var j = 0; j < m.varintCells.length; ++j) {
                            if (typeof m.varintCells[j] === "number")
                                d.varintCells[j] = o.longs === String ? String(m.varintCells[j]) : m.varintCells[j];
                            else
                                d.varintCells[j] = o.longs === String ? $util.Long.prototype.toString.call(m.varintCells[j]) : o.longs === Number ? new $util.LongBits(m.varintCells[j].low >>> 0, m.varintCells[j].high >>> 0).toNumber() : m.varintCells[j];
                        }
                    }
                    if (m.float64Cells && m.float64Cells.length) {
                        d.float64Cells = [];
                        for (var j = 0; j < m.float64Cells.length; ++j) {
                            d.float64Cells[j] = o.json && !isFinite(m.float64Cells[j]) ? String(m.float64Cells[j]) : m.float64Cells[j];
                        }
                    }
                    if (m.blobCells && m.blobCells.length) {
                        d.blobCells = [];
                        for (var j = 0; j < m.blobCells.length; ++j) {
                            d.blobCells[j] = o.bytes === String ? $util.base64.encode(m.blobCells[j], 0, m.blobCells[j].length) : o.bytes === Array ? Array.prototype.slice.call(m.blobCells[j]) : m.blobCells[j];
                        }
                    }
                    if (m.stringCells != null && m.hasOwnProperty("stringCells")) {
                        d.stringCells = m.stringCells;
                    }
                    if (m.isLastBatch != null && m.hasOwnProperty("isLastBatch")) {
                        d.isLastBatch = m.isLastBatch;
                    }
                    return d;
                };

                /**
                 * Converts this CellsBatch to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                CellsBatch.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for CellsBatch
                 * @function getTypeUrl
                 * @memberof perfetto.protos.QueryResult.CellsBatch
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                CellsBatch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.QueryResult.CellsBatch";
                };

                /**
                 * CellType enum.
                 * @name perfetto.protos.QueryResult.CellsBatch.CellType
                 * @enum {number}
                 * @property {number} CELL_INVALID=0 CELL_INVALID value
                 * @property {number} CELL_NULL=1 CELL_NULL value
                 * @property {number} CELL_VARINT=2 CELL_VARINT value
                 * @property {number} CELL_FLOAT64=3 CELL_FLOAT64 value
                 * @property {number} CELL_STRING=4 CELL_STRING value
                 * @property {number} CELL_BLOB=5 CELL_BLOB value
                 */
                CellsBatch.CellType = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "CELL_INVALID"] = 0;
                    values[valuesById[1] = "CELL_NULL"] = 1;
                    values[valuesById[2] = "CELL_VARINT"] = 2;
                    values[valuesById[3] = "CELL_FLOAT64"] = 3;
                    values[valuesById[4] = "CELL_STRING"] = 4;
                    values[valuesById[5] = "CELL_BLOB"] = 5;
                    return values;
                })();

                return CellsBatch;
            })();

            return QueryResult;
        })();

        protos.StatusArgs = (function() {

            /**
             * Properties of a StatusArgs.
             * @memberof perfetto.protos
             * @interface IStatusArgs
             */

            /**
             * Constructs a new StatusArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a StatusArgs.
             * @implements IStatusArgs
             * @constructor
             * @param {perfetto.protos.IStatusArgs=} [p] Properties to set
             */
            function StatusArgs(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * Creates a new StatusArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {perfetto.protos.IStatusArgs=} [properties] Properties to set
             * @returns {perfetto.protos.StatusArgs} StatusArgs instance
             */
            StatusArgs.create = function create(properties) {
                return new StatusArgs(properties);
            };

            /**
             * Encodes the specified StatusArgs message. Does not implicitly {@link perfetto.protos.StatusArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {perfetto.protos.IStatusArgs} m StatusArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StatusArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                return w;
            };

            /**
             * Decodes a StatusArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.StatusArgs} StatusArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StatusArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.StatusArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a StatusArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.StatusArgs} StatusArgs
             */
            StatusArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.StatusArgs)
                    return d;
                return new $root.perfetto.protos.StatusArgs();
            };

            /**
             * Creates a plain object from a StatusArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {perfetto.protos.StatusArgs} m StatusArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            StatusArgs.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this StatusArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.StatusArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            StatusArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for StatusArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.StatusArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StatusArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.StatusArgs";
            };

            return StatusArgs;
        })();

        protos.StatusResult = (function() {

            /**
             * Properties of a StatusResult.
             * @memberof perfetto.protos
             * @interface IStatusResult
             * @property {string|null} [loadedTraceName] StatusResult loadedTraceName
             * @property {string|null} [humanReadableVersion] StatusResult humanReadableVersion
             * @property {number|null} [apiVersion] StatusResult apiVersion
             * @property {string|null} [versionCode] StatusResult versionCode
             */

            /**
             * Constructs a new StatusResult.
             * @memberof perfetto.protos
             * @classdesc Represents a StatusResult.
             * @implements IStatusResult
             * @constructor
             * @param {perfetto.protos.IStatusResult=} [p] Properties to set
             */
            function StatusResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * StatusResult loadedTraceName.
             * @member {string} loadedTraceName
             * @memberof perfetto.protos.StatusResult
             * @instance
             */
            StatusResult.prototype.loadedTraceName = "";

            /**
             * StatusResult humanReadableVersion.
             * @member {string} humanReadableVersion
             * @memberof perfetto.protos.StatusResult
             * @instance
             */
            StatusResult.prototype.humanReadableVersion = "";

            /**
             * StatusResult apiVersion.
             * @member {number} apiVersion
             * @memberof perfetto.protos.StatusResult
             * @instance
             */
            StatusResult.prototype.apiVersion = 0;

            /**
             * StatusResult versionCode.
             * @member {string} versionCode
             * @memberof perfetto.protos.StatusResult
             * @instance
             */
            StatusResult.prototype.versionCode = "";

            /**
             * Creates a new StatusResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {perfetto.protos.IStatusResult=} [properties] Properties to set
             * @returns {perfetto.protos.StatusResult} StatusResult instance
             */
            StatusResult.create = function create(properties) {
                return new StatusResult(properties);
            };

            /**
             * Encodes the specified StatusResult message. Does not implicitly {@link perfetto.protos.StatusResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {perfetto.protos.IStatusResult} m StatusResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            StatusResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.loadedTraceName != null && Object.hasOwnProperty.call(m, "loadedTraceName"))
                    w.uint32(10).string(m.loadedTraceName);
                if (m.humanReadableVersion != null && Object.hasOwnProperty.call(m, "humanReadableVersion"))
                    w.uint32(18).string(m.humanReadableVersion);
                if (m.apiVersion != null && Object.hasOwnProperty.call(m, "apiVersion"))
                    w.uint32(24).int32(m.apiVersion);
                if (m.versionCode != null && Object.hasOwnProperty.call(m, "versionCode"))
                    w.uint32(34).string(m.versionCode);
                return w;
            };

            /**
             * Decodes a StatusResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.StatusResult} StatusResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            StatusResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.StatusResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.loadedTraceName = r.string();
                            break;
                        }
                    case 2: {
                            m.humanReadableVersion = r.string();
                            break;
                        }
                    case 3: {
                            m.apiVersion = r.int32();
                            break;
                        }
                    case 4: {
                            m.versionCode = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a StatusResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.StatusResult} StatusResult
             */
            StatusResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.StatusResult)
                    return d;
                var m = new $root.perfetto.protos.StatusResult();
                if (d.loadedTraceName != null) {
                    m.loadedTraceName = String(d.loadedTraceName);
                }
                if (d.humanReadableVersion != null) {
                    m.humanReadableVersion = String(d.humanReadableVersion);
                }
                if (d.apiVersion != null) {
                    m.apiVersion = d.apiVersion | 0;
                }
                if (d.versionCode != null) {
                    m.versionCode = String(d.versionCode);
                }
                return m;
            };

            /**
             * Creates a plain object from a StatusResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {perfetto.protos.StatusResult} m StatusResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            StatusResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.loadedTraceName = "";
                    d.humanReadableVersion = "";
                    d.apiVersion = 0;
                    d.versionCode = "";
                }
                if (m.loadedTraceName != null && m.hasOwnProperty("loadedTraceName")) {
                    d.loadedTraceName = m.loadedTraceName;
                }
                if (m.humanReadableVersion != null && m.hasOwnProperty("humanReadableVersion")) {
                    d.humanReadableVersion = m.humanReadableVersion;
                }
                if (m.apiVersion != null && m.hasOwnProperty("apiVersion")) {
                    d.apiVersion = m.apiVersion;
                }
                if (m.versionCode != null && m.hasOwnProperty("versionCode")) {
                    d.versionCode = m.versionCode;
                }
                return d;
            };

            /**
             * Converts this StatusResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.StatusResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            StatusResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for StatusResult
             * @function getTypeUrl
             * @memberof perfetto.protos.StatusResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            StatusResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.StatusResult";
            };

            return StatusResult;
        })();

        protos.ComputeMetricArgs = (function() {

            /**
             * Properties of a ComputeMetricArgs.
             * @memberof perfetto.protos
             * @interface IComputeMetricArgs
             * @property {Array.<string>|null} [metricNames] ComputeMetricArgs metricNames
             * @property {perfetto.protos.ComputeMetricArgs.ResultFormat|null} [format] ComputeMetricArgs format
             */

            /**
             * Constructs a new ComputeMetricArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a ComputeMetricArgs.
             * @implements IComputeMetricArgs
             * @constructor
             * @param {perfetto.protos.IComputeMetricArgs=} [p] Properties to set
             */
            function ComputeMetricArgs(p) {
                this.metricNames = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * ComputeMetricArgs metricNames.
             * @member {Array.<string>} metricNames
             * @memberof perfetto.protos.ComputeMetricArgs
             * @instance
             */
            ComputeMetricArgs.prototype.metricNames = $util.emptyArray;

            /**
             * ComputeMetricArgs format.
             * @member {perfetto.protos.ComputeMetricArgs.ResultFormat} format
             * @memberof perfetto.protos.ComputeMetricArgs
             * @instance
             */
            ComputeMetricArgs.prototype.format = 0;

            /**
             * Creates a new ComputeMetricArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {perfetto.protos.IComputeMetricArgs=} [properties] Properties to set
             * @returns {perfetto.protos.ComputeMetricArgs} ComputeMetricArgs instance
             */
            ComputeMetricArgs.create = function create(properties) {
                return new ComputeMetricArgs(properties);
            };

            /**
             * Encodes the specified ComputeMetricArgs message. Does not implicitly {@link perfetto.protos.ComputeMetricArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {perfetto.protos.IComputeMetricArgs} m ComputeMetricArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ComputeMetricArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.metricNames != null && m.metricNames.length) {
                    for (var i = 0; i < m.metricNames.length; ++i)
                        w.uint32(10).string(m.metricNames[i]);
                }
                if (m.format != null && Object.hasOwnProperty.call(m, "format"))
                    w.uint32(16).int32(m.format);
                return w;
            };

            /**
             * Decodes a ComputeMetricArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.ComputeMetricArgs} ComputeMetricArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ComputeMetricArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.ComputeMetricArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.metricNames && m.metricNames.length))
                                m.metricNames = [];
                            m.metricNames.push(r.string());
                            break;
                        }
                    case 2: {
                            m.format = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a ComputeMetricArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.ComputeMetricArgs} ComputeMetricArgs
             */
            ComputeMetricArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.ComputeMetricArgs)
                    return d;
                var m = new $root.perfetto.protos.ComputeMetricArgs();
                if (d.metricNames) {
                    if (!Array.isArray(d.metricNames))
                        throw TypeError(".perfetto.protos.ComputeMetricArgs.metricNames: array expected");
                    m.metricNames = [];
                    for (var i = 0; i < d.metricNames.length; ++i) {
                        m.metricNames[i] = String(d.metricNames[i]);
                    }
                }
                switch (d.format) {
                default:
                    if (typeof d.format === "number") {
                        m.format = d.format;
                        break;
                    }
                    break;
                case "BINARY_PROTOBUF":
                case 0:
                    m.format = 0;
                    break;
                case "TEXTPROTO":
                case 1:
                    m.format = 1;
                    break;
                case "JSON":
                case 2:
                    m.format = 2;
                    break;
                }
                return m;
            };

            /**
             * Creates a plain object from a ComputeMetricArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {perfetto.protos.ComputeMetricArgs} m ComputeMetricArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ComputeMetricArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.metricNames = [];
                }
                if (o.defaults) {
                    d.format = o.enums === String ? "BINARY_PROTOBUF" : 0;
                }
                if (m.metricNames && m.metricNames.length) {
                    d.metricNames = [];
                    for (var j = 0; j < m.metricNames.length; ++j) {
                        d.metricNames[j] = m.metricNames[j];
                    }
                }
                if (m.format != null && m.hasOwnProperty("format")) {
                    d.format = o.enums === String ? $root.perfetto.protos.ComputeMetricArgs.ResultFormat[m.format] === undefined ? m.format : $root.perfetto.protos.ComputeMetricArgs.ResultFormat[m.format] : m.format;
                }
                return d;
            };

            /**
             * Converts this ComputeMetricArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ComputeMetricArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ComputeMetricArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ComputeMetricArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.ComputeMetricArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ComputeMetricArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.ComputeMetricArgs";
            };

            /**
             * ResultFormat enum.
             * @name perfetto.protos.ComputeMetricArgs.ResultFormat
             * @enum {number}
             * @property {number} BINARY_PROTOBUF=0 BINARY_PROTOBUF value
             * @property {number} TEXTPROTO=1 TEXTPROTO value
             * @property {number} JSON=2 JSON value
             */
            ComputeMetricArgs.ResultFormat = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "BINARY_PROTOBUF"] = 0;
                values[valuesById[1] = "TEXTPROTO"] = 1;
                values[valuesById[2] = "JSON"] = 2;
                return values;
            })();

            return ComputeMetricArgs;
        })();

        protos.ComputeMetricResult = (function() {

            /**
             * Properties of a ComputeMetricResult.
             * @memberof perfetto.protos
             * @interface IComputeMetricResult
             * @property {Uint8Array|null} [metrics] ComputeMetricResult metrics
             * @property {string|null} [metricsAsPrototext] ComputeMetricResult metricsAsPrototext
             * @property {string|null} [metricsAsJson] ComputeMetricResult metricsAsJson
             * @property {string|null} [error] ComputeMetricResult error
             */

            /**
             * Constructs a new ComputeMetricResult.
             * @memberof perfetto.protos
             * @classdesc Represents a ComputeMetricResult.
             * @implements IComputeMetricResult
             * @constructor
             * @param {perfetto.protos.IComputeMetricResult=} [p] Properties to set
             */
            function ComputeMetricResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * ComputeMetricResult metrics.
             * @member {Uint8Array|null|undefined} metrics
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             */
            ComputeMetricResult.prototype.metrics = null;

            /**
             * ComputeMetricResult metricsAsPrototext.
             * @member {string|null|undefined} metricsAsPrototext
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             */
            ComputeMetricResult.prototype.metricsAsPrototext = null;

            /**
             * ComputeMetricResult metricsAsJson.
             * @member {string|null|undefined} metricsAsJson
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             */
            ComputeMetricResult.prototype.metricsAsJson = null;

            /**
             * ComputeMetricResult error.
             * @member {string} error
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             */
            ComputeMetricResult.prototype.error = "";

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * ComputeMetricResult result.
             * @member {"metrics"|"metricsAsPrototext"|"metricsAsJson"|undefined} result
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             */
            Object.defineProperty(ComputeMetricResult.prototype, "result", {
                get: $util.oneOfGetter($oneOfFields = ["metrics", "metricsAsPrototext", "metricsAsJson"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ComputeMetricResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {perfetto.protos.IComputeMetricResult=} [properties] Properties to set
             * @returns {perfetto.protos.ComputeMetricResult} ComputeMetricResult instance
             */
            ComputeMetricResult.create = function create(properties) {
                return new ComputeMetricResult(properties);
            };

            /**
             * Encodes the specified ComputeMetricResult message. Does not implicitly {@link perfetto.protos.ComputeMetricResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {perfetto.protos.IComputeMetricResult} m ComputeMetricResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ComputeMetricResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.metrics != null && Object.hasOwnProperty.call(m, "metrics"))
                    w.uint32(10).bytes(m.metrics);
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(18).string(m.error);
                if (m.metricsAsPrototext != null && Object.hasOwnProperty.call(m, "metricsAsPrototext"))
                    w.uint32(26).string(m.metricsAsPrototext);
                if (m.metricsAsJson != null && Object.hasOwnProperty.call(m, "metricsAsJson"))
                    w.uint32(34).string(m.metricsAsJson);
                return w;
            };

            /**
             * Decodes a ComputeMetricResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.ComputeMetricResult} ComputeMetricResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ComputeMetricResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.ComputeMetricResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.metrics = r.bytes();
                            break;
                        }
                    case 3: {
                            m.metricsAsPrototext = r.string();
                            break;
                        }
                    case 4: {
                            m.metricsAsJson = r.string();
                            break;
                        }
                    case 2: {
                            m.error = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a ComputeMetricResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.ComputeMetricResult} ComputeMetricResult
             */
            ComputeMetricResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.ComputeMetricResult)
                    return d;
                var m = new $root.perfetto.protos.ComputeMetricResult();
                if (d.metrics != null) {
                    if (typeof d.metrics === "string")
                        $util.base64.decode(d.metrics, m.metrics = $util.newBuffer($util.base64.length(d.metrics)), 0);
                    else if (d.metrics.length >= 0)
                        m.metrics = d.metrics;
                }
                if (d.metricsAsPrototext != null) {
                    m.metricsAsPrototext = String(d.metricsAsPrototext);
                }
                if (d.metricsAsJson != null) {
                    m.metricsAsJson = String(d.metricsAsJson);
                }
                if (d.error != null) {
                    m.error = String(d.error);
                }
                return m;
            };

            /**
             * Creates a plain object from a ComputeMetricResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {perfetto.protos.ComputeMetricResult} m ComputeMetricResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ComputeMetricResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.error = "";
                }
                if (m.metrics != null && m.hasOwnProperty("metrics")) {
                    d.metrics = o.bytes === String ? $util.base64.encode(m.metrics, 0, m.metrics.length) : o.bytes === Array ? Array.prototype.slice.call(m.metrics) : m.metrics;
                    if (o.oneofs)
                        d.result = "metrics";
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                if (m.metricsAsPrototext != null && m.hasOwnProperty("metricsAsPrototext")) {
                    d.metricsAsPrototext = m.metricsAsPrototext;
                    if (o.oneofs)
                        d.result = "metricsAsPrototext";
                }
                if (m.metricsAsJson != null && m.hasOwnProperty("metricsAsJson")) {
                    d.metricsAsJson = m.metricsAsJson;
                    if (o.oneofs)
                        d.result = "metricsAsJson";
                }
                return d;
            };

            /**
             * Converts this ComputeMetricResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ComputeMetricResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ComputeMetricResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ComputeMetricResult
             * @function getTypeUrl
             * @memberof perfetto.protos.ComputeMetricResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ComputeMetricResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.ComputeMetricResult";
            };

            return ComputeMetricResult;
        })();

        protos.EnableMetatraceArgs = (function() {

            /**
             * Properties of an EnableMetatraceArgs.
             * @memberof perfetto.protos
             * @interface IEnableMetatraceArgs
             * @property {perfetto.protos.MetatraceCategories|null} [categories] EnableMetatraceArgs categories
             */

            /**
             * Constructs a new EnableMetatraceArgs.
             * @memberof perfetto.protos
             * @classdesc Represents an EnableMetatraceArgs.
             * @implements IEnableMetatraceArgs
             * @constructor
             * @param {perfetto.protos.IEnableMetatraceArgs=} [p] Properties to set
             */
            function EnableMetatraceArgs(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * EnableMetatraceArgs categories.
             * @member {perfetto.protos.MetatraceCategories} categories
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @instance
             */
            EnableMetatraceArgs.prototype.categories = 1;

            /**
             * Creates a new EnableMetatraceArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {perfetto.protos.IEnableMetatraceArgs=} [properties] Properties to set
             * @returns {perfetto.protos.EnableMetatraceArgs} EnableMetatraceArgs instance
             */
            EnableMetatraceArgs.create = function create(properties) {
                return new EnableMetatraceArgs(properties);
            };

            /**
             * Encodes the specified EnableMetatraceArgs message. Does not implicitly {@link perfetto.protos.EnableMetatraceArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {perfetto.protos.IEnableMetatraceArgs} m EnableMetatraceArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnableMetatraceArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.categories != null && Object.hasOwnProperty.call(m, "categories"))
                    w.uint32(8).int32(m.categories);
                return w;
            };

            /**
             * Decodes an EnableMetatraceArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.EnableMetatraceArgs} EnableMetatraceArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnableMetatraceArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.EnableMetatraceArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.categories = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an EnableMetatraceArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.EnableMetatraceArgs} EnableMetatraceArgs
             */
            EnableMetatraceArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.EnableMetatraceArgs)
                    return d;
                var m = new $root.perfetto.protos.EnableMetatraceArgs();
                switch (d.categories) {
                default:
                    if (typeof d.categories === "number") {
                        m.categories = d.categories;
                        break;
                    }
                    break;
                case "QUERY_TIMELINE":
                case 1:
                    m.categories = 1;
                    break;
                case "QUERY_DETAILED":
                case 2:
                    m.categories = 2;
                    break;
                case "FUNCTION_CALL":
                case 4:
                    m.categories = 4;
                    break;
                case "DB":
                case 8:
                    m.categories = 8;
                    break;
                case "API_TIMELINE":
                case 16:
                    m.categories = 16;
                    break;
                case "NONE":
                case 0:
                    m.categories = 0;
                    break;
                case "ALL":
                case 31:
                    m.categories = 31;
                    break;
                }
                return m;
            };

            /**
             * Creates a plain object from an EnableMetatraceArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {perfetto.protos.EnableMetatraceArgs} m EnableMetatraceArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnableMetatraceArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.categories = o.enums === String ? "QUERY_TIMELINE" : 1;
                }
                if (m.categories != null && m.hasOwnProperty("categories")) {
                    d.categories = o.enums === String ? $root.perfetto.protos.MetatraceCategories[m.categories] === undefined ? m.categories : $root.perfetto.protos.MetatraceCategories[m.categories] : m.categories;
                }
                return d;
            };

            /**
             * Converts this EnableMetatraceArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnableMetatraceArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for EnableMetatraceArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.EnableMetatraceArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            EnableMetatraceArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.EnableMetatraceArgs";
            };

            return EnableMetatraceArgs;
        })();

        protos.EnableMetatraceResult = (function() {

            /**
             * Properties of an EnableMetatraceResult.
             * @memberof perfetto.protos
             * @interface IEnableMetatraceResult
             */

            /**
             * Constructs a new EnableMetatraceResult.
             * @memberof perfetto.protos
             * @classdesc Represents an EnableMetatraceResult.
             * @implements IEnableMetatraceResult
             * @constructor
             * @param {perfetto.protos.IEnableMetatraceResult=} [p] Properties to set
             */
            function EnableMetatraceResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * Creates a new EnableMetatraceResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {perfetto.protos.IEnableMetatraceResult=} [properties] Properties to set
             * @returns {perfetto.protos.EnableMetatraceResult} EnableMetatraceResult instance
             */
            EnableMetatraceResult.create = function create(properties) {
                return new EnableMetatraceResult(properties);
            };

            /**
             * Encodes the specified EnableMetatraceResult message. Does not implicitly {@link perfetto.protos.EnableMetatraceResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {perfetto.protos.IEnableMetatraceResult} m EnableMetatraceResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnableMetatraceResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                return w;
            };

            /**
             * Decodes an EnableMetatraceResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.EnableMetatraceResult} EnableMetatraceResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnableMetatraceResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.EnableMetatraceResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an EnableMetatraceResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.EnableMetatraceResult} EnableMetatraceResult
             */
            EnableMetatraceResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.EnableMetatraceResult)
                    return d;
                return new $root.perfetto.protos.EnableMetatraceResult();
            };

            /**
             * Creates a plain object from an EnableMetatraceResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {perfetto.protos.EnableMetatraceResult} m EnableMetatraceResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnableMetatraceResult.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this EnableMetatraceResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.EnableMetatraceResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnableMetatraceResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for EnableMetatraceResult
             * @function getTypeUrl
             * @memberof perfetto.protos.EnableMetatraceResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            EnableMetatraceResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.EnableMetatraceResult";
            };

            return EnableMetatraceResult;
        })();

        protos.DisableAndReadMetatraceArgs = (function() {

            /**
             * Properties of a DisableAndReadMetatraceArgs.
             * @memberof perfetto.protos
             * @interface IDisableAndReadMetatraceArgs
             */

            /**
             * Constructs a new DisableAndReadMetatraceArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a DisableAndReadMetatraceArgs.
             * @implements IDisableAndReadMetatraceArgs
             * @constructor
             * @param {perfetto.protos.IDisableAndReadMetatraceArgs=} [p] Properties to set
             */
            function DisableAndReadMetatraceArgs(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * Creates a new DisableAndReadMetatraceArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {perfetto.protos.IDisableAndReadMetatraceArgs=} [properties] Properties to set
             * @returns {perfetto.protos.DisableAndReadMetatraceArgs} DisableAndReadMetatraceArgs instance
             */
            DisableAndReadMetatraceArgs.create = function create(properties) {
                return new DisableAndReadMetatraceArgs(properties);
            };

            /**
             * Encodes the specified DisableAndReadMetatraceArgs message. Does not implicitly {@link perfetto.protos.DisableAndReadMetatraceArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {perfetto.protos.IDisableAndReadMetatraceArgs} m DisableAndReadMetatraceArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DisableAndReadMetatraceArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                return w;
            };

            /**
             * Decodes a DisableAndReadMetatraceArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.DisableAndReadMetatraceArgs} DisableAndReadMetatraceArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DisableAndReadMetatraceArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.DisableAndReadMetatraceArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a DisableAndReadMetatraceArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.DisableAndReadMetatraceArgs} DisableAndReadMetatraceArgs
             */
            DisableAndReadMetatraceArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.DisableAndReadMetatraceArgs)
                    return d;
                return new $root.perfetto.protos.DisableAndReadMetatraceArgs();
            };

            /**
             * Creates a plain object from a DisableAndReadMetatraceArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {perfetto.protos.DisableAndReadMetatraceArgs} m DisableAndReadMetatraceArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DisableAndReadMetatraceArgs.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this DisableAndReadMetatraceArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DisableAndReadMetatraceArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DisableAndReadMetatraceArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.DisableAndReadMetatraceArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DisableAndReadMetatraceArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.DisableAndReadMetatraceArgs";
            };

            return DisableAndReadMetatraceArgs;
        })();

        protos.DisableAndReadMetatraceResult = (function() {

            /**
             * Properties of a DisableAndReadMetatraceResult.
             * @memberof perfetto.protos
             * @interface IDisableAndReadMetatraceResult
             * @property {Uint8Array|null} [metatrace] DisableAndReadMetatraceResult metatrace
             * @property {string|null} [error] DisableAndReadMetatraceResult error
             */

            /**
             * Constructs a new DisableAndReadMetatraceResult.
             * @memberof perfetto.protos
             * @classdesc Represents a DisableAndReadMetatraceResult.
             * @implements IDisableAndReadMetatraceResult
             * @constructor
             * @param {perfetto.protos.IDisableAndReadMetatraceResult=} [p] Properties to set
             */
            function DisableAndReadMetatraceResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * DisableAndReadMetatraceResult metatrace.
             * @member {Uint8Array} metatrace
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @instance
             */
            DisableAndReadMetatraceResult.prototype.metatrace = $util.newBuffer([]);

            /**
             * DisableAndReadMetatraceResult error.
             * @member {string} error
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @instance
             */
            DisableAndReadMetatraceResult.prototype.error = "";

            /**
             * Creates a new DisableAndReadMetatraceResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {perfetto.protos.IDisableAndReadMetatraceResult=} [properties] Properties to set
             * @returns {perfetto.protos.DisableAndReadMetatraceResult} DisableAndReadMetatraceResult instance
             */
            DisableAndReadMetatraceResult.create = function create(properties) {
                return new DisableAndReadMetatraceResult(properties);
            };

            /**
             * Encodes the specified DisableAndReadMetatraceResult message. Does not implicitly {@link perfetto.protos.DisableAndReadMetatraceResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {perfetto.protos.IDisableAndReadMetatraceResult} m DisableAndReadMetatraceResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DisableAndReadMetatraceResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.metatrace != null && Object.hasOwnProperty.call(m, "metatrace"))
                    w.uint32(10).bytes(m.metatrace);
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(18).string(m.error);
                return w;
            };

            /**
             * Decodes a DisableAndReadMetatraceResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.DisableAndReadMetatraceResult} DisableAndReadMetatraceResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DisableAndReadMetatraceResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.DisableAndReadMetatraceResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.metatrace = r.bytes();
                            break;
                        }
                    case 2: {
                            m.error = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a DisableAndReadMetatraceResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.DisableAndReadMetatraceResult} DisableAndReadMetatraceResult
             */
            DisableAndReadMetatraceResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.DisableAndReadMetatraceResult)
                    return d;
                var m = new $root.perfetto.protos.DisableAndReadMetatraceResult();
                if (d.metatrace != null) {
                    if (typeof d.metatrace === "string")
                        $util.base64.decode(d.metatrace, m.metatrace = $util.newBuffer($util.base64.length(d.metatrace)), 0);
                    else if (d.metatrace.length >= 0)
                        m.metatrace = d.metatrace;
                }
                if (d.error != null) {
                    m.error = String(d.error);
                }
                return m;
            };

            /**
             * Creates a plain object from a DisableAndReadMetatraceResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {perfetto.protos.DisableAndReadMetatraceResult} m DisableAndReadMetatraceResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DisableAndReadMetatraceResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    if (o.bytes === String)
                        d.metatrace = "";
                    else {
                        d.metatrace = [];
                        if (o.bytes !== Array)
                            d.metatrace = $util.newBuffer(d.metatrace);
                    }
                    d.error = "";
                }
                if (m.metatrace != null && m.hasOwnProperty("metatrace")) {
                    d.metatrace = o.bytes === String ? $util.base64.encode(m.metatrace, 0, m.metatrace.length) : o.bytes === Array ? Array.prototype.slice.call(m.metatrace) : m.metatrace;
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                return d;
            };

            /**
             * Converts this DisableAndReadMetatraceResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DisableAndReadMetatraceResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DisableAndReadMetatraceResult
             * @function getTypeUrl
             * @memberof perfetto.protos.DisableAndReadMetatraceResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DisableAndReadMetatraceResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.DisableAndReadMetatraceResult";
            };

            return DisableAndReadMetatraceResult;
        })();

        protos.DescriptorSet = (function() {

            /**
             * Properties of a DescriptorSet.
             * @memberof perfetto.protos
             * @interface IDescriptorSet
             * @property {Array.<perfetto.protos.IDescriptorProto>|null} [descriptors] DescriptorSet descriptors
             */

            /**
             * Constructs a new DescriptorSet.
             * @memberof perfetto.protos
             * @classdesc Represents a DescriptorSet.
             * @implements IDescriptorSet
             * @constructor
             * @param {perfetto.protos.IDescriptorSet=} [p] Properties to set
             */
            function DescriptorSet(p) {
                this.descriptors = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * DescriptorSet descriptors.
             * @member {Array.<perfetto.protos.IDescriptorProto>} descriptors
             * @memberof perfetto.protos.DescriptorSet
             * @instance
             */
            DescriptorSet.prototype.descriptors = $util.emptyArray;

            /**
             * Creates a new DescriptorSet instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {perfetto.protos.IDescriptorSet=} [properties] Properties to set
             * @returns {perfetto.protos.DescriptorSet} DescriptorSet instance
             */
            DescriptorSet.create = function create(properties) {
                return new DescriptorSet(properties);
            };

            /**
             * Encodes the specified DescriptorSet message. Does not implicitly {@link perfetto.protos.DescriptorSet.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {perfetto.protos.IDescriptorSet} m DescriptorSet message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DescriptorSet.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.descriptors != null && m.descriptors.length) {
                    for (var i = 0; i < m.descriptors.length; ++i)
                        $root.perfetto.protos.DescriptorProto.encode(m.descriptors[i], w.uint32(10).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes a DescriptorSet message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.DescriptorSet} DescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DescriptorSet.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.DescriptorSet();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.descriptors && m.descriptors.length))
                                m.descriptors = [];
                            m.descriptors.push($root.perfetto.protos.DescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a DescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.DescriptorSet} DescriptorSet
             */
            DescriptorSet.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.DescriptorSet)
                    return d;
                var m = new $root.perfetto.protos.DescriptorSet();
                if (d.descriptors) {
                    if (!Array.isArray(d.descriptors))
                        throw TypeError(".perfetto.protos.DescriptorSet.descriptors: array expected");
                    m.descriptors = [];
                    for (var i = 0; i < d.descriptors.length; ++i) {
                        if (typeof d.descriptors[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorSet.descriptors: object expected");
                        m.descriptors[i] = $root.perfetto.protos.DescriptorProto.fromObject(d.descriptors[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a DescriptorSet message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {perfetto.protos.DescriptorSet} m DescriptorSet
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DescriptorSet.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.descriptors = [];
                }
                if (m.descriptors && m.descriptors.length) {
                    d.descriptors = [];
                    for (var j = 0; j < m.descriptors.length; ++j) {
                        d.descriptors[j] = $root.perfetto.protos.DescriptorProto.toObject(m.descriptors[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this DescriptorSet to JSON.
             * @function toJSON
             * @memberof perfetto.protos.DescriptorSet
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DescriptorSet.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DescriptorSet
             * @function getTypeUrl
             * @memberof perfetto.protos.DescriptorSet
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DescriptorSet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.DescriptorSet";
            };

            return DescriptorSet;
        })();

        protos.ResetTraceProcessorArgs = (function() {

            /**
             * Properties of a ResetTraceProcessorArgs.
             * @memberof perfetto.protos
             * @interface IResetTraceProcessorArgs
             * @property {perfetto.protos.ResetTraceProcessorArgs.DropTrackEventDataBefore|null} [dropTrackEventDataBefore] ResetTraceProcessorArgs dropTrackEventDataBefore
             * @property {boolean|null} [ingestFtraceInRawTable] ResetTraceProcessorArgs ingestFtraceInRawTable
             * @property {boolean|null} [analyzeTraceProtoContent] ResetTraceProcessorArgs analyzeTraceProtoContent
             * @property {boolean|null} [ftraceDropUntilAllCpusValid] ResetTraceProcessorArgs ftraceDropUntilAllCpusValid
             * @property {perfetto.protos.ResetTraceProcessorArgs.ParsingMode|null} [parsingMode] ResetTraceProcessorArgs parsingMode
             */

            /**
             * Constructs a new ResetTraceProcessorArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a ResetTraceProcessorArgs.
             * @implements IResetTraceProcessorArgs
             * @constructor
             * @param {perfetto.protos.IResetTraceProcessorArgs=} [p] Properties to set
             */
            function ResetTraceProcessorArgs(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * ResetTraceProcessorArgs dropTrackEventDataBefore.
             * @member {perfetto.protos.ResetTraceProcessorArgs.DropTrackEventDataBefore} dropTrackEventDataBefore
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             */
            ResetTraceProcessorArgs.prototype.dropTrackEventDataBefore = 0;

            /**
             * ResetTraceProcessorArgs ingestFtraceInRawTable.
             * @member {boolean} ingestFtraceInRawTable
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             */
            ResetTraceProcessorArgs.prototype.ingestFtraceInRawTable = false;

            /**
             * ResetTraceProcessorArgs analyzeTraceProtoContent.
             * @member {boolean} analyzeTraceProtoContent
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             */
            ResetTraceProcessorArgs.prototype.analyzeTraceProtoContent = false;

            /**
             * ResetTraceProcessorArgs ftraceDropUntilAllCpusValid.
             * @member {boolean} ftraceDropUntilAllCpusValid
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             */
            ResetTraceProcessorArgs.prototype.ftraceDropUntilAllCpusValid = false;

            /**
             * ResetTraceProcessorArgs parsingMode.
             * @member {perfetto.protos.ResetTraceProcessorArgs.ParsingMode} parsingMode
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             */
            ResetTraceProcessorArgs.prototype.parsingMode = 0;

            /**
             * Creates a new ResetTraceProcessorArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {perfetto.protos.IResetTraceProcessorArgs=} [properties] Properties to set
             * @returns {perfetto.protos.ResetTraceProcessorArgs} ResetTraceProcessorArgs instance
             */
            ResetTraceProcessorArgs.create = function create(properties) {
                return new ResetTraceProcessorArgs(properties);
            };

            /**
             * Encodes the specified ResetTraceProcessorArgs message. Does not implicitly {@link perfetto.protos.ResetTraceProcessorArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {perfetto.protos.IResetTraceProcessorArgs} m ResetTraceProcessorArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ResetTraceProcessorArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.dropTrackEventDataBefore != null && Object.hasOwnProperty.call(m, "dropTrackEventDataBefore"))
                    w.uint32(8).int32(m.dropTrackEventDataBefore);
                if (m.ingestFtraceInRawTable != null && Object.hasOwnProperty.call(m, "ingestFtraceInRawTable"))
                    w.uint32(16).bool(m.ingestFtraceInRawTable);
                if (m.analyzeTraceProtoContent != null && Object.hasOwnProperty.call(m, "analyzeTraceProtoContent"))
                    w.uint32(24).bool(m.analyzeTraceProtoContent);
                if (m.ftraceDropUntilAllCpusValid != null && Object.hasOwnProperty.call(m, "ftraceDropUntilAllCpusValid"))
                    w.uint32(32).bool(m.ftraceDropUntilAllCpusValid);
                if (m.parsingMode != null && Object.hasOwnProperty.call(m, "parsingMode"))
                    w.uint32(40).int32(m.parsingMode);
                return w;
            };

            /**
             * Decodes a ResetTraceProcessorArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.ResetTraceProcessorArgs} ResetTraceProcessorArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ResetTraceProcessorArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.ResetTraceProcessorArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.dropTrackEventDataBefore = r.int32();
                            break;
                        }
                    case 2: {
                            m.ingestFtraceInRawTable = r.bool();
                            break;
                        }
                    case 3: {
                            m.analyzeTraceProtoContent = r.bool();
                            break;
                        }
                    case 4: {
                            m.ftraceDropUntilAllCpusValid = r.bool();
                            break;
                        }
                    case 5: {
                            m.parsingMode = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a ResetTraceProcessorArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.ResetTraceProcessorArgs} ResetTraceProcessorArgs
             */
            ResetTraceProcessorArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.ResetTraceProcessorArgs)
                    return d;
                var m = new $root.perfetto.protos.ResetTraceProcessorArgs();
                switch (d.dropTrackEventDataBefore) {
                default:
                    if (typeof d.dropTrackEventDataBefore === "number") {
                        m.dropTrackEventDataBefore = d.dropTrackEventDataBefore;
                        break;
                    }
                    break;
                case "NO_DROP":
                case 0:
                    m.dropTrackEventDataBefore = 0;
                    break;
                case "TRACK_EVENT_RANGE_OF_INTEREST":
                case 1:
                    m.dropTrackEventDataBefore = 1;
                    break;
                }
                if (d.ingestFtraceInRawTable != null) {
                    m.ingestFtraceInRawTable = Boolean(d.ingestFtraceInRawTable);
                }
                if (d.analyzeTraceProtoContent != null) {
                    m.analyzeTraceProtoContent = Boolean(d.analyzeTraceProtoContent);
                }
                if (d.ftraceDropUntilAllCpusValid != null) {
                    m.ftraceDropUntilAllCpusValid = Boolean(d.ftraceDropUntilAllCpusValid);
                }
                switch (d.parsingMode) {
                default:
                    if (typeof d.parsingMode === "number") {
                        m.parsingMode = d.parsingMode;
                        break;
                    }
                    break;
                case "DEFAULT":
                case 0:
                    m.parsingMode = 0;
                    break;
                case "TOKENIZE_ONLY":
                case 1:
                    m.parsingMode = 1;
                    break;
                case "TOKENIZE_AND_SORT":
                case 2:
                    m.parsingMode = 2;
                    break;
                }
                return m;
            };

            /**
             * Creates a plain object from a ResetTraceProcessorArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {perfetto.protos.ResetTraceProcessorArgs} m ResetTraceProcessorArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ResetTraceProcessorArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.dropTrackEventDataBefore = o.enums === String ? "NO_DROP" : 0;
                    d.ingestFtraceInRawTable = false;
                    d.analyzeTraceProtoContent = false;
                    d.ftraceDropUntilAllCpusValid = false;
                    d.parsingMode = o.enums === String ? "DEFAULT" : 0;
                }
                if (m.dropTrackEventDataBefore != null && m.hasOwnProperty("dropTrackEventDataBefore")) {
                    d.dropTrackEventDataBefore = o.enums === String ? $root.perfetto.protos.ResetTraceProcessorArgs.DropTrackEventDataBefore[m.dropTrackEventDataBefore] === undefined ? m.dropTrackEventDataBefore : $root.perfetto.protos.ResetTraceProcessorArgs.DropTrackEventDataBefore[m.dropTrackEventDataBefore] : m.dropTrackEventDataBefore;
                }
                if (m.ingestFtraceInRawTable != null && m.hasOwnProperty("ingestFtraceInRawTable")) {
                    d.ingestFtraceInRawTable = m.ingestFtraceInRawTable;
                }
                if (m.analyzeTraceProtoContent != null && m.hasOwnProperty("analyzeTraceProtoContent")) {
                    d.analyzeTraceProtoContent = m.analyzeTraceProtoContent;
                }
                if (m.ftraceDropUntilAllCpusValid != null && m.hasOwnProperty("ftraceDropUntilAllCpusValid")) {
                    d.ftraceDropUntilAllCpusValid = m.ftraceDropUntilAllCpusValid;
                }
                if (m.parsingMode != null && m.hasOwnProperty("parsingMode")) {
                    d.parsingMode = o.enums === String ? $root.perfetto.protos.ResetTraceProcessorArgs.ParsingMode[m.parsingMode] === undefined ? m.parsingMode : $root.perfetto.protos.ResetTraceProcessorArgs.ParsingMode[m.parsingMode] : m.parsingMode;
                }
                return d;
            };

            /**
             * Converts this ResetTraceProcessorArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ResetTraceProcessorArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ResetTraceProcessorArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.ResetTraceProcessorArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ResetTraceProcessorArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.ResetTraceProcessorArgs";
            };

            /**
             * DropTrackEventDataBefore enum.
             * @name perfetto.protos.ResetTraceProcessorArgs.DropTrackEventDataBefore
             * @enum {number}
             * @property {number} NO_DROP=0 NO_DROP value
             * @property {number} TRACK_EVENT_RANGE_OF_INTEREST=1 TRACK_EVENT_RANGE_OF_INTEREST value
             */
            ResetTraceProcessorArgs.DropTrackEventDataBefore = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NO_DROP"] = 0;
                values[valuesById[1] = "TRACK_EVENT_RANGE_OF_INTEREST"] = 1;
                return values;
            })();

            /**
             * ParsingMode enum.
             * @name perfetto.protos.ResetTraceProcessorArgs.ParsingMode
             * @enum {number}
             * @property {number} DEFAULT=0 DEFAULT value
             * @property {number} TOKENIZE_ONLY=1 TOKENIZE_ONLY value
             * @property {number} TOKENIZE_AND_SORT=2 TOKENIZE_AND_SORT value
             */
            ResetTraceProcessorArgs.ParsingMode = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "DEFAULT"] = 0;
                values[valuesById[1] = "TOKENIZE_ONLY"] = 1;
                values[valuesById[2] = "TOKENIZE_AND_SORT"] = 2;
                return values;
            })();

            return ResetTraceProcessorArgs;
        })();

        protos.RegisterSqlPackageArgs = (function() {

            /**
             * Properties of a RegisterSqlPackageArgs.
             * @memberof perfetto.protos
             * @interface IRegisterSqlPackageArgs
             * @property {string|null} [packageName] RegisterSqlPackageArgs packageName
             * @property {Array.<perfetto.protos.RegisterSqlPackageArgs.IModule>|null} [modules] RegisterSqlPackageArgs modules
             * @property {boolean|null} [allowOverride] RegisterSqlPackageArgs allowOverride
             */

            /**
             * Constructs a new RegisterSqlPackageArgs.
             * @memberof perfetto.protos
             * @classdesc Represents a RegisterSqlPackageArgs.
             * @implements IRegisterSqlPackageArgs
             * @constructor
             * @param {perfetto.protos.IRegisterSqlPackageArgs=} [p] Properties to set
             */
            function RegisterSqlPackageArgs(p) {
                this.modules = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * RegisterSqlPackageArgs packageName.
             * @member {string} packageName
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @instance
             */
            RegisterSqlPackageArgs.prototype.packageName = "";

            /**
             * RegisterSqlPackageArgs modules.
             * @member {Array.<perfetto.protos.RegisterSqlPackageArgs.IModule>} modules
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @instance
             */
            RegisterSqlPackageArgs.prototype.modules = $util.emptyArray;

            /**
             * RegisterSqlPackageArgs allowOverride.
             * @member {boolean} allowOverride
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @instance
             */
            RegisterSqlPackageArgs.prototype.allowOverride = false;

            /**
             * Creates a new RegisterSqlPackageArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {perfetto.protos.IRegisterSqlPackageArgs=} [properties] Properties to set
             * @returns {perfetto.protos.RegisterSqlPackageArgs} RegisterSqlPackageArgs instance
             */
            RegisterSqlPackageArgs.create = function create(properties) {
                return new RegisterSqlPackageArgs(properties);
            };

            /**
             * Encodes the specified RegisterSqlPackageArgs message. Does not implicitly {@link perfetto.protos.RegisterSqlPackageArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {perfetto.protos.IRegisterSqlPackageArgs} m RegisterSqlPackageArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RegisterSqlPackageArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.packageName != null && Object.hasOwnProperty.call(m, "packageName"))
                    w.uint32(10).string(m.packageName);
                if (m.modules != null && m.modules.length) {
                    for (var i = 0; i < m.modules.length; ++i)
                        $root.perfetto.protos.RegisterSqlPackageArgs.Module.encode(m.modules[i], w.uint32(18).fork()).ldelim();
                }
                if (m.allowOverride != null && Object.hasOwnProperty.call(m, "allowOverride"))
                    w.uint32(24).bool(m.allowOverride);
                return w;
            };

            /**
             * Decodes a RegisterSqlPackageArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.RegisterSqlPackageArgs} RegisterSqlPackageArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RegisterSqlPackageArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.RegisterSqlPackageArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.packageName = r.string();
                            break;
                        }
                    case 2: {
                            if (!(m.modules && m.modules.length))
                                m.modules = [];
                            m.modules.push($root.perfetto.protos.RegisterSqlPackageArgs.Module.decode(r, r.uint32()));
                            break;
                        }
                    case 3: {
                            m.allowOverride = r.bool();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a RegisterSqlPackageArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.RegisterSqlPackageArgs} RegisterSqlPackageArgs
             */
            RegisterSqlPackageArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.RegisterSqlPackageArgs)
                    return d;
                var m = new $root.perfetto.protos.RegisterSqlPackageArgs();
                if (d.packageName != null) {
                    m.packageName = String(d.packageName);
                }
                if (d.modules) {
                    if (!Array.isArray(d.modules))
                        throw TypeError(".perfetto.protos.RegisterSqlPackageArgs.modules: array expected");
                    m.modules = [];
                    for (var i = 0; i < d.modules.length; ++i) {
                        if (typeof d.modules[i] !== "object")
                            throw TypeError(".perfetto.protos.RegisterSqlPackageArgs.modules: object expected");
                        m.modules[i] = $root.perfetto.protos.RegisterSqlPackageArgs.Module.fromObject(d.modules[i]);
                    }
                }
                if (d.allowOverride != null) {
                    m.allowOverride = Boolean(d.allowOverride);
                }
                return m;
            };

            /**
             * Creates a plain object from a RegisterSqlPackageArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {perfetto.protos.RegisterSqlPackageArgs} m RegisterSqlPackageArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RegisterSqlPackageArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.modules = [];
                }
                if (o.defaults) {
                    d.packageName = "";
                    d.allowOverride = false;
                }
                if (m.packageName != null && m.hasOwnProperty("packageName")) {
                    d.packageName = m.packageName;
                }
                if (m.modules && m.modules.length) {
                    d.modules = [];
                    for (var j = 0; j < m.modules.length; ++j) {
                        d.modules[j] = $root.perfetto.protos.RegisterSqlPackageArgs.Module.toObject(m.modules[j], o);
                    }
                }
                if (m.allowOverride != null && m.hasOwnProperty("allowOverride")) {
                    d.allowOverride = m.allowOverride;
                }
                return d;
            };

            /**
             * Converts this RegisterSqlPackageArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RegisterSqlPackageArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RegisterSqlPackageArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.RegisterSqlPackageArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RegisterSqlPackageArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.RegisterSqlPackageArgs";
            };

            RegisterSqlPackageArgs.Module = (function() {

                /**
                 * Properties of a Module.
                 * @memberof perfetto.protos.RegisterSqlPackageArgs
                 * @interface IModule
                 * @property {string|null} [name] Module name
                 * @property {string|null} [sql] Module sql
                 */

                /**
                 * Constructs a new Module.
                 * @memberof perfetto.protos.RegisterSqlPackageArgs
                 * @classdesc Represents a Module.
                 * @implements IModule
                 * @constructor
                 * @param {perfetto.protos.RegisterSqlPackageArgs.IModule=} [p] Properties to set
                 */
                function Module(p) {
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * Module name.
                 * @member {string} name
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @instance
                 */
                Module.prototype.name = "";

                /**
                 * Module sql.
                 * @member {string} sql
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @instance
                 */
                Module.prototype.sql = "";

                /**
                 * Creates a new Module instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {perfetto.protos.RegisterSqlPackageArgs.IModule=} [properties] Properties to set
                 * @returns {perfetto.protos.RegisterSqlPackageArgs.Module} Module instance
                 */
                Module.create = function create(properties) {
                    return new Module(properties);
                };

                /**
                 * Encodes the specified Module message. Does not implicitly {@link perfetto.protos.RegisterSqlPackageArgs.Module.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {perfetto.protos.RegisterSqlPackageArgs.IModule} m Module message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Module.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                        w.uint32(10).string(m.name);
                    if (m.sql != null && Object.hasOwnProperty.call(m, "sql"))
                        w.uint32(18).string(m.sql);
                    return w;
                };

                /**
                 * Decodes a Module message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.RegisterSqlPackageArgs.Module} Module
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Module.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.RegisterSqlPackageArgs.Module();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.name = r.string();
                                break;
                            }
                        case 2: {
                                m.sql = r.string();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a Module message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.RegisterSqlPackageArgs.Module} Module
                 */
                Module.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.RegisterSqlPackageArgs.Module)
                        return d;
                    var m = new $root.perfetto.protos.RegisterSqlPackageArgs.Module();
                    if (d.name != null) {
                        m.name = String(d.name);
                    }
                    if (d.sql != null) {
                        m.sql = String(d.sql);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a Module message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {perfetto.protos.RegisterSqlPackageArgs.Module} m Module
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Module.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.defaults) {
                        d.name = "";
                        d.sql = "";
                    }
                    if (m.name != null && m.hasOwnProperty("name")) {
                        d.name = m.name;
                    }
                    if (m.sql != null && m.hasOwnProperty("sql")) {
                        d.sql = m.sql;
                    }
                    return d;
                };

                /**
                 * Converts this Module to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Module.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Module
                 * @function getTypeUrl
                 * @memberof perfetto.protos.RegisterSqlPackageArgs.Module
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Module.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.RegisterSqlPackageArgs.Module";
                };

                return Module;
            })();

            return RegisterSqlPackageArgs;
        })();

        protos.RegisterSqlPackageResult = (function() {

            /**
             * Properties of a RegisterSqlPackageResult.
             * @memberof perfetto.protos
             * @interface IRegisterSqlPackageResult
             * @property {string|null} [error] RegisterSqlPackageResult error
             */

            /**
             * Constructs a new RegisterSqlPackageResult.
             * @memberof perfetto.protos
             * @classdesc Represents a RegisterSqlPackageResult.
             * @implements IRegisterSqlPackageResult
             * @constructor
             * @param {perfetto.protos.IRegisterSqlPackageResult=} [p] Properties to set
             */
            function RegisterSqlPackageResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * RegisterSqlPackageResult error.
             * @member {string} error
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @instance
             */
            RegisterSqlPackageResult.prototype.error = "";

            /**
             * Creates a new RegisterSqlPackageResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {perfetto.protos.IRegisterSqlPackageResult=} [properties] Properties to set
             * @returns {perfetto.protos.RegisterSqlPackageResult} RegisterSqlPackageResult instance
             */
            RegisterSqlPackageResult.create = function create(properties) {
                return new RegisterSqlPackageResult(properties);
            };

            /**
             * Encodes the specified RegisterSqlPackageResult message. Does not implicitly {@link perfetto.protos.RegisterSqlPackageResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {perfetto.protos.IRegisterSqlPackageResult} m RegisterSqlPackageResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RegisterSqlPackageResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(10).string(m.error);
                return w;
            };

            /**
             * Decodes a RegisterSqlPackageResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.RegisterSqlPackageResult} RegisterSqlPackageResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RegisterSqlPackageResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.RegisterSqlPackageResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.error = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a RegisterSqlPackageResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.RegisterSqlPackageResult} RegisterSqlPackageResult
             */
            RegisterSqlPackageResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.RegisterSqlPackageResult)
                    return d;
                var m = new $root.perfetto.protos.RegisterSqlPackageResult();
                if (d.error != null) {
                    m.error = String(d.error);
                }
                return m;
            };

            /**
             * Creates a plain object from a RegisterSqlPackageResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {perfetto.protos.RegisterSqlPackageResult} m RegisterSqlPackageResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RegisterSqlPackageResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.error = "";
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                return d;
            };

            /**
             * Converts this RegisterSqlPackageResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RegisterSqlPackageResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for RegisterSqlPackageResult
             * @function getTypeUrl
             * @memberof perfetto.protos.RegisterSqlPackageResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            RegisterSqlPackageResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.RegisterSqlPackageResult";
            };

            return RegisterSqlPackageResult;
        })();

        protos.FinalizeDataResult = (function() {

            /**
             * Properties of a FinalizeDataResult.
             * @memberof perfetto.protos
             * @interface IFinalizeDataResult
             * @property {string|null} [error] FinalizeDataResult error
             */

            /**
             * Constructs a new FinalizeDataResult.
             * @memberof perfetto.protos
             * @classdesc Represents a FinalizeDataResult.
             * @implements IFinalizeDataResult
             * @constructor
             * @param {perfetto.protos.IFinalizeDataResult=} [p] Properties to set
             */
            function FinalizeDataResult(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * FinalizeDataResult error.
             * @member {string} error
             * @memberof perfetto.protos.FinalizeDataResult
             * @instance
             */
            FinalizeDataResult.prototype.error = "";

            /**
             * Creates a new FinalizeDataResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {perfetto.protos.IFinalizeDataResult=} [properties] Properties to set
             * @returns {perfetto.protos.FinalizeDataResult} FinalizeDataResult instance
             */
            FinalizeDataResult.create = function create(properties) {
                return new FinalizeDataResult(properties);
            };

            /**
             * Encodes the specified FinalizeDataResult message. Does not implicitly {@link perfetto.protos.FinalizeDataResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {perfetto.protos.IFinalizeDataResult} m FinalizeDataResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FinalizeDataResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(10).string(m.error);
                return w;
            };

            /**
             * Decodes a FinalizeDataResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.FinalizeDataResult} FinalizeDataResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FinalizeDataResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.FinalizeDataResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.error = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a FinalizeDataResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.FinalizeDataResult} FinalizeDataResult
             */
            FinalizeDataResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.FinalizeDataResult)
                    return d;
                var m = new $root.perfetto.protos.FinalizeDataResult();
                if (d.error != null) {
                    m.error = String(d.error);
                }
                return m;
            };

            /**
             * Creates a plain object from a FinalizeDataResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {perfetto.protos.FinalizeDataResult} m FinalizeDataResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FinalizeDataResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.error = "";
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                return d;
            };

            /**
             * Converts this FinalizeDataResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FinalizeDataResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FinalizeDataResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FinalizeDataResult
             * @function getTypeUrl
             * @memberof perfetto.protos.FinalizeDataResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FinalizeDataResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.FinalizeDataResult";
            };

            return FinalizeDataResult;
        })();

        protos.AnalyzeStructuredQueryArgs = (function() {

            /**
             * Properties of an AnalyzeStructuredQueryArgs.
             * @memberof perfetto.protos
             * @interface IAnalyzeStructuredQueryArgs
             * @property {Array.<perfetto.protos.IPerfettoSqlStructuredQuery>|null} [queries] AnalyzeStructuredQueryArgs queries
             */

            /**
             * Constructs a new AnalyzeStructuredQueryArgs.
             * @memberof perfetto.protos
             * @classdesc Represents an AnalyzeStructuredQueryArgs.
             * @implements IAnalyzeStructuredQueryArgs
             * @constructor
             * @param {perfetto.protos.IAnalyzeStructuredQueryArgs=} [p] Properties to set
             */
            function AnalyzeStructuredQueryArgs(p) {
                this.queries = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * AnalyzeStructuredQueryArgs queries.
             * @member {Array.<perfetto.protos.IPerfettoSqlStructuredQuery>} queries
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @instance
             */
            AnalyzeStructuredQueryArgs.prototype.queries = $util.emptyArray;

            /**
             * Creates a new AnalyzeStructuredQueryArgs instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {perfetto.protos.IAnalyzeStructuredQueryArgs=} [properties] Properties to set
             * @returns {perfetto.protos.AnalyzeStructuredQueryArgs} AnalyzeStructuredQueryArgs instance
             */
            AnalyzeStructuredQueryArgs.create = function create(properties) {
                return new AnalyzeStructuredQueryArgs(properties);
            };

            /**
             * Encodes the specified AnalyzeStructuredQueryArgs message. Does not implicitly {@link perfetto.protos.AnalyzeStructuredQueryArgs.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {perfetto.protos.IAnalyzeStructuredQueryArgs} m AnalyzeStructuredQueryArgs message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AnalyzeStructuredQueryArgs.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.queries != null && m.queries.length) {
                    for (var i = 0; i < m.queries.length; ++i)
                        $root.perfetto.protos.PerfettoSqlStructuredQuery.encode(m.queries[i], w.uint32(10).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes an AnalyzeStructuredQueryArgs message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.AnalyzeStructuredQueryArgs} AnalyzeStructuredQueryArgs
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AnalyzeStructuredQueryArgs.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.AnalyzeStructuredQueryArgs();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.queries && m.queries.length))
                                m.queries = [];
                            m.queries.push($root.perfetto.protos.PerfettoSqlStructuredQuery.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an AnalyzeStructuredQueryArgs message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.AnalyzeStructuredQueryArgs} AnalyzeStructuredQueryArgs
             */
            AnalyzeStructuredQueryArgs.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.AnalyzeStructuredQueryArgs)
                    return d;
                var m = new $root.perfetto.protos.AnalyzeStructuredQueryArgs();
                if (d.queries) {
                    if (!Array.isArray(d.queries))
                        throw TypeError(".perfetto.protos.AnalyzeStructuredQueryArgs.queries: array expected");
                    m.queries = [];
                    for (var i = 0; i < d.queries.length; ++i) {
                        if (typeof d.queries[i] !== "object")
                            throw TypeError(".perfetto.protos.AnalyzeStructuredQueryArgs.queries: object expected");
                        m.queries[i] = $root.perfetto.protos.PerfettoSqlStructuredQuery.fromObject(d.queries[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from an AnalyzeStructuredQueryArgs message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {perfetto.protos.AnalyzeStructuredQueryArgs} m AnalyzeStructuredQueryArgs
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AnalyzeStructuredQueryArgs.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.queries = [];
                }
                if (m.queries && m.queries.length) {
                    d.queries = [];
                    for (var j = 0; j < m.queries.length; ++j) {
                        d.queries[j] = $root.perfetto.protos.PerfettoSqlStructuredQuery.toObject(m.queries[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this AnalyzeStructuredQueryArgs to JSON.
             * @function toJSON
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AnalyzeStructuredQueryArgs.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AnalyzeStructuredQueryArgs
             * @function getTypeUrl
             * @memberof perfetto.protos.AnalyzeStructuredQueryArgs
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AnalyzeStructuredQueryArgs.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.AnalyzeStructuredQueryArgs";
            };

            return AnalyzeStructuredQueryArgs;
        })();

        protos.AnalyzeStructuredQueryResult = (function() {

            /**
             * Properties of an AnalyzeStructuredQueryResult.
             * @memberof perfetto.protos
             * @interface IAnalyzeStructuredQueryResult
             * @property {string|null} [error] AnalyzeStructuredQueryResult error
             * @property {Array.<perfetto.protos.AnalyzeStructuredQueryResult.IStructuredQueryResult>|null} [results] AnalyzeStructuredQueryResult results
             */

            /**
             * Constructs a new AnalyzeStructuredQueryResult.
             * @memberof perfetto.protos
             * @classdesc Represents an AnalyzeStructuredQueryResult.
             * @implements IAnalyzeStructuredQueryResult
             * @constructor
             * @param {perfetto.protos.IAnalyzeStructuredQueryResult=} [p] Properties to set
             */
            function AnalyzeStructuredQueryResult(p) {
                this.results = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * AnalyzeStructuredQueryResult error.
             * @member {string} error
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @instance
             */
            AnalyzeStructuredQueryResult.prototype.error = "";

            /**
             * AnalyzeStructuredQueryResult results.
             * @member {Array.<perfetto.protos.AnalyzeStructuredQueryResult.IStructuredQueryResult>} results
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @instance
             */
            AnalyzeStructuredQueryResult.prototype.results = $util.emptyArray;

            /**
             * Creates a new AnalyzeStructuredQueryResult instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {perfetto.protos.IAnalyzeStructuredQueryResult=} [properties] Properties to set
             * @returns {perfetto.protos.AnalyzeStructuredQueryResult} AnalyzeStructuredQueryResult instance
             */
            AnalyzeStructuredQueryResult.create = function create(properties) {
                return new AnalyzeStructuredQueryResult(properties);
            };

            /**
             * Encodes the specified AnalyzeStructuredQueryResult message. Does not implicitly {@link perfetto.protos.AnalyzeStructuredQueryResult.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {perfetto.protos.IAnalyzeStructuredQueryResult} m AnalyzeStructuredQueryResult message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            AnalyzeStructuredQueryResult.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.error != null && Object.hasOwnProperty.call(m, "error"))
                    w.uint32(10).string(m.error);
                if (m.results != null && m.results.length) {
                    for (var i = 0; i < m.results.length; ++i)
                        $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.encode(m.results[i], w.uint32(18).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes an AnalyzeStructuredQueryResult message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.AnalyzeStructuredQueryResult} AnalyzeStructuredQueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            AnalyzeStructuredQueryResult.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.AnalyzeStructuredQueryResult();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.error = r.string();
                            break;
                        }
                    case 2: {
                            if (!(m.results && m.results.length))
                                m.results = [];
                            m.results.push($root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an AnalyzeStructuredQueryResult message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.AnalyzeStructuredQueryResult} AnalyzeStructuredQueryResult
             */
            AnalyzeStructuredQueryResult.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.AnalyzeStructuredQueryResult)
                    return d;
                var m = new $root.perfetto.protos.AnalyzeStructuredQueryResult();
                if (d.error != null) {
                    m.error = String(d.error);
                }
                if (d.results) {
                    if (!Array.isArray(d.results))
                        throw TypeError(".perfetto.protos.AnalyzeStructuredQueryResult.results: array expected");
                    m.results = [];
                    for (var i = 0; i < d.results.length; ++i) {
                        if (typeof d.results[i] !== "object")
                            throw TypeError(".perfetto.protos.AnalyzeStructuredQueryResult.results: object expected");
                        m.results[i] = $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.fromObject(d.results[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from an AnalyzeStructuredQueryResult message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {perfetto.protos.AnalyzeStructuredQueryResult} m AnalyzeStructuredQueryResult
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            AnalyzeStructuredQueryResult.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.results = [];
                }
                if (o.defaults) {
                    d.error = "";
                }
                if (m.error != null && m.hasOwnProperty("error")) {
                    d.error = m.error;
                }
                if (m.results && m.results.length) {
                    d.results = [];
                    for (var j = 0; j < m.results.length; ++j) {
                        d.results[j] = $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.toObject(m.results[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this AnalyzeStructuredQueryResult to JSON.
             * @function toJSON
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            AnalyzeStructuredQueryResult.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for AnalyzeStructuredQueryResult
             * @function getTypeUrl
             * @memberof perfetto.protos.AnalyzeStructuredQueryResult
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            AnalyzeStructuredQueryResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.AnalyzeStructuredQueryResult";
            };

            AnalyzeStructuredQueryResult.StructuredQueryResult = (function() {

                /**
                 * Properties of a StructuredQueryResult.
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult
                 * @interface IStructuredQueryResult
                 * @property {string|null} [sql] StructuredQueryResult sql
                 * @property {string|null} [textproto] StructuredQueryResult textproto
                 * @property {Array.<string>|null} [modules] StructuredQueryResult modules
                 * @property {Array.<string>|null} [preambles] StructuredQueryResult preambles
                 */

                /**
                 * Constructs a new StructuredQueryResult.
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult
                 * @classdesc Represents a StructuredQueryResult.
                 * @implements IStructuredQueryResult
                 * @constructor
                 * @param {perfetto.protos.AnalyzeStructuredQueryResult.IStructuredQueryResult=} [p] Properties to set
                 */
                function StructuredQueryResult(p) {
                    this.modules = [];
                    this.preambles = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * StructuredQueryResult sql.
                 * @member {string} sql
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @instance
                 */
                StructuredQueryResult.prototype.sql = "";

                /**
                 * StructuredQueryResult textproto.
                 * @member {string} textproto
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @instance
                 */
                StructuredQueryResult.prototype.textproto = "";

                /**
                 * StructuredQueryResult modules.
                 * @member {Array.<string>} modules
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @instance
                 */
                StructuredQueryResult.prototype.modules = $util.emptyArray;

                /**
                 * StructuredQueryResult preambles.
                 * @member {Array.<string>} preambles
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @instance
                 */
                StructuredQueryResult.prototype.preambles = $util.emptyArray;

                /**
                 * Creates a new StructuredQueryResult instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {perfetto.protos.AnalyzeStructuredQueryResult.IStructuredQueryResult=} [properties] Properties to set
                 * @returns {perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult} StructuredQueryResult instance
                 */
                StructuredQueryResult.create = function create(properties) {
                    return new StructuredQueryResult(properties);
                };

                /**
                 * Encodes the specified StructuredQueryResult message. Does not implicitly {@link perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {perfetto.protos.AnalyzeStructuredQueryResult.IStructuredQueryResult} m StructuredQueryResult message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                StructuredQueryResult.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.sql != null && Object.hasOwnProperty.call(m, "sql"))
                        w.uint32(10).string(m.sql);
                    if (m.modules != null && m.modules.length) {
                        for (var i = 0; i < m.modules.length; ++i)
                            w.uint32(18).string(m.modules[i]);
                    }
                    if (m.preambles != null && m.preambles.length) {
                        for (var i = 0; i < m.preambles.length; ++i)
                            w.uint32(26).string(m.preambles[i]);
                    }
                    if (m.textproto != null && Object.hasOwnProperty.call(m, "textproto"))
                        w.uint32(34).string(m.textproto);
                    return w;
                };

                /**
                 * Decodes a StructuredQueryResult message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult} StructuredQueryResult
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                StructuredQueryResult.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.sql = r.string();
                                break;
                            }
                        case 4: {
                                m.textproto = r.string();
                                break;
                            }
                        case 2: {
                                if (!(m.modules && m.modules.length))
                                    m.modules = [];
                                m.modules.push(r.string());
                                break;
                            }
                        case 3: {
                                if (!(m.preambles && m.preambles.length))
                                    m.preambles = [];
                                m.preambles.push(r.string());
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a StructuredQueryResult message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult} StructuredQueryResult
                 */
                StructuredQueryResult.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult)
                        return d;
                    var m = new $root.perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult();
                    if (d.sql != null) {
                        m.sql = String(d.sql);
                    }
                    if (d.textproto != null) {
                        m.textproto = String(d.textproto);
                    }
                    if (d.modules) {
                        if (!Array.isArray(d.modules))
                            throw TypeError(".perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.modules: array expected");
                        m.modules = [];
                        for (var i = 0; i < d.modules.length; ++i) {
                            m.modules[i] = String(d.modules[i]);
                        }
                    }
                    if (d.preambles) {
                        if (!Array.isArray(d.preambles))
                            throw TypeError(".perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult.preambles: array expected");
                        m.preambles = [];
                        for (var i = 0; i < d.preambles.length; ++i) {
                            m.preambles[i] = String(d.preambles[i]);
                        }
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a StructuredQueryResult message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult} m StructuredQueryResult
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                StructuredQueryResult.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.modules = [];
                        d.preambles = [];
                    }
                    if (o.defaults) {
                        d.sql = "";
                        d.textproto = "";
                    }
                    if (m.sql != null && m.hasOwnProperty("sql")) {
                        d.sql = m.sql;
                    }
                    if (m.modules && m.modules.length) {
                        d.modules = [];
                        for (var j = 0; j < m.modules.length; ++j) {
                            d.modules[j] = m.modules[j];
                        }
                    }
                    if (m.preambles && m.preambles.length) {
                        d.preambles = [];
                        for (var j = 0; j < m.preambles.length; ++j) {
                            d.preambles[j] = m.preambles[j];
                        }
                    }
                    if (m.textproto != null && m.hasOwnProperty("textproto")) {
                        d.textproto = m.textproto;
                    }
                    return d;
                };

                /**
                 * Converts this StructuredQueryResult to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                StructuredQueryResult.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for StructuredQueryResult
                 * @function getTypeUrl
                 * @memberof perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                StructuredQueryResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.AnalyzeStructuredQueryResult.StructuredQueryResult";
                };

                return StructuredQueryResult;
            })();

            return AnalyzeStructuredQueryResult;
        })();

        protos.FileDescriptorSet = (function() {

            /**
             * Properties of a FileDescriptorSet.
             * @memberof perfetto.protos
             * @interface IFileDescriptorSet
             * @property {Array.<perfetto.protos.IFileDescriptorProto>|null} [file] FileDescriptorSet file
             */

            /**
             * Constructs a new FileDescriptorSet.
             * @memberof perfetto.protos
             * @classdesc Represents a FileDescriptorSet.
             * @implements IFileDescriptorSet
             * @constructor
             * @param {perfetto.protos.IFileDescriptorSet=} [p] Properties to set
             */
            function FileDescriptorSet(p) {
                this.file = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * FileDescriptorSet file.
             * @member {Array.<perfetto.protos.IFileDescriptorProto>} file
             * @memberof perfetto.protos.FileDescriptorSet
             * @instance
             */
            FileDescriptorSet.prototype.file = $util.emptyArray;

            /**
             * Creates a new FileDescriptorSet instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {perfetto.protos.IFileDescriptorSet=} [properties] Properties to set
             * @returns {perfetto.protos.FileDescriptorSet} FileDescriptorSet instance
             */
            FileDescriptorSet.create = function create(properties) {
                return new FileDescriptorSet(properties);
            };

            /**
             * Encodes the specified FileDescriptorSet message. Does not implicitly {@link perfetto.protos.FileDescriptorSet.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {perfetto.protos.IFileDescriptorSet} m FileDescriptorSet message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorSet.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.file != null && m.file.length) {
                    for (var i = 0; i < m.file.length; ++i)
                        $root.perfetto.protos.FileDescriptorProto.encode(m.file[i], w.uint32(10).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.FileDescriptorSet} FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorSet.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.FileDescriptorSet();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            if (!(m.file && m.file.length))
                                m.file = [];
                            m.file.push($root.perfetto.protos.FileDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.FileDescriptorSet} FileDescriptorSet
             */
            FileDescriptorSet.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.FileDescriptorSet)
                    return d;
                var m = new $root.perfetto.protos.FileDescriptorSet();
                if (d.file) {
                    if (!Array.isArray(d.file))
                        throw TypeError(".perfetto.protos.FileDescriptorSet.file: array expected");
                    m.file = [];
                    for (var i = 0; i < d.file.length; ++i) {
                        if (typeof d.file[i] !== "object")
                            throw TypeError(".perfetto.protos.FileDescriptorSet.file: object expected");
                        m.file[i] = $root.perfetto.protos.FileDescriptorProto.fromObject(d.file[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {perfetto.protos.FileDescriptorSet} m FileDescriptorSet
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FileDescriptorSet.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.file = [];
                }
                if (m.file && m.file.length) {
                    d.file = [];
                    for (var j = 0; j < m.file.length; ++j) {
                        d.file[j] = $root.perfetto.protos.FileDescriptorProto.toObject(m.file[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this FileDescriptorSet to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FileDescriptorSet
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FileDescriptorSet.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FileDescriptorSet
             * @function getTypeUrl
             * @memberof perfetto.protos.FileDescriptorSet
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FileDescriptorSet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.FileDescriptorSet";
            };

            return FileDescriptorSet;
        })();

        protos.FileDescriptorProto = (function() {

            /**
             * Properties of a FileDescriptorProto.
             * @memberof perfetto.protos
             * @interface IFileDescriptorProto
             * @property {string|null} [name] FileDescriptorProto name
             * @property {string|null} ["package"] FileDescriptorProto package
             * @property {Array.<string>|null} [dependency] FileDescriptorProto dependency
             * @property {Array.<number>|null} [publicDependency] FileDescriptorProto publicDependency
             * @property {Array.<number>|null} [weakDependency] FileDescriptorProto weakDependency
             * @property {Array.<perfetto.protos.IDescriptorProto>|null} [messageType] FileDescriptorProto messageType
             * @property {Array.<perfetto.protos.IEnumDescriptorProto>|null} [enumType] FileDescriptorProto enumType
             * @property {Array.<perfetto.protos.IFieldDescriptorProto>|null} [extension] FileDescriptorProto extension
             */

            /**
             * Constructs a new FileDescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents a FileDescriptorProto.
             * @implements IFileDescriptorProto
             * @constructor
             * @param {perfetto.protos.IFileDescriptorProto=} [p] Properties to set
             */
            function FileDescriptorProto(p) {
                this.dependency = [];
                this.publicDependency = [];
                this.weakDependency = [];
                this.messageType = [];
                this.enumType = [];
                this.extension = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * FileDescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.name = "";

            /**
             * FileDescriptorProto package.
             * @member {string} package
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype["package"] = "";

            /**
             * FileDescriptorProto dependency.
             * @member {Array.<string>} dependency
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.dependency = $util.emptyArray;

            /**
             * FileDescriptorProto publicDependency.
             * @member {Array.<number>} publicDependency
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.publicDependency = $util.emptyArray;

            /**
             * FileDescriptorProto weakDependency.
             * @member {Array.<number>} weakDependency
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.weakDependency = $util.emptyArray;

            /**
             * FileDescriptorProto messageType.
             * @member {Array.<perfetto.protos.IDescriptorProto>} messageType
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.messageType = $util.emptyArray;

            /**
             * FileDescriptorProto enumType.
             * @member {Array.<perfetto.protos.IEnumDescriptorProto>} enumType
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.enumType = $util.emptyArray;

            /**
             * FileDescriptorProto extension.
             * @member {Array.<perfetto.protos.IFieldDescriptorProto>} extension
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.extension = $util.emptyArray;

            /**
             * Creates a new FileDescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {perfetto.protos.IFileDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.FileDescriptorProto} FileDescriptorProto instance
             */
            FileDescriptorProto.create = function create(properties) {
                return new FileDescriptorProto(properties);
            };

            /**
             * Encodes the specified FileDescriptorProto message. Does not implicitly {@link perfetto.protos.FileDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {perfetto.protos.IFileDescriptorProto} m FileDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m["package"] != null && Object.hasOwnProperty.call(m, "package"))
                    w.uint32(18).string(m["package"]);
                if (m.dependency != null && m.dependency.length) {
                    for (var i = 0; i < m.dependency.length; ++i)
                        w.uint32(26).string(m.dependency[i]);
                }
                if (m.messageType != null && m.messageType.length) {
                    for (var i = 0; i < m.messageType.length; ++i)
                        $root.perfetto.protos.DescriptorProto.encode(m.messageType[i], w.uint32(34).fork()).ldelim();
                }
                if (m.enumType != null && m.enumType.length) {
                    for (var i = 0; i < m.enumType.length; ++i)
                        $root.perfetto.protos.EnumDescriptorProto.encode(m.enumType[i], w.uint32(42).fork()).ldelim();
                }
                if (m.extension != null && m.extension.length) {
                    for (var i = 0; i < m.extension.length; ++i)
                        $root.perfetto.protos.FieldDescriptorProto.encode(m.extension[i], w.uint32(58).fork()).ldelim();
                }
                if (m.publicDependency != null && m.publicDependency.length) {
                    for (var i = 0; i < m.publicDependency.length; ++i)
                        w.uint32(80).int32(m.publicDependency[i]);
                }
                if (m.weakDependency != null && m.weakDependency.length) {
                    for (var i = 0; i < m.weakDependency.length; ++i)
                        w.uint32(88).int32(m.weakDependency[i]);
                }
                return w;
            };

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.FileDescriptorProto} FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.FileDescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 2: {
                            m["package"] = r.string();
                            break;
                        }
                    case 3: {
                            if (!(m.dependency && m.dependency.length))
                                m.dependency = [];
                            m.dependency.push(r.string());
                            break;
                        }
                    case 10: {
                            if (!(m.publicDependency && m.publicDependency.length))
                                m.publicDependency = [];
                            if ((t & 7) === 2) {
                                var c2 = r.uint32() + r.pos;
                                while (r.pos < c2)
                                    m.publicDependency.push(r.int32());
                            } else
                                m.publicDependency.push(r.int32());
                            break;
                        }
                    case 11: {
                            if (!(m.weakDependency && m.weakDependency.length))
                                m.weakDependency = [];
                            if ((t & 7) === 2) {
                                var c2 = r.uint32() + r.pos;
                                while (r.pos < c2)
                                    m.weakDependency.push(r.int32());
                            } else
                                m.weakDependency.push(r.int32());
                            break;
                        }
                    case 4: {
                            if (!(m.messageType && m.messageType.length))
                                m.messageType = [];
                            m.messageType.push($root.perfetto.protos.DescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 5: {
                            if (!(m.enumType && m.enumType.length))
                                m.enumType = [];
                            m.enumType.push($root.perfetto.protos.EnumDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 7: {
                            if (!(m.extension && m.extension.length))
                                m.extension = [];
                            m.extension.push($root.perfetto.protos.FieldDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.FileDescriptorProto} FileDescriptorProto
             */
            FileDescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.FileDescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.FileDescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d["package"] != null) {
                    m["package"] = String(d["package"]);
                }
                if (d.dependency) {
                    if (!Array.isArray(d.dependency))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.dependency: array expected");
                    m.dependency = [];
                    for (var i = 0; i < d.dependency.length; ++i) {
                        m.dependency[i] = String(d.dependency[i]);
                    }
                }
                if (d.publicDependency) {
                    if (!Array.isArray(d.publicDependency))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.publicDependency: array expected");
                    m.publicDependency = [];
                    for (var i = 0; i < d.publicDependency.length; ++i) {
                        m.publicDependency[i] = d.publicDependency[i] | 0;
                    }
                }
                if (d.weakDependency) {
                    if (!Array.isArray(d.weakDependency))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.weakDependency: array expected");
                    m.weakDependency = [];
                    for (var i = 0; i < d.weakDependency.length; ++i) {
                        m.weakDependency[i] = d.weakDependency[i] | 0;
                    }
                }
                if (d.messageType) {
                    if (!Array.isArray(d.messageType))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.messageType: array expected");
                    m.messageType = [];
                    for (var i = 0; i < d.messageType.length; ++i) {
                        if (typeof d.messageType[i] !== "object")
                            throw TypeError(".perfetto.protos.FileDescriptorProto.messageType: object expected");
                        m.messageType[i] = $root.perfetto.protos.DescriptorProto.fromObject(d.messageType[i]);
                    }
                }
                if (d.enumType) {
                    if (!Array.isArray(d.enumType))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.enumType: array expected");
                    m.enumType = [];
                    for (var i = 0; i < d.enumType.length; ++i) {
                        if (typeof d.enumType[i] !== "object")
                            throw TypeError(".perfetto.protos.FileDescriptorProto.enumType: object expected");
                        m.enumType[i] = $root.perfetto.protos.EnumDescriptorProto.fromObject(d.enumType[i]);
                    }
                }
                if (d.extension) {
                    if (!Array.isArray(d.extension))
                        throw TypeError(".perfetto.protos.FileDescriptorProto.extension: array expected");
                    m.extension = [];
                    for (var i = 0; i < d.extension.length; ++i) {
                        if (typeof d.extension[i] !== "object")
                            throw TypeError(".perfetto.protos.FileDescriptorProto.extension: object expected");
                        m.extension[i] = $root.perfetto.protos.FieldDescriptorProto.fromObject(d.extension[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {perfetto.protos.FileDescriptorProto} m FileDescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FileDescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.dependency = [];
                    d.messageType = [];
                    d.enumType = [];
                    d.extension = [];
                    d.publicDependency = [];
                    d.weakDependency = [];
                }
                if (o.defaults) {
                    d.name = "";
                    d["package"] = "";
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m["package"] != null && m.hasOwnProperty("package")) {
                    d["package"] = m["package"];
                }
                if (m.dependency && m.dependency.length) {
                    d.dependency = [];
                    for (var j = 0; j < m.dependency.length; ++j) {
                        d.dependency[j] = m.dependency[j];
                    }
                }
                if (m.messageType && m.messageType.length) {
                    d.messageType = [];
                    for (var j = 0; j < m.messageType.length; ++j) {
                        d.messageType[j] = $root.perfetto.protos.DescriptorProto.toObject(m.messageType[j], o);
                    }
                }
                if (m.enumType && m.enumType.length) {
                    d.enumType = [];
                    for (var j = 0; j < m.enumType.length; ++j) {
                        d.enumType[j] = $root.perfetto.protos.EnumDescriptorProto.toObject(m.enumType[j], o);
                    }
                }
                if (m.extension && m.extension.length) {
                    d.extension = [];
                    for (var j = 0; j < m.extension.length; ++j) {
                        d.extension[j] = $root.perfetto.protos.FieldDescriptorProto.toObject(m.extension[j], o);
                    }
                }
                if (m.publicDependency && m.publicDependency.length) {
                    d.publicDependency = [];
                    for (var j = 0; j < m.publicDependency.length; ++j) {
                        d.publicDependency[j] = m.publicDependency[j];
                    }
                }
                if (m.weakDependency && m.weakDependency.length) {
                    d.weakDependency = [];
                    for (var j = 0; j < m.weakDependency.length; ++j) {
                        d.weakDependency[j] = m.weakDependency[j];
                    }
                }
                return d;
            };

            /**
             * Converts this FileDescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FileDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FileDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FileDescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.FileDescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FileDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.FileDescriptorProto";
            };

            return FileDescriptorProto;
        })();

        protos.DescriptorProto = (function() {

            /**
             * Properties of a DescriptorProto.
             * @memberof perfetto.protos
             * @interface IDescriptorProto
             * @property {string|null} [name] DescriptorProto name
             * @property {Array.<perfetto.protos.IFieldDescriptorProto>|null} [field] DescriptorProto field
             * @property {Array.<perfetto.protos.IFieldDescriptorProto>|null} [extension] DescriptorProto extension
             * @property {Array.<perfetto.protos.IDescriptorProto>|null} [nestedType] DescriptorProto nestedType
             * @property {Array.<perfetto.protos.IEnumDescriptorProto>|null} [enumType] DescriptorProto enumType
             * @property {Array.<perfetto.protos.IOneofDescriptorProto>|null} [oneofDecl] DescriptorProto oneofDecl
             * @property {Array.<perfetto.protos.DescriptorProto.IReservedRange>|null} [reservedRange] DescriptorProto reservedRange
             * @property {Array.<string>|null} [reservedName] DescriptorProto reservedName
             */

            /**
             * Constructs a new DescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents a DescriptorProto.
             * @implements IDescriptorProto
             * @constructor
             * @param {perfetto.protos.IDescriptorProto=} [p] Properties to set
             */
            function DescriptorProto(p) {
                this.field = [];
                this.extension = [];
                this.nestedType = [];
                this.enumType = [];
                this.oneofDecl = [];
                this.reservedRange = [];
                this.reservedName = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * DescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.name = "";

            /**
             * DescriptorProto field.
             * @member {Array.<perfetto.protos.IFieldDescriptorProto>} field
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.field = $util.emptyArray;

            /**
             * DescriptorProto extension.
             * @member {Array.<perfetto.protos.IFieldDescriptorProto>} extension
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.extension = $util.emptyArray;

            /**
             * DescriptorProto nestedType.
             * @member {Array.<perfetto.protos.IDescriptorProto>} nestedType
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.nestedType = $util.emptyArray;

            /**
             * DescriptorProto enumType.
             * @member {Array.<perfetto.protos.IEnumDescriptorProto>} enumType
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.enumType = $util.emptyArray;

            /**
             * DescriptorProto oneofDecl.
             * @member {Array.<perfetto.protos.IOneofDescriptorProto>} oneofDecl
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.oneofDecl = $util.emptyArray;

            /**
             * DescriptorProto reservedRange.
             * @member {Array.<perfetto.protos.DescriptorProto.IReservedRange>} reservedRange
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.reservedRange = $util.emptyArray;

            /**
             * DescriptorProto reservedName.
             * @member {Array.<string>} reservedName
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.reservedName = $util.emptyArray;

            /**
             * Creates a new DescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {perfetto.protos.IDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.DescriptorProto} DescriptorProto instance
             */
            DescriptorProto.create = function create(properties) {
                return new DescriptorProto(properties);
            };

            /**
             * Encodes the specified DescriptorProto message. Does not implicitly {@link perfetto.protos.DescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {perfetto.protos.IDescriptorProto} m DescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m.field != null && m.field.length) {
                    for (var i = 0; i < m.field.length; ++i)
                        $root.perfetto.protos.FieldDescriptorProto.encode(m.field[i], w.uint32(18).fork()).ldelim();
                }
                if (m.nestedType != null && m.nestedType.length) {
                    for (var i = 0; i < m.nestedType.length; ++i)
                        $root.perfetto.protos.DescriptorProto.encode(m.nestedType[i], w.uint32(26).fork()).ldelim();
                }
                if (m.enumType != null && m.enumType.length) {
                    for (var i = 0; i < m.enumType.length; ++i)
                        $root.perfetto.protos.EnumDescriptorProto.encode(m.enumType[i], w.uint32(34).fork()).ldelim();
                }
                if (m.extension != null && m.extension.length) {
                    for (var i = 0; i < m.extension.length; ++i)
                        $root.perfetto.protos.FieldDescriptorProto.encode(m.extension[i], w.uint32(50).fork()).ldelim();
                }
                if (m.oneofDecl != null && m.oneofDecl.length) {
                    for (var i = 0; i < m.oneofDecl.length; ++i)
                        $root.perfetto.protos.OneofDescriptorProto.encode(m.oneofDecl[i], w.uint32(66).fork()).ldelim();
                }
                if (m.reservedRange != null && m.reservedRange.length) {
                    for (var i = 0; i < m.reservedRange.length; ++i)
                        $root.perfetto.protos.DescriptorProto.ReservedRange.encode(m.reservedRange[i], w.uint32(74).fork()).ldelim();
                }
                if (m.reservedName != null && m.reservedName.length) {
                    for (var i = 0; i < m.reservedName.length; ++i)
                        w.uint32(82).string(m.reservedName[i]);
                }
                return w;
            };

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.DescriptorProto} DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.DescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 2: {
                            if (!(m.field && m.field.length))
                                m.field = [];
                            m.field.push($root.perfetto.protos.FieldDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 6: {
                            if (!(m.extension && m.extension.length))
                                m.extension = [];
                            m.extension.push($root.perfetto.protos.FieldDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 3: {
                            if (!(m.nestedType && m.nestedType.length))
                                m.nestedType = [];
                            m.nestedType.push($root.perfetto.protos.DescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 4: {
                            if (!(m.enumType && m.enumType.length))
                                m.enumType = [];
                            m.enumType.push($root.perfetto.protos.EnumDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 8: {
                            if (!(m.oneofDecl && m.oneofDecl.length))
                                m.oneofDecl = [];
                            m.oneofDecl.push($root.perfetto.protos.OneofDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 9: {
                            if (!(m.reservedRange && m.reservedRange.length))
                                m.reservedRange = [];
                            m.reservedRange.push($root.perfetto.protos.DescriptorProto.ReservedRange.decode(r, r.uint32()));
                            break;
                        }
                    case 10: {
                            if (!(m.reservedName && m.reservedName.length))
                                m.reservedName = [];
                            m.reservedName.push(r.string());
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.DescriptorProto} DescriptorProto
             */
            DescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.DescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.DescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d.field) {
                    if (!Array.isArray(d.field))
                        throw TypeError(".perfetto.protos.DescriptorProto.field: array expected");
                    m.field = [];
                    for (var i = 0; i < d.field.length; ++i) {
                        if (typeof d.field[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.field: object expected");
                        m.field[i] = $root.perfetto.protos.FieldDescriptorProto.fromObject(d.field[i]);
                    }
                }
                if (d.extension) {
                    if (!Array.isArray(d.extension))
                        throw TypeError(".perfetto.protos.DescriptorProto.extension: array expected");
                    m.extension = [];
                    for (var i = 0; i < d.extension.length; ++i) {
                        if (typeof d.extension[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.extension: object expected");
                        m.extension[i] = $root.perfetto.protos.FieldDescriptorProto.fromObject(d.extension[i]);
                    }
                }
                if (d.nestedType) {
                    if (!Array.isArray(d.nestedType))
                        throw TypeError(".perfetto.protos.DescriptorProto.nestedType: array expected");
                    m.nestedType = [];
                    for (var i = 0; i < d.nestedType.length; ++i) {
                        if (typeof d.nestedType[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.nestedType: object expected");
                        m.nestedType[i] = $root.perfetto.protos.DescriptorProto.fromObject(d.nestedType[i]);
                    }
                }
                if (d.enumType) {
                    if (!Array.isArray(d.enumType))
                        throw TypeError(".perfetto.protos.DescriptorProto.enumType: array expected");
                    m.enumType = [];
                    for (var i = 0; i < d.enumType.length; ++i) {
                        if (typeof d.enumType[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.enumType: object expected");
                        m.enumType[i] = $root.perfetto.protos.EnumDescriptorProto.fromObject(d.enumType[i]);
                    }
                }
                if (d.oneofDecl) {
                    if (!Array.isArray(d.oneofDecl))
                        throw TypeError(".perfetto.protos.DescriptorProto.oneofDecl: array expected");
                    m.oneofDecl = [];
                    for (var i = 0; i < d.oneofDecl.length; ++i) {
                        if (typeof d.oneofDecl[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.oneofDecl: object expected");
                        m.oneofDecl[i] = $root.perfetto.protos.OneofDescriptorProto.fromObject(d.oneofDecl[i]);
                    }
                }
                if (d.reservedRange) {
                    if (!Array.isArray(d.reservedRange))
                        throw TypeError(".perfetto.protos.DescriptorProto.reservedRange: array expected");
                    m.reservedRange = [];
                    for (var i = 0; i < d.reservedRange.length; ++i) {
                        if (typeof d.reservedRange[i] !== "object")
                            throw TypeError(".perfetto.protos.DescriptorProto.reservedRange: object expected");
                        m.reservedRange[i] = $root.perfetto.protos.DescriptorProto.ReservedRange.fromObject(d.reservedRange[i]);
                    }
                }
                if (d.reservedName) {
                    if (!Array.isArray(d.reservedName))
                        throw TypeError(".perfetto.protos.DescriptorProto.reservedName: array expected");
                    m.reservedName = [];
                    for (var i = 0; i < d.reservedName.length; ++i) {
                        m.reservedName[i] = String(d.reservedName[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {perfetto.protos.DescriptorProto} m DescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.field = [];
                    d.nestedType = [];
                    d.enumType = [];
                    d.extension = [];
                    d.oneofDecl = [];
                    d.reservedRange = [];
                    d.reservedName = [];
                }
                if (o.defaults) {
                    d.name = "";
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m.field && m.field.length) {
                    d.field = [];
                    for (var j = 0; j < m.field.length; ++j) {
                        d.field[j] = $root.perfetto.protos.FieldDescriptorProto.toObject(m.field[j], o);
                    }
                }
                if (m.nestedType && m.nestedType.length) {
                    d.nestedType = [];
                    for (var j = 0; j < m.nestedType.length; ++j) {
                        d.nestedType[j] = $root.perfetto.protos.DescriptorProto.toObject(m.nestedType[j], o);
                    }
                }
                if (m.enumType && m.enumType.length) {
                    d.enumType = [];
                    for (var j = 0; j < m.enumType.length; ++j) {
                        d.enumType[j] = $root.perfetto.protos.EnumDescriptorProto.toObject(m.enumType[j], o);
                    }
                }
                if (m.extension && m.extension.length) {
                    d.extension = [];
                    for (var j = 0; j < m.extension.length; ++j) {
                        d.extension[j] = $root.perfetto.protos.FieldDescriptorProto.toObject(m.extension[j], o);
                    }
                }
                if (m.oneofDecl && m.oneofDecl.length) {
                    d.oneofDecl = [];
                    for (var j = 0; j < m.oneofDecl.length; ++j) {
                        d.oneofDecl[j] = $root.perfetto.protos.OneofDescriptorProto.toObject(m.oneofDecl[j], o);
                    }
                }
                if (m.reservedRange && m.reservedRange.length) {
                    d.reservedRange = [];
                    for (var j = 0; j < m.reservedRange.length; ++j) {
                        d.reservedRange[j] = $root.perfetto.protos.DescriptorProto.ReservedRange.toObject(m.reservedRange[j], o);
                    }
                }
                if (m.reservedName && m.reservedName.length) {
                    d.reservedName = [];
                    for (var j = 0; j < m.reservedName.length; ++j) {
                        d.reservedName[j] = m.reservedName[j];
                    }
                }
                return d;
            };

            /**
             * Converts this DescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.DescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for DescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.DescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            DescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.DescriptorProto";
            };

            DescriptorProto.ReservedRange = (function() {

                /**
                 * Properties of a ReservedRange.
                 * @memberof perfetto.protos.DescriptorProto
                 * @interface IReservedRange
                 * @property {number|null} [start] ReservedRange start
                 * @property {number|null} [end] ReservedRange end
                 */

                /**
                 * Constructs a new ReservedRange.
                 * @memberof perfetto.protos.DescriptorProto
                 * @classdesc Represents a ReservedRange.
                 * @implements IReservedRange
                 * @constructor
                 * @param {perfetto.protos.DescriptorProto.IReservedRange=} [p] Properties to set
                 */
                function ReservedRange(p) {
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * ReservedRange start.
                 * @member {number} start
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @instance
                 */
                ReservedRange.prototype.start = 0;

                /**
                 * ReservedRange end.
                 * @member {number} end
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @instance
                 */
                ReservedRange.prototype.end = 0;

                /**
                 * Creates a new ReservedRange instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {perfetto.protos.DescriptorProto.IReservedRange=} [properties] Properties to set
                 * @returns {perfetto.protos.DescriptorProto.ReservedRange} ReservedRange instance
                 */
                ReservedRange.create = function create(properties) {
                    return new ReservedRange(properties);
                };

                /**
                 * Encodes the specified ReservedRange message. Does not implicitly {@link perfetto.protos.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {perfetto.protos.DescriptorProto.IReservedRange} m ReservedRange message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                ReservedRange.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.start != null && Object.hasOwnProperty.call(m, "start"))
                        w.uint32(8).int32(m.start);
                    if (m.end != null && Object.hasOwnProperty.call(m, "end"))
                        w.uint32(16).int32(m.end);
                    return w;
                };

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.DescriptorProto.ReservedRange} ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                ReservedRange.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.DescriptorProto.ReservedRange();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.start = r.int32();
                                break;
                            }
                        case 2: {
                                m.end = r.int32();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.DescriptorProto.ReservedRange} ReservedRange
                 */
                ReservedRange.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.DescriptorProto.ReservedRange)
                        return d;
                    var m = new $root.perfetto.protos.DescriptorProto.ReservedRange();
                    if (d.start != null) {
                        m.start = d.start | 0;
                    }
                    if (d.end != null) {
                        m.end = d.end | 0;
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {perfetto.protos.DescriptorProto.ReservedRange} m ReservedRange
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ReservedRange.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.defaults) {
                        d.start = 0;
                        d.end = 0;
                    }
                    if (m.start != null && m.hasOwnProperty("start")) {
                        d.start = m.start;
                    }
                    if (m.end != null && m.hasOwnProperty("end")) {
                        d.end = m.end;
                    }
                    return d;
                };

                /**
                 * Converts this ReservedRange to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ReservedRange.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for ReservedRange
                 * @function getTypeUrl
                 * @memberof perfetto.protos.DescriptorProto.ReservedRange
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                ReservedRange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.DescriptorProto.ReservedRange";
                };

                return ReservedRange;
            })();

            return DescriptorProto;
        })();

        protos.UninterpretedOption = (function() {

            /**
             * Properties of an UninterpretedOption.
             * @memberof perfetto.protos
             * @interface IUninterpretedOption
             * @property {Array.<perfetto.protos.UninterpretedOption.INamePart>|null} [name] UninterpretedOption name
             * @property {string|null} [identifierValue] UninterpretedOption identifierValue
             * @property {number|null} [positiveIntValue] UninterpretedOption positiveIntValue
             * @property {number|null} [negativeIntValue] UninterpretedOption negativeIntValue
             * @property {number|null} [doubleValue] UninterpretedOption doubleValue
             * @property {Uint8Array|null} [stringValue] UninterpretedOption stringValue
             * @property {string|null} [aggregateValue] UninterpretedOption aggregateValue
             */

            /**
             * Constructs a new UninterpretedOption.
             * @memberof perfetto.protos
             * @classdesc Represents an UninterpretedOption.
             * @implements IUninterpretedOption
             * @constructor
             * @param {perfetto.protos.IUninterpretedOption=} [p] Properties to set
             */
            function UninterpretedOption(p) {
                this.name = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * UninterpretedOption name.
             * @member {Array.<perfetto.protos.UninterpretedOption.INamePart>} name
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.name = $util.emptyArray;

            /**
             * UninterpretedOption identifierValue.
             * @member {string} identifierValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.identifierValue = "";

            /**
             * UninterpretedOption positiveIntValue.
             * @member {number} positiveIntValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.positiveIntValue = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * UninterpretedOption negativeIntValue.
             * @member {number} negativeIntValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.negativeIntValue = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * UninterpretedOption doubleValue.
             * @member {number} doubleValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.doubleValue = 0;

            /**
             * UninterpretedOption stringValue.
             * @member {Uint8Array} stringValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.stringValue = $util.newBuffer([]);

            /**
             * UninterpretedOption aggregateValue.
             * @member {string} aggregateValue
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.aggregateValue = "";

            /**
             * Creates a new UninterpretedOption instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {perfetto.protos.IUninterpretedOption=} [properties] Properties to set
             * @returns {perfetto.protos.UninterpretedOption} UninterpretedOption instance
             */
            UninterpretedOption.create = function create(properties) {
                return new UninterpretedOption(properties);
            };

            /**
             * Encodes the specified UninterpretedOption message. Does not implicitly {@link perfetto.protos.UninterpretedOption.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {perfetto.protos.IUninterpretedOption} m UninterpretedOption message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UninterpretedOption.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && m.name.length) {
                    for (var i = 0; i < m.name.length; ++i)
                        $root.perfetto.protos.UninterpretedOption.NamePart.encode(m.name[i], w.uint32(18).fork()).ldelim();
                }
                if (m.identifierValue != null && Object.hasOwnProperty.call(m, "identifierValue"))
                    w.uint32(26).string(m.identifierValue);
                if (m.positiveIntValue != null && Object.hasOwnProperty.call(m, "positiveIntValue"))
                    w.uint32(32).uint64(m.positiveIntValue);
                if (m.negativeIntValue != null && Object.hasOwnProperty.call(m, "negativeIntValue"))
                    w.uint32(40).int64(m.negativeIntValue);
                if (m.doubleValue != null && Object.hasOwnProperty.call(m, "doubleValue"))
                    w.uint32(49).double(m.doubleValue);
                if (m.stringValue != null && Object.hasOwnProperty.call(m, "stringValue"))
                    w.uint32(58).bytes(m.stringValue);
                if (m.aggregateValue != null && Object.hasOwnProperty.call(m, "aggregateValue"))
                    w.uint32(66).string(m.aggregateValue);
                return w;
            };

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.UninterpretedOption} UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UninterpretedOption.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.UninterpretedOption();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 2: {
                            if (!(m.name && m.name.length))
                                m.name = [];
                            m.name.push($root.perfetto.protos.UninterpretedOption.NamePart.decode(r, r.uint32()));
                            break;
                        }
                    case 3: {
                            m.identifierValue = r.string();
                            break;
                        }
                    case 4: {
                            m.positiveIntValue = r.uint64();
                            break;
                        }
                    case 5: {
                            m.negativeIntValue = r.int64();
                            break;
                        }
                    case 6: {
                            m.doubleValue = r.double();
                            break;
                        }
                    case 7: {
                            m.stringValue = r.bytes();
                            break;
                        }
                    case 8: {
                            m.aggregateValue = r.string();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.UninterpretedOption} UninterpretedOption
             */
            UninterpretedOption.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.UninterpretedOption)
                    return d;
                var m = new $root.perfetto.protos.UninterpretedOption();
                if (d.name) {
                    if (!Array.isArray(d.name))
                        throw TypeError(".perfetto.protos.UninterpretedOption.name: array expected");
                    m.name = [];
                    for (var i = 0; i < d.name.length; ++i) {
                        if (typeof d.name[i] !== "object")
                            throw TypeError(".perfetto.protos.UninterpretedOption.name: object expected");
                        m.name[i] = $root.perfetto.protos.UninterpretedOption.NamePart.fromObject(d.name[i]);
                    }
                }
                if (d.identifierValue != null) {
                    m.identifierValue = String(d.identifierValue);
                }
                if (d.positiveIntValue != null) {
                    if ($util.Long)
                        (m.positiveIntValue = $util.Long.fromValue(d.positiveIntValue)).unsigned = true;
                    else if (typeof d.positiveIntValue === "string")
                        m.positiveIntValue = parseInt(d.positiveIntValue, 10);
                    else if (typeof d.positiveIntValue === "number")
                        m.positiveIntValue = d.positiveIntValue;
                    else if (typeof d.positiveIntValue === "object")
                        m.positiveIntValue = new $util.LongBits(d.positiveIntValue.low >>> 0, d.positiveIntValue.high >>> 0).toNumber(true);
                }
                if (d.negativeIntValue != null) {
                    if ($util.Long)
                        (m.negativeIntValue = $util.Long.fromValue(d.negativeIntValue)).unsigned = false;
                    else if (typeof d.negativeIntValue === "string")
                        m.negativeIntValue = parseInt(d.negativeIntValue, 10);
                    else if (typeof d.negativeIntValue === "number")
                        m.negativeIntValue = d.negativeIntValue;
                    else if (typeof d.negativeIntValue === "object")
                        m.negativeIntValue = new $util.LongBits(d.negativeIntValue.low >>> 0, d.negativeIntValue.high >>> 0).toNumber();
                }
                if (d.doubleValue != null) {
                    m.doubleValue = Number(d.doubleValue);
                }
                if (d.stringValue != null) {
                    if (typeof d.stringValue === "string")
                        $util.base64.decode(d.stringValue, m.stringValue = $util.newBuffer($util.base64.length(d.stringValue)), 0);
                    else if (d.stringValue.length >= 0)
                        m.stringValue = d.stringValue;
                }
                if (d.aggregateValue != null) {
                    m.aggregateValue = String(d.aggregateValue);
                }
                return m;
            };

            /**
             * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {perfetto.protos.UninterpretedOption} m UninterpretedOption
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UninterpretedOption.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.name = [];
                }
                if (o.defaults) {
                    d.identifierValue = "";
                    if ($util.Long) {
                        var n = new $util.Long(0, 0, true);
                        d.positiveIntValue = o.longs === String ? n.toString() : o.longs === Number ? n.toNumber() : n;
                    } else
                        d.positiveIntValue = o.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var n = new $util.Long(0, 0, false);
                        d.negativeIntValue = o.longs === String ? n.toString() : o.longs === Number ? n.toNumber() : n;
                    } else
                        d.negativeIntValue = o.longs === String ? "0" : 0;
                    d.doubleValue = 0;
                    if (o.bytes === String)
                        d.stringValue = "";
                    else {
                        d.stringValue = [];
                        if (o.bytes !== Array)
                            d.stringValue = $util.newBuffer(d.stringValue);
                    }
                    d.aggregateValue = "";
                }
                if (m.name && m.name.length) {
                    d.name = [];
                    for (var j = 0; j < m.name.length; ++j) {
                        d.name[j] = $root.perfetto.protos.UninterpretedOption.NamePart.toObject(m.name[j], o);
                    }
                }
                if (m.identifierValue != null && m.hasOwnProperty("identifierValue")) {
                    d.identifierValue = m.identifierValue;
                }
                if (m.positiveIntValue != null && m.hasOwnProperty("positiveIntValue")) {
                    if (typeof m.positiveIntValue === "number")
                        d.positiveIntValue = o.longs === String ? String(m.positiveIntValue) : m.positiveIntValue;
                    else
                        d.positiveIntValue = o.longs === String ? $util.Long.prototype.toString.call(m.positiveIntValue) : o.longs === Number ? new $util.LongBits(m.positiveIntValue.low >>> 0, m.positiveIntValue.high >>> 0).toNumber(true) : m.positiveIntValue;
                }
                if (m.negativeIntValue != null && m.hasOwnProperty("negativeIntValue")) {
                    if (typeof m.negativeIntValue === "number")
                        d.negativeIntValue = o.longs === String ? String(m.negativeIntValue) : m.negativeIntValue;
                    else
                        d.negativeIntValue = o.longs === String ? $util.Long.prototype.toString.call(m.negativeIntValue) : o.longs === Number ? new $util.LongBits(m.negativeIntValue.low >>> 0, m.negativeIntValue.high >>> 0).toNumber() : m.negativeIntValue;
                }
                if (m.doubleValue != null && m.hasOwnProperty("doubleValue")) {
                    d.doubleValue = o.json && !isFinite(m.doubleValue) ? String(m.doubleValue) : m.doubleValue;
                }
                if (m.stringValue != null && m.hasOwnProperty("stringValue")) {
                    d.stringValue = o.bytes === String ? $util.base64.encode(m.stringValue, 0, m.stringValue.length) : o.bytes === Array ? Array.prototype.slice.call(m.stringValue) : m.stringValue;
                }
                if (m.aggregateValue != null && m.hasOwnProperty("aggregateValue")) {
                    d.aggregateValue = m.aggregateValue;
                }
                return d;
            };

            /**
             * Converts this UninterpretedOption to JSON.
             * @function toJSON
             * @memberof perfetto.protos.UninterpretedOption
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UninterpretedOption.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for UninterpretedOption
             * @function getTypeUrl
             * @memberof perfetto.protos.UninterpretedOption
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            UninterpretedOption.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.UninterpretedOption";
            };

            UninterpretedOption.NamePart = (function() {

                /**
                 * Properties of a NamePart.
                 * @memberof perfetto.protos.UninterpretedOption
                 * @interface INamePart
                 * @property {string|null} [namePart] NamePart namePart
                 * @property {boolean|null} [isExtension] NamePart isExtension
                 */

                /**
                 * Constructs a new NamePart.
                 * @memberof perfetto.protos.UninterpretedOption
                 * @classdesc Represents a NamePart.
                 * @implements INamePart
                 * @constructor
                 * @param {perfetto.protos.UninterpretedOption.INamePart=} [p] Properties to set
                 */
                function NamePart(p) {
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * NamePart namePart.
                 * @member {string} namePart
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @instance
                 */
                NamePart.prototype.namePart = "";

                /**
                 * NamePart isExtension.
                 * @member {boolean} isExtension
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @instance
                 */
                NamePart.prototype.isExtension = false;

                /**
                 * Creates a new NamePart instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {perfetto.protos.UninterpretedOption.INamePart=} [properties] Properties to set
                 * @returns {perfetto.protos.UninterpretedOption.NamePart} NamePart instance
                 */
                NamePart.create = function create(properties) {
                    return new NamePart(properties);
                };

                /**
                 * Encodes the specified NamePart message. Does not implicitly {@link perfetto.protos.UninterpretedOption.NamePart.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {perfetto.protos.UninterpretedOption.INamePart} m NamePart message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                NamePart.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.namePart != null && Object.hasOwnProperty.call(m, "namePart"))
                        w.uint32(10).string(m.namePart);
                    if (m.isExtension != null && Object.hasOwnProperty.call(m, "isExtension"))
                        w.uint32(16).bool(m.isExtension);
                    return w;
                };

                /**
                 * Decodes a NamePart message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.UninterpretedOption.NamePart} NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                NamePart.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.UninterpretedOption.NamePart();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.namePart = r.string();
                                break;
                            }
                        case 2: {
                                m.isExtension = r.bool();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.UninterpretedOption.NamePart} NamePart
                 */
                NamePart.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.UninterpretedOption.NamePart)
                        return d;
                    var m = new $root.perfetto.protos.UninterpretedOption.NamePart();
                    if (d.namePart != null) {
                        m.namePart = String(d.namePart);
                    }
                    if (d.isExtension != null) {
                        m.isExtension = Boolean(d.isExtension);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {perfetto.protos.UninterpretedOption.NamePart} m NamePart
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                NamePart.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.defaults) {
                        d.namePart = "";
                        d.isExtension = false;
                    }
                    if (m.namePart != null && m.hasOwnProperty("namePart")) {
                        d.namePart = m.namePart;
                    }
                    if (m.isExtension != null && m.hasOwnProperty("isExtension")) {
                        d.isExtension = m.isExtension;
                    }
                    return d;
                };

                /**
                 * Converts this NamePart to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                NamePart.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for NamePart
                 * @function getTypeUrl
                 * @memberof perfetto.protos.UninterpretedOption.NamePart
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                NamePart.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.UninterpretedOption.NamePart";
                };

                return NamePart;
            })();

            return UninterpretedOption;
        })();

        protos.FieldOptions = (function() {

            /**
             * Properties of a FieldOptions.
             * @memberof perfetto.protos
             * @interface IFieldOptions
             * @property {boolean|null} [packed] FieldOptions packed
             * @property {Array.<perfetto.protos.IUninterpretedOption>|null} [uninterpretedOption] FieldOptions uninterpretedOption
             */

            /**
             * Constructs a new FieldOptions.
             * @memberof perfetto.protos
             * @classdesc Represents a FieldOptions.
             * @implements IFieldOptions
             * @constructor
             * @param {perfetto.protos.IFieldOptions=} [p] Properties to set
             */
            function FieldOptions(p) {
                this.uninterpretedOption = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * FieldOptions packed.
             * @member {boolean} packed
             * @memberof perfetto.protos.FieldOptions
             * @instance
             */
            FieldOptions.prototype.packed = false;

            /**
             * FieldOptions uninterpretedOption.
             * @member {Array.<perfetto.protos.IUninterpretedOption>} uninterpretedOption
             * @memberof perfetto.protos.FieldOptions
             * @instance
             */
            FieldOptions.prototype.uninterpretedOption = $util.emptyArray;

            /**
             * Creates a new FieldOptions instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {perfetto.protos.IFieldOptions=} [properties] Properties to set
             * @returns {perfetto.protos.FieldOptions} FieldOptions instance
             */
            FieldOptions.create = function create(properties) {
                return new FieldOptions(properties);
            };

            /**
             * Encodes the specified FieldOptions message. Does not implicitly {@link perfetto.protos.FieldOptions.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {perfetto.protos.IFieldOptions} m FieldOptions message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldOptions.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.packed != null && Object.hasOwnProperty.call(m, "packed"))
                    w.uint32(16).bool(m.packed);
                if (m.uninterpretedOption != null && m.uninterpretedOption.length) {
                    for (var i = 0; i < m.uninterpretedOption.length; ++i)
                        $root.perfetto.protos.UninterpretedOption.encode(m.uninterpretedOption[i], w.uint32(7994).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes a FieldOptions message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.FieldOptions} FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldOptions.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.FieldOptions();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 2: {
                            m.packed = r.bool();
                            break;
                        }
                    case 999: {
                            if (!(m.uninterpretedOption && m.uninterpretedOption.length))
                                m.uninterpretedOption = [];
                            m.uninterpretedOption.push($root.perfetto.protos.UninterpretedOption.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.FieldOptions} FieldOptions
             */
            FieldOptions.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.FieldOptions)
                    return d;
                var m = new $root.perfetto.protos.FieldOptions();
                if (d.packed != null) {
                    m.packed = Boolean(d.packed);
                }
                if (d.uninterpretedOption) {
                    if (!Array.isArray(d.uninterpretedOption))
                        throw TypeError(".perfetto.protos.FieldOptions.uninterpretedOption: array expected");
                    m.uninterpretedOption = [];
                    for (var i = 0; i < d.uninterpretedOption.length; ++i) {
                        if (typeof d.uninterpretedOption[i] !== "object")
                            throw TypeError(".perfetto.protos.FieldOptions.uninterpretedOption: object expected");
                        m.uninterpretedOption[i] = $root.perfetto.protos.UninterpretedOption.fromObject(d.uninterpretedOption[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {perfetto.protos.FieldOptions} m FieldOptions
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FieldOptions.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.uninterpretedOption = [];
                }
                if (o.defaults) {
                    d.packed = false;
                }
                if (m.packed != null && m.hasOwnProperty("packed")) {
                    d.packed = m.packed;
                }
                if (m.uninterpretedOption && m.uninterpretedOption.length) {
                    d.uninterpretedOption = [];
                    for (var j = 0; j < m.uninterpretedOption.length; ++j) {
                        d.uninterpretedOption[j] = $root.perfetto.protos.UninterpretedOption.toObject(m.uninterpretedOption[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this FieldOptions to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FieldOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FieldOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FieldOptions
             * @function getTypeUrl
             * @memberof perfetto.protos.FieldOptions
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FieldOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.FieldOptions";
            };

            return FieldOptions;
        })();

        protos.FieldDescriptorProto = (function() {

            /**
             * Properties of a FieldDescriptorProto.
             * @memberof perfetto.protos
             * @interface IFieldDescriptorProto
             * @property {string|null} [name] FieldDescriptorProto name
             * @property {number|null} [number] FieldDescriptorProto number
             * @property {perfetto.protos.FieldDescriptorProto.Label|null} [label] FieldDescriptorProto label
             * @property {perfetto.protos.FieldDescriptorProto.Type|null} [type] FieldDescriptorProto type
             * @property {string|null} [typeName] FieldDescriptorProto typeName
             * @property {string|null} [extendee] FieldDescriptorProto extendee
             * @property {string|null} [defaultValue] FieldDescriptorProto defaultValue
             * @property {perfetto.protos.IFieldOptions|null} [options] FieldDescriptorProto options
             * @property {number|null} [oneofIndex] FieldDescriptorProto oneofIndex
             */

            /**
             * Constructs a new FieldDescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents a FieldDescriptorProto.
             * @implements IFieldDescriptorProto
             * @constructor
             * @param {perfetto.protos.IFieldDescriptorProto=} [p] Properties to set
             */
            function FieldDescriptorProto(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * FieldDescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.name = "";

            /**
             * FieldDescriptorProto number.
             * @member {number} number
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.number = 0;

            /**
             * FieldDescriptorProto label.
             * @member {perfetto.protos.FieldDescriptorProto.Label} label
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.label = 1;

            /**
             * FieldDescriptorProto type.
             * @member {perfetto.protos.FieldDescriptorProto.Type} type
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.type = 1;

            /**
             * FieldDescriptorProto typeName.
             * @member {string} typeName
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.typeName = "";

            /**
             * FieldDescriptorProto extendee.
             * @member {string} extendee
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.extendee = "";

            /**
             * FieldDescriptorProto defaultValue.
             * @member {string} defaultValue
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.defaultValue = "";

            /**
             * FieldDescriptorProto options.
             * @member {perfetto.protos.IFieldOptions|null|undefined} options
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.options = null;

            /**
             * FieldDescriptorProto oneofIndex.
             * @member {number} oneofIndex
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.oneofIndex = 0;

            /**
             * Creates a new FieldDescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {perfetto.protos.IFieldDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.FieldDescriptorProto} FieldDescriptorProto instance
             */
            FieldDescriptorProto.create = function create(properties) {
                return new FieldDescriptorProto(properties);
            };

            /**
             * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link perfetto.protos.FieldDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {perfetto.protos.IFieldDescriptorProto} m FieldDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldDescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m.extendee != null && Object.hasOwnProperty.call(m, "extendee"))
                    w.uint32(18).string(m.extendee);
                if (m.number != null && Object.hasOwnProperty.call(m, "number"))
                    w.uint32(24).int32(m.number);
                if (m.label != null && Object.hasOwnProperty.call(m, "label"))
                    w.uint32(32).int32(m.label);
                if (m.type != null && Object.hasOwnProperty.call(m, "type"))
                    w.uint32(40).int32(m.type);
                if (m.typeName != null && Object.hasOwnProperty.call(m, "typeName"))
                    w.uint32(50).string(m.typeName);
                if (m.defaultValue != null && Object.hasOwnProperty.call(m, "defaultValue"))
                    w.uint32(58).string(m.defaultValue);
                if (m.options != null && Object.hasOwnProperty.call(m, "options"))
                    $root.perfetto.protos.FieldOptions.encode(m.options, w.uint32(66).fork()).ldelim();
                if (m.oneofIndex != null && Object.hasOwnProperty.call(m, "oneofIndex"))
                    w.uint32(72).int32(m.oneofIndex);
                return w;
            };

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.FieldDescriptorProto} FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldDescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.FieldDescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 3: {
                            m.number = r.int32();
                            break;
                        }
                    case 4: {
                            m.label = r.int32();
                            break;
                        }
                    case 5: {
                            m.type = r.int32();
                            break;
                        }
                    case 6: {
                            m.typeName = r.string();
                            break;
                        }
                    case 2: {
                            m.extendee = r.string();
                            break;
                        }
                    case 7: {
                            m.defaultValue = r.string();
                            break;
                        }
                    case 8: {
                            m.options = $root.perfetto.protos.FieldOptions.decode(r, r.uint32());
                            break;
                        }
                    case 9: {
                            m.oneofIndex = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.FieldDescriptorProto} FieldDescriptorProto
             */
            FieldDescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.FieldDescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.FieldDescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d.number != null) {
                    m.number = d.number | 0;
                }
                switch (d.label) {
                default:
                    if (typeof d.label === "number") {
                        m.label = d.label;
                        break;
                    }
                    break;
                case "LABEL_OPTIONAL":
                case 1:
                    m.label = 1;
                    break;
                case "LABEL_REQUIRED":
                case 2:
                    m.label = 2;
                    break;
                case "LABEL_REPEATED":
                case 3:
                    m.label = 3;
                    break;
                }
                switch (d.type) {
                default:
                    if (typeof d.type === "number") {
                        m.type = d.type;
                        break;
                    }
                    break;
                case "TYPE_DOUBLE":
                case 1:
                    m.type = 1;
                    break;
                case "TYPE_FLOAT":
                case 2:
                    m.type = 2;
                    break;
                case "TYPE_INT64":
                case 3:
                    m.type = 3;
                    break;
                case "TYPE_UINT64":
                case 4:
                    m.type = 4;
                    break;
                case "TYPE_INT32":
                case 5:
                    m.type = 5;
                    break;
                case "TYPE_FIXED64":
                case 6:
                    m.type = 6;
                    break;
                case "TYPE_FIXED32":
                case 7:
                    m.type = 7;
                    break;
                case "TYPE_BOOL":
                case 8:
                    m.type = 8;
                    break;
                case "TYPE_STRING":
                case 9:
                    m.type = 9;
                    break;
                case "TYPE_GROUP":
                case 10:
                    m.type = 10;
                    break;
                case "TYPE_MESSAGE":
                case 11:
                    m.type = 11;
                    break;
                case "TYPE_BYTES":
                case 12:
                    m.type = 12;
                    break;
                case "TYPE_UINT32":
                case 13:
                    m.type = 13;
                    break;
                case "TYPE_ENUM":
                case 14:
                    m.type = 14;
                    break;
                case "TYPE_SFIXED32":
                case 15:
                    m.type = 15;
                    break;
                case "TYPE_SFIXED64":
                case 16:
                    m.type = 16;
                    break;
                case "TYPE_SINT32":
                case 17:
                    m.type = 17;
                    break;
                case "TYPE_SINT64":
                case 18:
                    m.type = 18;
                    break;
                }
                if (d.typeName != null) {
                    m.typeName = String(d.typeName);
                }
                if (d.extendee != null) {
                    m.extendee = String(d.extendee);
                }
                if (d.defaultValue != null) {
                    m.defaultValue = String(d.defaultValue);
                }
                if (d.options != null) {
                    if (typeof d.options !== "object")
                        throw TypeError(".perfetto.protos.FieldDescriptorProto.options: object expected");
                    m.options = $root.perfetto.protos.FieldOptions.fromObject(d.options);
                }
                if (d.oneofIndex != null) {
                    m.oneofIndex = d.oneofIndex | 0;
                }
                return m;
            };

            /**
             * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {perfetto.protos.FieldDescriptorProto} m FieldDescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FieldDescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.name = "";
                    d.extendee = "";
                    d.number = 0;
                    d.label = o.enums === String ? "LABEL_OPTIONAL" : 1;
                    d.type = o.enums === String ? "TYPE_DOUBLE" : 1;
                    d.typeName = "";
                    d.defaultValue = "";
                    d.options = null;
                    d.oneofIndex = 0;
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m.extendee != null && m.hasOwnProperty("extendee")) {
                    d.extendee = m.extendee;
                }
                if (m.number != null && m.hasOwnProperty("number")) {
                    d.number = m.number;
                }
                if (m.label != null && m.hasOwnProperty("label")) {
                    d.label = o.enums === String ? $root.perfetto.protos.FieldDescriptorProto.Label[m.label] === undefined ? m.label : $root.perfetto.protos.FieldDescriptorProto.Label[m.label] : m.label;
                }
                if (m.type != null && m.hasOwnProperty("type")) {
                    d.type = o.enums === String ? $root.perfetto.protos.FieldDescriptorProto.Type[m.type] === undefined ? m.type : $root.perfetto.protos.FieldDescriptorProto.Type[m.type] : m.type;
                }
                if (m.typeName != null && m.hasOwnProperty("typeName")) {
                    d.typeName = m.typeName;
                }
                if (m.defaultValue != null && m.hasOwnProperty("defaultValue")) {
                    d.defaultValue = m.defaultValue;
                }
                if (m.options != null && m.hasOwnProperty("options")) {
                    d.options = $root.perfetto.protos.FieldOptions.toObject(m.options, o);
                }
                if (m.oneofIndex != null && m.hasOwnProperty("oneofIndex")) {
                    d.oneofIndex = m.oneofIndex;
                }
                return d;
            };

            /**
             * Converts this FieldDescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FieldDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FieldDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for FieldDescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.FieldDescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            FieldDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.FieldDescriptorProto";
            };

            /**
             * Type enum.
             * @name perfetto.protos.FieldDescriptorProto.Type
             * @enum {number}
             * @property {number} TYPE_DOUBLE=1 TYPE_DOUBLE value
             * @property {number} TYPE_FLOAT=2 TYPE_FLOAT value
             * @property {number} TYPE_INT64=3 TYPE_INT64 value
             * @property {number} TYPE_UINT64=4 TYPE_UINT64 value
             * @property {number} TYPE_INT32=5 TYPE_INT32 value
             * @property {number} TYPE_FIXED64=6 TYPE_FIXED64 value
             * @property {number} TYPE_FIXED32=7 TYPE_FIXED32 value
             * @property {number} TYPE_BOOL=8 TYPE_BOOL value
             * @property {number} TYPE_STRING=9 TYPE_STRING value
             * @property {number} TYPE_GROUP=10 TYPE_GROUP value
             * @property {number} TYPE_MESSAGE=11 TYPE_MESSAGE value
             * @property {number} TYPE_BYTES=12 TYPE_BYTES value
             * @property {number} TYPE_UINT32=13 TYPE_UINT32 value
             * @property {number} TYPE_ENUM=14 TYPE_ENUM value
             * @property {number} TYPE_SFIXED32=15 TYPE_SFIXED32 value
             * @property {number} TYPE_SFIXED64=16 TYPE_SFIXED64 value
             * @property {number} TYPE_SINT32=17 TYPE_SINT32 value
             * @property {number} TYPE_SINT64=18 TYPE_SINT64 value
             */
            FieldDescriptorProto.Type = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[1] = "TYPE_DOUBLE"] = 1;
                values[valuesById[2] = "TYPE_FLOAT"] = 2;
                values[valuesById[3] = "TYPE_INT64"] = 3;
                values[valuesById[4] = "TYPE_UINT64"] = 4;
                values[valuesById[5] = "TYPE_INT32"] = 5;
                values[valuesById[6] = "TYPE_FIXED64"] = 6;
                values[valuesById[7] = "TYPE_FIXED32"] = 7;
                values[valuesById[8] = "TYPE_BOOL"] = 8;
                values[valuesById[9] = "TYPE_STRING"] = 9;
                values[valuesById[10] = "TYPE_GROUP"] = 10;
                values[valuesById[11] = "TYPE_MESSAGE"] = 11;
                values[valuesById[12] = "TYPE_BYTES"] = 12;
                values[valuesById[13] = "TYPE_UINT32"] = 13;
                values[valuesById[14] = "TYPE_ENUM"] = 14;
                values[valuesById[15] = "TYPE_SFIXED32"] = 15;
                values[valuesById[16] = "TYPE_SFIXED64"] = 16;
                values[valuesById[17] = "TYPE_SINT32"] = 17;
                values[valuesById[18] = "TYPE_SINT64"] = 18;
                return values;
            })();

            /**
             * Label enum.
             * @name perfetto.protos.FieldDescriptorProto.Label
             * @enum {number}
             * @property {number} LABEL_OPTIONAL=1 LABEL_OPTIONAL value
             * @property {number} LABEL_REQUIRED=2 LABEL_REQUIRED value
             * @property {number} LABEL_REPEATED=3 LABEL_REPEATED value
             */
            FieldDescriptorProto.Label = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[1] = "LABEL_OPTIONAL"] = 1;
                values[valuesById[2] = "LABEL_REQUIRED"] = 2;
                values[valuesById[3] = "LABEL_REPEATED"] = 3;
                return values;
            })();

            return FieldDescriptorProto;
        })();

        protos.OneofDescriptorProto = (function() {

            /**
             * Properties of an OneofDescriptorProto.
             * @memberof perfetto.protos
             * @interface IOneofDescriptorProto
             * @property {string|null} [name] OneofDescriptorProto name
             * @property {perfetto.protos.IOneofOptions|null} [options] OneofDescriptorProto options
             */

            /**
             * Constructs a new OneofDescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents an OneofDescriptorProto.
             * @implements IOneofDescriptorProto
             * @constructor
             * @param {perfetto.protos.IOneofDescriptorProto=} [p] Properties to set
             */
            function OneofDescriptorProto(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * OneofDescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.OneofDescriptorProto
             * @instance
             */
            OneofDescriptorProto.prototype.name = "";

            /**
             * OneofDescriptorProto options.
             * @member {perfetto.protos.IOneofOptions|null|undefined} options
             * @memberof perfetto.protos.OneofDescriptorProto
             * @instance
             */
            OneofDescriptorProto.prototype.options = null;

            /**
             * Creates a new OneofDescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {perfetto.protos.IOneofDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.OneofDescriptorProto} OneofDescriptorProto instance
             */
            OneofDescriptorProto.create = function create(properties) {
                return new OneofDescriptorProto(properties);
            };

            /**
             * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link perfetto.protos.OneofDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {perfetto.protos.IOneofDescriptorProto} m OneofDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofDescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m.options != null && Object.hasOwnProperty.call(m, "options"))
                    $root.perfetto.protos.OneofOptions.encode(m.options, w.uint32(18).fork()).ldelim();
                return w;
            };

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.OneofDescriptorProto} OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofDescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.OneofDescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 2: {
                            m.options = $root.perfetto.protos.OneofOptions.decode(r, r.uint32());
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.OneofDescriptorProto} OneofDescriptorProto
             */
            OneofDescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.OneofDescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.OneofDescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d.options != null) {
                    if (typeof d.options !== "object")
                        throw TypeError(".perfetto.protos.OneofDescriptorProto.options: object expected");
                    m.options = $root.perfetto.protos.OneofOptions.fromObject(d.options);
                }
                return m;
            };

            /**
             * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {perfetto.protos.OneofDescriptorProto} m OneofDescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OneofDescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.name = "";
                    d.options = null;
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m.options != null && m.hasOwnProperty("options")) {
                    d.options = $root.perfetto.protos.OneofOptions.toObject(m.options, o);
                }
                return d;
            };

            /**
             * Converts this OneofDescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.OneofDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OneofDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for OneofDescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.OneofDescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            OneofDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.OneofDescriptorProto";
            };

            return OneofDescriptorProto;
        })();

        protos.EnumDescriptorProto = (function() {

            /**
             * Properties of an EnumDescriptorProto.
             * @memberof perfetto.protos
             * @interface IEnumDescriptorProto
             * @property {string|null} [name] EnumDescriptorProto name
             * @property {Array.<perfetto.protos.IEnumValueDescriptorProto>|null} [value] EnumDescriptorProto value
             * @property {Array.<string>|null} [reservedName] EnumDescriptorProto reservedName
             */

            /**
             * Constructs a new EnumDescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents an EnumDescriptorProto.
             * @implements IEnumDescriptorProto
             * @constructor
             * @param {perfetto.protos.IEnumDescriptorProto=} [p] Properties to set
             */
            function EnumDescriptorProto(p) {
                this.value = [];
                this.reservedName = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * EnumDescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.name = "";

            /**
             * EnumDescriptorProto value.
             * @member {Array.<perfetto.protos.IEnumValueDescriptorProto>} value
             * @memberof perfetto.protos.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.value = $util.emptyArray;

            /**
             * EnumDescriptorProto reservedName.
             * @member {Array.<string>} reservedName
             * @memberof perfetto.protos.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.reservedName = $util.emptyArray;

            /**
             * Creates a new EnumDescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {perfetto.protos.IEnumDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.EnumDescriptorProto} EnumDescriptorProto instance
             */
            EnumDescriptorProto.create = function create(properties) {
                return new EnumDescriptorProto(properties);
            };

            /**
             * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link perfetto.protos.EnumDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {perfetto.protos.IEnumDescriptorProto} m EnumDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumDescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m.value != null && m.value.length) {
                    for (var i = 0; i < m.value.length; ++i)
                        $root.perfetto.protos.EnumValueDescriptorProto.encode(m.value[i], w.uint32(18).fork()).ldelim();
                }
                if (m.reservedName != null && m.reservedName.length) {
                    for (var i = 0; i < m.reservedName.length; ++i)
                        w.uint32(42).string(m.reservedName[i]);
                }
                return w;
            };

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.EnumDescriptorProto} EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumDescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.EnumDescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 2: {
                            if (!(m.value && m.value.length))
                                m.value = [];
                            m.value.push($root.perfetto.protos.EnumValueDescriptorProto.decode(r, r.uint32()));
                            break;
                        }
                    case 5: {
                            if (!(m.reservedName && m.reservedName.length))
                                m.reservedName = [];
                            m.reservedName.push(r.string());
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.EnumDescriptorProto} EnumDescriptorProto
             */
            EnumDescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.EnumDescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.EnumDescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d.value) {
                    if (!Array.isArray(d.value))
                        throw TypeError(".perfetto.protos.EnumDescriptorProto.value: array expected");
                    m.value = [];
                    for (var i = 0; i < d.value.length; ++i) {
                        if (typeof d.value[i] !== "object")
                            throw TypeError(".perfetto.protos.EnumDescriptorProto.value: object expected");
                        m.value[i] = $root.perfetto.protos.EnumValueDescriptorProto.fromObject(d.value[i]);
                    }
                }
                if (d.reservedName) {
                    if (!Array.isArray(d.reservedName))
                        throw TypeError(".perfetto.protos.EnumDescriptorProto.reservedName: array expected");
                    m.reservedName = [];
                    for (var i = 0; i < d.reservedName.length; ++i) {
                        m.reservedName[i] = String(d.reservedName[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {perfetto.protos.EnumDescriptorProto} m EnumDescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumDescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.value = [];
                    d.reservedName = [];
                }
                if (o.defaults) {
                    d.name = "";
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m.value && m.value.length) {
                    d.value = [];
                    for (var j = 0; j < m.value.length; ++j) {
                        d.value[j] = $root.perfetto.protos.EnumValueDescriptorProto.toObject(m.value[j], o);
                    }
                }
                if (m.reservedName && m.reservedName.length) {
                    d.reservedName = [];
                    for (var j = 0; j < m.reservedName.length; ++j) {
                        d.reservedName[j] = m.reservedName[j];
                    }
                }
                return d;
            };

            /**
             * Converts this EnumDescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.EnumDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for EnumDescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.EnumDescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            EnumDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.EnumDescriptorProto";
            };

            return EnumDescriptorProto;
        })();

        protos.EnumValueDescriptorProto = (function() {

            /**
             * Properties of an EnumValueDescriptorProto.
             * @memberof perfetto.protos
             * @interface IEnumValueDescriptorProto
             * @property {string|null} [name] EnumValueDescriptorProto name
             * @property {number|null} [number] EnumValueDescriptorProto number
             */

            /**
             * Constructs a new EnumValueDescriptorProto.
             * @memberof perfetto.protos
             * @classdesc Represents an EnumValueDescriptorProto.
             * @implements IEnumValueDescriptorProto
             * @constructor
             * @param {perfetto.protos.IEnumValueDescriptorProto=} [p] Properties to set
             */
            function EnumValueDescriptorProto(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * EnumValueDescriptorProto name.
             * @member {string} name
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @instance
             */
            EnumValueDescriptorProto.prototype.name = "";

            /**
             * EnumValueDescriptorProto number.
             * @member {number} number
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @instance
             */
            EnumValueDescriptorProto.prototype.number = 0;

            /**
             * Creates a new EnumValueDescriptorProto instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {perfetto.protos.IEnumValueDescriptorProto=} [properties] Properties to set
             * @returns {perfetto.protos.EnumValueDescriptorProto} EnumValueDescriptorProto instance
             */
            EnumValueDescriptorProto.create = function create(properties) {
                return new EnumValueDescriptorProto(properties);
            };

            /**
             * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link perfetto.protos.EnumValueDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {perfetto.protos.IEnumValueDescriptorProto} m EnumValueDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumValueDescriptorProto.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.name != null && Object.hasOwnProperty.call(m, "name"))
                    w.uint32(10).string(m.name);
                if (m.number != null && Object.hasOwnProperty.call(m, "number"))
                    w.uint32(16).int32(m.number);
                return w;
            };

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.EnumValueDescriptorProto} EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumValueDescriptorProto.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.EnumValueDescriptorProto();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.name = r.string();
                            break;
                        }
                    case 2: {
                            m.number = r.int32();
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.EnumValueDescriptorProto} EnumValueDescriptorProto
             */
            EnumValueDescriptorProto.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.EnumValueDescriptorProto)
                    return d;
                var m = new $root.perfetto.protos.EnumValueDescriptorProto();
                if (d.name != null) {
                    m.name = String(d.name);
                }
                if (d.number != null) {
                    m.number = d.number | 0;
                }
                return m;
            };

            /**
             * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {perfetto.protos.EnumValueDescriptorProto} m EnumValueDescriptorProto
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumValueDescriptorProto.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.defaults) {
                    d.name = "";
                    d.number = 0;
                }
                if (m.name != null && m.hasOwnProperty("name")) {
                    d.name = m.name;
                }
                if (m.number != null && m.hasOwnProperty("number")) {
                    d.number = m.number;
                }
                return d;
            };

            /**
             * Converts this EnumValueDescriptorProto to JSON.
             * @function toJSON
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumValueDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for EnumValueDescriptorProto
             * @function getTypeUrl
             * @memberof perfetto.protos.EnumValueDescriptorProto
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            EnumValueDescriptorProto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.EnumValueDescriptorProto";
            };

            return EnumValueDescriptorProto;
        })();

        protos.OneofOptions = (function() {

            /**
             * Properties of an OneofOptions.
             * @memberof perfetto.protos
             * @interface IOneofOptions
             */

            /**
             * Constructs a new OneofOptions.
             * @memberof perfetto.protos
             * @classdesc Represents an OneofOptions.
             * @implements IOneofOptions
             * @constructor
             * @param {perfetto.protos.IOneofOptions=} [p] Properties to set
             */
            function OneofOptions(p) {
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * Creates a new OneofOptions instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {perfetto.protos.IOneofOptions=} [properties] Properties to set
             * @returns {perfetto.protos.OneofOptions} OneofOptions instance
             */
            OneofOptions.create = function create(properties) {
                return new OneofOptions(properties);
            };

            /**
             * Encodes the specified OneofOptions message. Does not implicitly {@link perfetto.protos.OneofOptions.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {perfetto.protos.IOneofOptions} m OneofOptions message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofOptions.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                return w;
            };

            /**
             * Decodes an OneofOptions message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.OneofOptions} OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofOptions.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.OneofOptions();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.OneofOptions} OneofOptions
             */
            OneofOptions.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.OneofOptions)
                    return d;
                return new $root.perfetto.protos.OneofOptions();
            };

            /**
             * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {perfetto.protos.OneofOptions} m OneofOptions
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OneofOptions.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this OneofOptions to JSON.
             * @function toJSON
             * @memberof perfetto.protos.OneofOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OneofOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for OneofOptions
             * @function getTypeUrl
             * @memberof perfetto.protos.OneofOptions
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            OneofOptions.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.OneofOptions";
            };

            return OneofOptions;
        })();

        /**
         * MetatraceCategories enum.
         * @name perfetto.protos.MetatraceCategories
         * @enum {number}
         * @property {number} QUERY_TIMELINE=1 QUERY_TIMELINE value
         * @property {number} QUERY_DETAILED=2 QUERY_DETAILED value
         * @property {number} FUNCTION_CALL=4 FUNCTION_CALL value
         * @property {number} DB=8 DB value
         * @property {number} API_TIMELINE=16 API_TIMELINE value
         * @property {number} NONE=0 NONE value
         * @property {number} ALL=31 ALL value
         */
        protos.MetatraceCategories = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[1] = "QUERY_TIMELINE"] = 1;
            values[valuesById[2] = "QUERY_DETAILED"] = 2;
            values[valuesById[4] = "FUNCTION_CALL"] = 4;
            values[valuesById[8] = "DB"] = 8;
            values[valuesById[16] = "API_TIMELINE"] = 16;
            values[valuesById[0] = "NONE"] = 0;
            values[valuesById[31] = "ALL"] = 31;
            return values;
        })();

        protos.PerfettoSqlStructuredQuery = (function() {

            /**
             * Properties of a PerfettoSqlStructuredQuery.
             * @memberof perfetto.protos
             * @interface IPerfettoSqlStructuredQuery
             * @property {string|null} [id] PerfettoSqlStructuredQuery id
             * @property {perfetto.protos.PerfettoSqlStructuredQuery.ITable|null} [table] PerfettoSqlStructuredQuery table
             * @property {perfetto.protos.PerfettoSqlStructuredQuery.ISql|null} [sql] PerfettoSqlStructuredQuery sql
             * @property {perfetto.protos.PerfettoSqlStructuredQuery.ISimpleSlices|null} [simpleSlices] PerfettoSqlStructuredQuery simpleSlices
             * @property {perfetto.protos.IPerfettoSqlStructuredQuery|null} [innerQuery] PerfettoSqlStructuredQuery innerQuery
             * @property {string|null} [innerQueryId] PerfettoSqlStructuredQuery innerQueryId
             * @property {perfetto.protos.PerfettoSqlStructuredQuery.IIntervalIntersect|null} [intervalIntersect] PerfettoSqlStructuredQuery intervalIntersect
             * @property {Array.<perfetto.protos.PerfettoSqlStructuredQuery.IFilter>|null} [filters] PerfettoSqlStructuredQuery filters
             * @property {perfetto.protos.PerfettoSqlStructuredQuery.IGroupBy|null} [groupBy] PerfettoSqlStructuredQuery groupBy
             * @property {Array.<perfetto.protos.PerfettoSqlStructuredQuery.ISelectColumn>|null} [selectColumns] PerfettoSqlStructuredQuery selectColumns
             */

            /**
             * Constructs a new PerfettoSqlStructuredQuery.
             * @memberof perfetto.protos
             * @classdesc Represents a PerfettoSqlStructuredQuery.
             * @implements IPerfettoSqlStructuredQuery
             * @constructor
             * @param {perfetto.protos.IPerfettoSqlStructuredQuery=} [p] Properties to set
             */
            function PerfettoSqlStructuredQuery(p) {
                this.filters = [];
                this.selectColumns = [];
                if (p)
                    for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                        if (p[ks[i]] != null)
                            this[ks[i]] = p[ks[i]];
            }

            /**
             * PerfettoSqlStructuredQuery id.
             * @member {string} id
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.id = "";

            /**
             * PerfettoSqlStructuredQuery table.
             * @member {perfetto.protos.PerfettoSqlStructuredQuery.ITable|null|undefined} table
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.table = null;

            /**
             * PerfettoSqlStructuredQuery sql.
             * @member {perfetto.protos.PerfettoSqlStructuredQuery.ISql|null|undefined} sql
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.sql = null;

            /**
             * PerfettoSqlStructuredQuery simpleSlices.
             * @member {perfetto.protos.PerfettoSqlStructuredQuery.ISimpleSlices|null|undefined} simpleSlices
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.simpleSlices = null;

            /**
             * PerfettoSqlStructuredQuery innerQuery.
             * @member {perfetto.protos.IPerfettoSqlStructuredQuery|null|undefined} innerQuery
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.innerQuery = null;

            /**
             * PerfettoSqlStructuredQuery innerQueryId.
             * @member {string|null|undefined} innerQueryId
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.innerQueryId = null;

            /**
             * PerfettoSqlStructuredQuery intervalIntersect.
             * @member {perfetto.protos.PerfettoSqlStructuredQuery.IIntervalIntersect|null|undefined} intervalIntersect
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.intervalIntersect = null;

            /**
             * PerfettoSqlStructuredQuery filters.
             * @member {Array.<perfetto.protos.PerfettoSqlStructuredQuery.IFilter>} filters
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.filters = $util.emptyArray;

            /**
             * PerfettoSqlStructuredQuery groupBy.
             * @member {perfetto.protos.PerfettoSqlStructuredQuery.IGroupBy|null|undefined} groupBy
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.groupBy = null;

            /**
             * PerfettoSqlStructuredQuery selectColumns.
             * @member {Array.<perfetto.protos.PerfettoSqlStructuredQuery.ISelectColumn>} selectColumns
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            PerfettoSqlStructuredQuery.prototype.selectColumns = $util.emptyArray;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * PerfettoSqlStructuredQuery source.
             * @member {"table"|"sql"|"simpleSlices"|"innerQuery"|"innerQueryId"|"intervalIntersect"|undefined} source
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             */
            Object.defineProperty(PerfettoSqlStructuredQuery.prototype, "source", {
                get: $util.oneOfGetter($oneOfFields = ["table", "sql", "simpleSlices", "innerQuery", "innerQueryId", "intervalIntersect"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new PerfettoSqlStructuredQuery instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {perfetto.protos.IPerfettoSqlStructuredQuery=} [properties] Properties to set
             * @returns {perfetto.protos.PerfettoSqlStructuredQuery} PerfettoSqlStructuredQuery instance
             */
            PerfettoSqlStructuredQuery.create = function create(properties) {
                return new PerfettoSqlStructuredQuery(properties);
            };

            /**
             * Encodes the specified PerfettoSqlStructuredQuery message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {perfetto.protos.IPerfettoSqlStructuredQuery} m PerfettoSqlStructuredQuery message or plain object to encode
             * @param {$protobuf.Writer} [w] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerfettoSqlStructuredQuery.encode = function encode(m, w) {
                if (!w)
                    w = $Writer.create();
                if (m.id != null && Object.hasOwnProperty.call(m, "id"))
                    w.uint32(10).string(m.id);
                if (m.table != null && Object.hasOwnProperty.call(m, "table"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.Table.encode(m.table, w.uint32(18).fork()).ldelim();
                if (m.sql != null && Object.hasOwnProperty.call(m, "sql"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql.encode(m.sql, w.uint32(26).fork()).ldelim();
                if (m.simpleSlices != null && Object.hasOwnProperty.call(m, "simpleSlices"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices.encode(m.simpleSlices, w.uint32(34).fork()).ldelim();
                if (m.innerQuery != null && Object.hasOwnProperty.call(m, "innerQuery"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.encode(m.innerQuery, w.uint32(42).fork()).ldelim();
                if (m.innerQueryId != null && Object.hasOwnProperty.call(m, "innerQueryId"))
                    w.uint32(50).string(m.innerQueryId);
                if (m.intervalIntersect != null && Object.hasOwnProperty.call(m, "intervalIntersect"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.encode(m.intervalIntersect, w.uint32(58).fork()).ldelim();
                if (m.filters != null && m.filters.length) {
                    for (var i = 0; i < m.filters.length; ++i)
                        $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.encode(m.filters[i], w.uint32(66).fork()).ldelim();
                }
                if (m.groupBy != null && Object.hasOwnProperty.call(m, "groupBy"))
                    $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.encode(m.groupBy, w.uint32(74).fork()).ldelim();
                if (m.selectColumns != null && m.selectColumns.length) {
                    for (var i = 0; i < m.selectColumns.length; ++i)
                        $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn.encode(m.selectColumns[i], w.uint32(82).fork()).ldelim();
                }
                return w;
            };

            /**
             * Decodes a PerfettoSqlStructuredQuery message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
             * @param {number} [l] Message length if known beforehand
             * @returns {perfetto.protos.PerfettoSqlStructuredQuery} PerfettoSqlStructuredQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerfettoSqlStructuredQuery.decode = function decode(r, l, e) {
                if (!(r instanceof $Reader))
                    r = $Reader.create(r);
                var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery();
                while (r.pos < c) {
                    var t = r.uint32();
                    if (t === e)
                        break;
                    switch (t >>> 3) {
                    case 1: {
                            m.id = r.string();
                            break;
                        }
                    case 2: {
                            m.table = $root.perfetto.protos.PerfettoSqlStructuredQuery.Table.decode(r, r.uint32());
                            break;
                        }
                    case 3: {
                            m.sql = $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql.decode(r, r.uint32());
                            break;
                        }
                    case 4: {
                            m.simpleSlices = $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices.decode(r, r.uint32());
                            break;
                        }
                    case 5: {
                            m.innerQuery = $root.perfetto.protos.PerfettoSqlStructuredQuery.decode(r, r.uint32());
                            break;
                        }
                    case 6: {
                            m.innerQueryId = r.string();
                            break;
                        }
                    case 7: {
                            m.intervalIntersect = $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.decode(r, r.uint32());
                            break;
                        }
                    case 8: {
                            if (!(m.filters && m.filters.length))
                                m.filters = [];
                            m.filters.push($root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.decode(r, r.uint32()));
                            break;
                        }
                    case 9: {
                            m.groupBy = $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.decode(r, r.uint32());
                            break;
                        }
                    case 10: {
                            if (!(m.selectColumns && m.selectColumns.length))
                                m.selectColumns = [];
                            m.selectColumns.push($root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn.decode(r, r.uint32()));
                            break;
                        }
                    default:
                        r.skipType(t & 7);
                        break;
                    }
                }
                return m;
            };

            /**
             * Creates a PerfettoSqlStructuredQuery message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {Object.<string,*>} d Plain object
             * @returns {perfetto.protos.PerfettoSqlStructuredQuery} PerfettoSqlStructuredQuery
             */
            PerfettoSqlStructuredQuery.fromObject = function fromObject(d) {
                if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery)
                    return d;
                var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery();
                if (d.id != null) {
                    m.id = String(d.id);
                }
                if (d.table != null) {
                    if (typeof d.table !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.table: object expected");
                    m.table = $root.perfetto.protos.PerfettoSqlStructuredQuery.Table.fromObject(d.table);
                }
                if (d.sql != null) {
                    if (typeof d.sql !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.sql: object expected");
                    m.sql = $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql.fromObject(d.sql);
                }
                if (d.simpleSlices != null) {
                    if (typeof d.simpleSlices !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.simpleSlices: object expected");
                    m.simpleSlices = $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices.fromObject(d.simpleSlices);
                }
                if (d.innerQuery != null) {
                    if (typeof d.innerQuery !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.innerQuery: object expected");
                    m.innerQuery = $root.perfetto.protos.PerfettoSqlStructuredQuery.fromObject(d.innerQuery);
                }
                if (d.innerQueryId != null) {
                    m.innerQueryId = String(d.innerQueryId);
                }
                if (d.intervalIntersect != null) {
                    if (typeof d.intervalIntersect !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.intervalIntersect: object expected");
                    m.intervalIntersect = $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.fromObject(d.intervalIntersect);
                }
                if (d.filters) {
                    if (!Array.isArray(d.filters))
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.filters: array expected");
                    m.filters = [];
                    for (var i = 0; i < d.filters.length; ++i) {
                        if (typeof d.filters[i] !== "object")
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.filters: object expected");
                        m.filters[i] = $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.fromObject(d.filters[i]);
                    }
                }
                if (d.groupBy != null) {
                    if (typeof d.groupBy !== "object")
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.groupBy: object expected");
                    m.groupBy = $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.fromObject(d.groupBy);
                }
                if (d.selectColumns) {
                    if (!Array.isArray(d.selectColumns))
                        throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.selectColumns: array expected");
                    m.selectColumns = [];
                    for (var i = 0; i < d.selectColumns.length; ++i) {
                        if (typeof d.selectColumns[i] !== "object")
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.selectColumns: object expected");
                        m.selectColumns[i] = $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn.fromObject(d.selectColumns[i]);
                    }
                }
                return m;
            };

            /**
             * Creates a plain object from a PerfettoSqlStructuredQuery message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {perfetto.protos.PerfettoSqlStructuredQuery} m PerfettoSqlStructuredQuery
             * @param {$protobuf.IConversionOptions} [o] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PerfettoSqlStructuredQuery.toObject = function toObject(m, o) {
                if (!o)
                    o = {};
                var d = {};
                if (o.arrays || o.defaults) {
                    d.filters = [];
                    d.selectColumns = [];
                }
                if (o.defaults) {
                    d.id = "";
                    d.groupBy = null;
                }
                if (m.id != null && m.hasOwnProperty("id")) {
                    d.id = m.id;
                }
                if (m.table != null && m.hasOwnProperty("table")) {
                    d.table = $root.perfetto.protos.PerfettoSqlStructuredQuery.Table.toObject(m.table, o);
                    if (o.oneofs)
                        d.source = "table";
                }
                if (m.sql != null && m.hasOwnProperty("sql")) {
                    d.sql = $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql.toObject(m.sql, o);
                    if (o.oneofs)
                        d.source = "sql";
                }
                if (m.simpleSlices != null && m.hasOwnProperty("simpleSlices")) {
                    d.simpleSlices = $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices.toObject(m.simpleSlices, o);
                    if (o.oneofs)
                        d.source = "simpleSlices";
                }
                if (m.innerQuery != null && m.hasOwnProperty("innerQuery")) {
                    d.innerQuery = $root.perfetto.protos.PerfettoSqlStructuredQuery.toObject(m.innerQuery, o);
                    if (o.oneofs)
                        d.source = "innerQuery";
                }
                if (m.innerQueryId != null && m.hasOwnProperty("innerQueryId")) {
                    d.innerQueryId = m.innerQueryId;
                    if (o.oneofs)
                        d.source = "innerQueryId";
                }
                if (m.intervalIntersect != null && m.hasOwnProperty("intervalIntersect")) {
                    d.intervalIntersect = $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.toObject(m.intervalIntersect, o);
                    if (o.oneofs)
                        d.source = "intervalIntersect";
                }
                if (m.filters && m.filters.length) {
                    d.filters = [];
                    for (var j = 0; j < m.filters.length; ++j) {
                        d.filters[j] = $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.toObject(m.filters[j], o);
                    }
                }
                if (m.groupBy != null && m.hasOwnProperty("groupBy")) {
                    d.groupBy = $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.toObject(m.groupBy, o);
                }
                if (m.selectColumns && m.selectColumns.length) {
                    d.selectColumns = [];
                    for (var j = 0; j < m.selectColumns.length; ++j) {
                        d.selectColumns[j] = $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn.toObject(m.selectColumns[j], o);
                    }
                }
                return d;
            };

            /**
             * Converts this PerfettoSqlStructuredQuery to JSON.
             * @function toJSON
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PerfettoSqlStructuredQuery.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PerfettoSqlStructuredQuery
             * @function getTypeUrl
             * @memberof perfetto.protos.PerfettoSqlStructuredQuery
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PerfettoSqlStructuredQuery.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery";
            };

            PerfettoSqlStructuredQuery.Table = (function() {

                /**
                 * Properties of a Table.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface ITable
                 * @property {string|null} [tableName] Table tableName
                 * @property {string|null} [moduleName] Table moduleName
                 * @property {Array.<string>|null} [columnNames] Table columnNames
                 */

                /**
                 * Constructs a new Table.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a Table.
                 * @implements ITable
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ITable=} [p] Properties to set
                 */
                function Table(p) {
                    this.columnNames = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * Table tableName.
                 * @member {string} tableName
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @instance
                 */
                Table.prototype.tableName = "";

                /**
                 * Table moduleName.
                 * @member {string} moduleName
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @instance
                 */
                Table.prototype.moduleName = "";

                /**
                 * Table columnNames.
                 * @member {Array.<string>} columnNames
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @instance
                 */
                Table.prototype.columnNames = $util.emptyArray;

                /**
                 * Creates a new Table instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ITable=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Table} Table instance
                 */
                Table.create = function create(properties) {
                    return new Table(properties);
                };

                /**
                 * Encodes the specified Table message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.Table.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ITable} m Table message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Table.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.tableName != null && Object.hasOwnProperty.call(m, "tableName"))
                        w.uint32(10).string(m.tableName);
                    if (m.moduleName != null && Object.hasOwnProperty.call(m, "moduleName"))
                        w.uint32(18).string(m.moduleName);
                    if (m.columnNames != null && m.columnNames.length) {
                        for (var i = 0; i < m.columnNames.length; ++i)
                            w.uint32(26).string(m.columnNames[i]);
                    }
                    return w;
                };

                /**
                 * Decodes a Table message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Table} Table
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Table.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Table();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.tableName = r.string();
                                break;
                            }
                        case 2: {
                                m.moduleName = r.string();
                                break;
                            }
                        case 3: {
                                if (!(m.columnNames && m.columnNames.length))
                                    m.columnNames = [];
                                m.columnNames.push(r.string());
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a Table message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Table} Table
                 */
                Table.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.Table)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Table();
                    if (d.tableName != null) {
                        m.tableName = String(d.tableName);
                    }
                    if (d.moduleName != null) {
                        m.moduleName = String(d.moduleName);
                    }
                    if (d.columnNames) {
                        if (!Array.isArray(d.columnNames))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.Table.columnNames: array expected");
                        m.columnNames = [];
                        for (var i = 0; i < d.columnNames.length; ++i) {
                            m.columnNames[i] = String(d.columnNames[i]);
                        }
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a Table message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.Table} m Table
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Table.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.columnNames = [];
                    }
                    if (o.defaults) {
                        d.tableName = "";
                        d.moduleName = "";
                    }
                    if (m.tableName != null && m.hasOwnProperty("tableName")) {
                        d.tableName = m.tableName;
                    }
                    if (m.moduleName != null && m.hasOwnProperty("moduleName")) {
                        d.moduleName = m.moduleName;
                    }
                    if (m.columnNames && m.columnNames.length) {
                        d.columnNames = [];
                        for (var j = 0; j < m.columnNames.length; ++j) {
                            d.columnNames[j] = m.columnNames[j];
                        }
                    }
                    return d;
                };

                /**
                 * Converts this Table to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Table.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Table
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Table
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Table.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.Table";
                };

                return Table;
            })();

            PerfettoSqlStructuredQuery.SimpleSlices = (function() {

                /**
                 * Properties of a SimpleSlices.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface ISimpleSlices
                 * @property {string|null} [sliceNameGlob] SimpleSlices sliceNameGlob
                 * @property {string|null} [threadNameGlob] SimpleSlices threadNameGlob
                 * @property {string|null} [processNameGlob] SimpleSlices processNameGlob
                 * @property {string|null} [trackNameGlob] SimpleSlices trackNameGlob
                 */

                /**
                 * Constructs a new SimpleSlices.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a SimpleSlices.
                 * @implements ISimpleSlices
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISimpleSlices=} [p] Properties to set
                 */
                function SimpleSlices(p) {
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * SimpleSlices sliceNameGlob.
                 * @member {string} sliceNameGlob
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @instance
                 */
                SimpleSlices.prototype.sliceNameGlob = "";

                /**
                 * SimpleSlices threadNameGlob.
                 * @member {string} threadNameGlob
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @instance
                 */
                SimpleSlices.prototype.threadNameGlob = "";

                /**
                 * SimpleSlices processNameGlob.
                 * @member {string} processNameGlob
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @instance
                 */
                SimpleSlices.prototype.processNameGlob = "";

                /**
                 * SimpleSlices trackNameGlob.
                 * @member {string} trackNameGlob
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @instance
                 */
                SimpleSlices.prototype.trackNameGlob = "";

                /**
                 * Creates a new SimpleSlices instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISimpleSlices=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices} SimpleSlices instance
                 */
                SimpleSlices.create = function create(properties) {
                    return new SimpleSlices(properties);
                };

                /**
                 * Encodes the specified SimpleSlices message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISimpleSlices} m SimpleSlices message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                SimpleSlices.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.sliceNameGlob != null && Object.hasOwnProperty.call(m, "sliceNameGlob"))
                        w.uint32(10).string(m.sliceNameGlob);
                    if (m.threadNameGlob != null && Object.hasOwnProperty.call(m, "threadNameGlob"))
                        w.uint32(18).string(m.threadNameGlob);
                    if (m.processNameGlob != null && Object.hasOwnProperty.call(m, "processNameGlob"))
                        w.uint32(26).string(m.processNameGlob);
                    if (m.trackNameGlob != null && Object.hasOwnProperty.call(m, "trackNameGlob"))
                        w.uint32(34).string(m.trackNameGlob);
                    return w;
                };

                /**
                 * Decodes a SimpleSlices message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices} SimpleSlices
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                SimpleSlices.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.sliceNameGlob = r.string();
                                break;
                            }
                        case 2: {
                                m.threadNameGlob = r.string();
                                break;
                            }
                        case 3: {
                                m.processNameGlob = r.string();
                                break;
                            }
                        case 4: {
                                m.trackNameGlob = r.string();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a SimpleSlices message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices} SimpleSlices
                 */
                SimpleSlices.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices();
                    if (d.sliceNameGlob != null) {
                        m.sliceNameGlob = String(d.sliceNameGlob);
                    }
                    if (d.threadNameGlob != null) {
                        m.threadNameGlob = String(d.threadNameGlob);
                    }
                    if (d.processNameGlob != null) {
                        m.processNameGlob = String(d.processNameGlob);
                    }
                    if (d.trackNameGlob != null) {
                        m.trackNameGlob = String(d.trackNameGlob);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a SimpleSlices message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices} m SimpleSlices
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                SimpleSlices.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.defaults) {
                        d.sliceNameGlob = "";
                        d.threadNameGlob = "";
                        d.processNameGlob = "";
                        d.trackNameGlob = "";
                    }
                    if (m.sliceNameGlob != null && m.hasOwnProperty("sliceNameGlob")) {
                        d.sliceNameGlob = m.sliceNameGlob;
                    }
                    if (m.threadNameGlob != null && m.hasOwnProperty("threadNameGlob")) {
                        d.threadNameGlob = m.threadNameGlob;
                    }
                    if (m.processNameGlob != null && m.hasOwnProperty("processNameGlob")) {
                        d.processNameGlob = m.processNameGlob;
                    }
                    if (m.trackNameGlob != null && m.hasOwnProperty("trackNameGlob")) {
                        d.trackNameGlob = m.trackNameGlob;
                    }
                    return d;
                };

                /**
                 * Converts this SimpleSlices to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                SimpleSlices.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for SimpleSlices
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                SimpleSlices.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.SimpleSlices";
                };

                return SimpleSlices;
            })();

            PerfettoSqlStructuredQuery.Sql = (function() {

                /**
                 * Properties of a Sql.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface ISql
                 * @property {string|null} [sql] Sql sql
                 * @property {Array.<string>|null} [columnNames] Sql columnNames
                 * @property {string|null} [preamble] Sql preamble
                 */

                /**
                 * Constructs a new Sql.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a Sql.
                 * @implements ISql
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISql=} [p] Properties to set
                 */
                function Sql(p) {
                    this.columnNames = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * Sql sql.
                 * @member {string} sql
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @instance
                 */
                Sql.prototype.sql = "";

                /**
                 * Sql columnNames.
                 * @member {Array.<string>} columnNames
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @instance
                 */
                Sql.prototype.columnNames = $util.emptyArray;

                /**
                 * Sql preamble.
                 * @member {string} preamble
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @instance
                 */
                Sql.prototype.preamble = "";

                /**
                 * Creates a new Sql instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISql=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Sql} Sql instance
                 */
                Sql.create = function create(properties) {
                    return new Sql(properties);
                };

                /**
                 * Encodes the specified Sql message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.Sql.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISql} m Sql message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Sql.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.sql != null && Object.hasOwnProperty.call(m, "sql"))
                        w.uint32(10).string(m.sql);
                    if (m.columnNames != null && m.columnNames.length) {
                        for (var i = 0; i < m.columnNames.length; ++i)
                            w.uint32(18).string(m.columnNames[i]);
                    }
                    if (m.preamble != null && Object.hasOwnProperty.call(m, "preamble"))
                        w.uint32(26).string(m.preamble);
                    return w;
                };

                /**
                 * Decodes a Sql message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Sql} Sql
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Sql.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.sql = r.string();
                                break;
                            }
                        case 2: {
                                if (!(m.columnNames && m.columnNames.length))
                                    m.columnNames = [];
                                m.columnNames.push(r.string());
                                break;
                            }
                        case 3: {
                                m.preamble = r.string();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a Sql message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Sql} Sql
                 */
                Sql.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Sql();
                    if (d.sql != null) {
                        m.sql = String(d.sql);
                    }
                    if (d.columnNames) {
                        if (!Array.isArray(d.columnNames))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.Sql.columnNames: array expected");
                        m.columnNames = [];
                        for (var i = 0; i < d.columnNames.length; ++i) {
                            m.columnNames[i] = String(d.columnNames[i]);
                        }
                    }
                    if (d.preamble != null) {
                        m.preamble = String(d.preamble);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a Sql message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.Sql} m Sql
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Sql.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.columnNames = [];
                    }
                    if (o.defaults) {
                        d.sql = "";
                        d.preamble = "";
                    }
                    if (m.sql != null && m.hasOwnProperty("sql")) {
                        d.sql = m.sql;
                    }
                    if (m.columnNames && m.columnNames.length) {
                        d.columnNames = [];
                        for (var j = 0; j < m.columnNames.length; ++j) {
                            d.columnNames[j] = m.columnNames[j];
                        }
                    }
                    if (m.preamble != null && m.hasOwnProperty("preamble")) {
                        d.preamble = m.preamble;
                    }
                    return d;
                };

                /**
                 * Converts this Sql to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Sql.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Sql
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Sql
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Sql.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.Sql";
                };

                return Sql;
            })();

            PerfettoSqlStructuredQuery.IntervalIntersect = (function() {

                /**
                 * Properties of an IntervalIntersect.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface IIntervalIntersect
                 * @property {perfetto.protos.IPerfettoSqlStructuredQuery|null} [base] IntervalIntersect base
                 * @property {Array.<perfetto.protos.IPerfettoSqlStructuredQuery>|null} [intervalIntersect] IntervalIntersect intervalIntersect
                 */

                /**
                 * Constructs a new IntervalIntersect.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents an IntervalIntersect.
                 * @implements IIntervalIntersect
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IIntervalIntersect=} [p] Properties to set
                 */
                function IntervalIntersect(p) {
                    this.intervalIntersect = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * IntervalIntersect base.
                 * @member {perfetto.protos.IPerfettoSqlStructuredQuery|null|undefined} base
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @instance
                 */
                IntervalIntersect.prototype.base = null;

                /**
                 * IntervalIntersect intervalIntersect.
                 * @member {Array.<perfetto.protos.IPerfettoSqlStructuredQuery>} intervalIntersect
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @instance
                 */
                IntervalIntersect.prototype.intervalIntersect = $util.emptyArray;

                /**
                 * Creates a new IntervalIntersect instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IIntervalIntersect=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect} IntervalIntersect instance
                 */
                IntervalIntersect.create = function create(properties) {
                    return new IntervalIntersect(properties);
                };

                /**
                 * Encodes the specified IntervalIntersect message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IIntervalIntersect} m IntervalIntersect message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                IntervalIntersect.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.base != null && Object.hasOwnProperty.call(m, "base"))
                        $root.perfetto.protos.PerfettoSqlStructuredQuery.encode(m.base, w.uint32(10).fork()).ldelim();
                    if (m.intervalIntersect != null && m.intervalIntersect.length) {
                        for (var i = 0; i < m.intervalIntersect.length; ++i)
                            $root.perfetto.protos.PerfettoSqlStructuredQuery.encode(m.intervalIntersect[i], w.uint32(18).fork()).ldelim();
                    }
                    return w;
                };

                /**
                 * Decodes an IntervalIntersect message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect} IntervalIntersect
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                IntervalIntersect.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.base = $root.perfetto.protos.PerfettoSqlStructuredQuery.decode(r, r.uint32());
                                break;
                            }
                        case 2: {
                                if (!(m.intervalIntersect && m.intervalIntersect.length))
                                    m.intervalIntersect = [];
                                m.intervalIntersect.push($root.perfetto.protos.PerfettoSqlStructuredQuery.decode(r, r.uint32()));
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates an IntervalIntersect message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect} IntervalIntersect
                 */
                IntervalIntersect.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect();
                    if (d.base != null) {
                        if (typeof d.base !== "object")
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.base: object expected");
                        m.base = $root.perfetto.protos.PerfettoSqlStructuredQuery.fromObject(d.base);
                    }
                    if (d.intervalIntersect) {
                        if (!Array.isArray(d.intervalIntersect))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.intervalIntersect: array expected");
                        m.intervalIntersect = [];
                        for (var i = 0; i < d.intervalIntersect.length; ++i) {
                            if (typeof d.intervalIntersect[i] !== "object")
                                throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect.intervalIntersect: object expected");
                            m.intervalIntersect[i] = $root.perfetto.protos.PerfettoSqlStructuredQuery.fromObject(d.intervalIntersect[i]);
                        }
                    }
                    return m;
                };

                /**
                 * Creates a plain object from an IntervalIntersect message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect} m IntervalIntersect
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                IntervalIntersect.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.intervalIntersect = [];
                    }
                    if (o.defaults) {
                        d.base = null;
                    }
                    if (m.base != null && m.hasOwnProperty("base")) {
                        d.base = $root.perfetto.protos.PerfettoSqlStructuredQuery.toObject(m.base, o);
                    }
                    if (m.intervalIntersect && m.intervalIntersect.length) {
                        d.intervalIntersect = [];
                        for (var j = 0; j < m.intervalIntersect.length; ++j) {
                            d.intervalIntersect[j] = $root.perfetto.protos.PerfettoSqlStructuredQuery.toObject(m.intervalIntersect[j], o);
                        }
                    }
                    return d;
                };

                /**
                 * Converts this IntervalIntersect to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                IntervalIntersect.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for IntervalIntersect
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                IntervalIntersect.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.IntervalIntersect";
                };

                return IntervalIntersect;
            })();

            PerfettoSqlStructuredQuery.Filter = (function() {

                /**
                 * Properties of a Filter.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface IFilter
                 * @property {string|null} [columnName] Filter columnName
                 * @property {perfetto.protos.PerfettoSqlStructuredQuery.Filter.Operator|null} [op] Filter op
                 * @property {Array.<string>|null} [stringRhs] Filter stringRhs
                 * @property {Array.<number>|null} [doubleRhs] Filter doubleRhs
                 * @property {Array.<number>|null} [int64Rhs] Filter int64Rhs
                 */

                /**
                 * Constructs a new Filter.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a Filter.
                 * @implements IFilter
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IFilter=} [p] Properties to set
                 */
                function Filter(p) {
                    this.stringRhs = [];
                    this.doubleRhs = [];
                    this.int64Rhs = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * Filter columnName.
                 * @member {string} columnName
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 */
                Filter.prototype.columnName = "";

                /**
                 * Filter op.
                 * @member {perfetto.protos.PerfettoSqlStructuredQuery.Filter.Operator} op
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 */
                Filter.prototype.op = 0;

                /**
                 * Filter stringRhs.
                 * @member {Array.<string>} stringRhs
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 */
                Filter.prototype.stringRhs = $util.emptyArray;

                /**
                 * Filter doubleRhs.
                 * @member {Array.<number>} doubleRhs
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 */
                Filter.prototype.doubleRhs = $util.emptyArray;

                /**
                 * Filter int64Rhs.
                 * @member {Array.<number>} int64Rhs
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 */
                Filter.prototype.int64Rhs = $util.emptyArray;

                /**
                 * Creates a new Filter instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IFilter=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Filter} Filter instance
                 */
                Filter.create = function create(properties) {
                    return new Filter(properties);
                };

                /**
                 * Encodes the specified Filter message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.Filter.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IFilter} m Filter message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Filter.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.columnName != null && Object.hasOwnProperty.call(m, "columnName"))
                        w.uint32(10).string(m.columnName);
                    if (m.op != null && Object.hasOwnProperty.call(m, "op"))
                        w.uint32(16).int32(m.op);
                    if (m.stringRhs != null && m.stringRhs.length) {
                        for (var i = 0; i < m.stringRhs.length; ++i)
                            w.uint32(26).string(m.stringRhs[i]);
                    }
                    if (m.doubleRhs != null && m.doubleRhs.length) {
                        for (var i = 0; i < m.doubleRhs.length; ++i)
                            w.uint32(33).double(m.doubleRhs[i]);
                    }
                    if (m.int64Rhs != null && m.int64Rhs.length) {
                        for (var i = 0; i < m.int64Rhs.length; ++i)
                            w.uint32(40).int64(m.int64Rhs[i]);
                    }
                    return w;
                };

                /**
                 * Decodes a Filter message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Filter} Filter
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Filter.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.columnName = r.string();
                                break;
                            }
                        case 2: {
                                m.op = r.int32();
                                break;
                            }
                        case 3: {
                                if (!(m.stringRhs && m.stringRhs.length))
                                    m.stringRhs = [];
                                m.stringRhs.push(r.string());
                                break;
                            }
                        case 4: {
                                if (!(m.doubleRhs && m.doubleRhs.length))
                                    m.doubleRhs = [];
                                if ((t & 7) === 2) {
                                    var c2 = r.uint32() + r.pos;
                                    while (r.pos < c2)
                                        m.doubleRhs.push(r.double());
                                } else
                                    m.doubleRhs.push(r.double());
                                break;
                            }
                        case 5: {
                                if (!(m.int64Rhs && m.int64Rhs.length))
                                    m.int64Rhs = [];
                                if ((t & 7) === 2) {
                                    var c2 = r.uint32() + r.pos;
                                    while (r.pos < c2)
                                        m.int64Rhs.push(r.int64());
                                } else
                                    m.int64Rhs.push(r.int64());
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a Filter message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.Filter} Filter
                 */
                Filter.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter();
                    if (d.columnName != null) {
                        m.columnName = String(d.columnName);
                    }
                    switch (d.op) {
                    default:
                        if (typeof d.op === "number") {
                            m.op = d.op;
                            break;
                        }
                        break;
                    case "UNKNOWN":
                    case 0:
                        m.op = 0;
                        break;
                    case "EQUAL":
                    case 1:
                        m.op = 1;
                        break;
                    case "NOT_EQUAL":
                    case 2:
                        m.op = 2;
                        break;
                    case "LESS_THAN":
                    case 3:
                        m.op = 3;
                        break;
                    case "LESS_THAN_EQUAL":
                    case 4:
                        m.op = 4;
                        break;
                    case "GREATER_THAN":
                    case 5:
                        m.op = 5;
                        break;
                    case "GREATER_THAN_EQUAL":
                    case 6:
                        m.op = 6;
                        break;
                    case "IS_NULL":
                    case 8:
                        m.op = 8;
                        break;
                    case "IS_NOT_NULL":
                    case 9:
                        m.op = 9;
                        break;
                    case "GLOB":
                    case 7:
                        m.op = 7;
                        break;
                    }
                    if (d.stringRhs) {
                        if (!Array.isArray(d.stringRhs))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.Filter.stringRhs: array expected");
                        m.stringRhs = [];
                        for (var i = 0; i < d.stringRhs.length; ++i) {
                            m.stringRhs[i] = String(d.stringRhs[i]);
                        }
                    }
                    if (d.doubleRhs) {
                        if (!Array.isArray(d.doubleRhs))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.Filter.doubleRhs: array expected");
                        m.doubleRhs = [];
                        for (var i = 0; i < d.doubleRhs.length; ++i) {
                            m.doubleRhs[i] = Number(d.doubleRhs[i]);
                        }
                    }
                    if (d.int64Rhs) {
                        if (!Array.isArray(d.int64Rhs))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.Filter.int64Rhs: array expected");
                        m.int64Rhs = [];
                        for (var i = 0; i < d.int64Rhs.length; ++i) {
                            if ($util.Long)
                                (m.int64Rhs[i] = $util.Long.fromValue(d.int64Rhs[i])).unsigned = false;
                            else if (typeof d.int64Rhs[i] === "string")
                                m.int64Rhs[i] = parseInt(d.int64Rhs[i], 10);
                            else if (typeof d.int64Rhs[i] === "number")
                                m.int64Rhs[i] = d.int64Rhs[i];
                            else if (typeof d.int64Rhs[i] === "object")
                                m.int64Rhs[i] = new $util.LongBits(d.int64Rhs[i].low >>> 0, d.int64Rhs[i].high >>> 0).toNumber();
                        }
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a Filter message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.Filter} m Filter
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Filter.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.stringRhs = [];
                        d.doubleRhs = [];
                        d.int64Rhs = [];
                    }
                    if (o.defaults) {
                        d.columnName = "";
                        d.op = o.enums === String ? "UNKNOWN" : 0;
                    }
                    if (m.columnName != null && m.hasOwnProperty("columnName")) {
                        d.columnName = m.columnName;
                    }
                    if (m.op != null && m.hasOwnProperty("op")) {
                        d.op = o.enums === String ? $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.Operator[m.op] === undefined ? m.op : $root.perfetto.protos.PerfettoSqlStructuredQuery.Filter.Operator[m.op] : m.op;
                    }
                    if (m.stringRhs && m.stringRhs.length) {
                        d.stringRhs = [];
                        for (var j = 0; j < m.stringRhs.length; ++j) {
                            d.stringRhs[j] = m.stringRhs[j];
                        }
                    }
                    if (m.doubleRhs && m.doubleRhs.length) {
                        d.doubleRhs = [];
                        for (var j = 0; j < m.doubleRhs.length; ++j) {
                            d.doubleRhs[j] = o.json && !isFinite(m.doubleRhs[j]) ? String(m.doubleRhs[j]) : m.doubleRhs[j];
                        }
                    }
                    if (m.int64Rhs && m.int64Rhs.length) {
                        d.int64Rhs = [];
                        for (var j = 0; j < m.int64Rhs.length; ++j) {
                            if (typeof m.int64Rhs[j] === "number")
                                d.int64Rhs[j] = o.longs === String ? String(m.int64Rhs[j]) : m.int64Rhs[j];
                            else
                                d.int64Rhs[j] = o.longs === String ? $util.Long.prototype.toString.call(m.int64Rhs[j]) : o.longs === Number ? new $util.LongBits(m.int64Rhs[j].low >>> 0, m.int64Rhs[j].high >>> 0).toNumber() : m.int64Rhs[j];
                        }
                    }
                    return d;
                };

                /**
                 * Converts this Filter to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Filter.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for Filter
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.Filter
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Filter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.Filter";
                };

                /**
                 * Operator enum.
                 * @name perfetto.protos.PerfettoSqlStructuredQuery.Filter.Operator
                 * @enum {number}
                 * @property {number} UNKNOWN=0 UNKNOWN value
                 * @property {number} EQUAL=1 EQUAL value
                 * @property {number} NOT_EQUAL=2 NOT_EQUAL value
                 * @property {number} LESS_THAN=3 LESS_THAN value
                 * @property {number} LESS_THAN_EQUAL=4 LESS_THAN_EQUAL value
                 * @property {number} GREATER_THAN=5 GREATER_THAN value
                 * @property {number} GREATER_THAN_EQUAL=6 GREATER_THAN_EQUAL value
                 * @property {number} IS_NULL=8 IS_NULL value
                 * @property {number} IS_NOT_NULL=9 IS_NOT_NULL value
                 * @property {number} GLOB=7 GLOB value
                 */
                Filter.Operator = (function() {
                    var valuesById = {}, values = Object.create(valuesById);
                    values[valuesById[0] = "UNKNOWN"] = 0;
                    values[valuesById[1] = "EQUAL"] = 1;
                    values[valuesById[2] = "NOT_EQUAL"] = 2;
                    values[valuesById[3] = "LESS_THAN"] = 3;
                    values[valuesById[4] = "LESS_THAN_EQUAL"] = 4;
                    values[valuesById[5] = "GREATER_THAN"] = 5;
                    values[valuesById[6] = "GREATER_THAN_EQUAL"] = 6;
                    values[valuesById[8] = "IS_NULL"] = 8;
                    values[valuesById[9] = "IS_NOT_NULL"] = 9;
                    values[valuesById[7] = "GLOB"] = 7;
                    return values;
                })();

                return Filter;
            })();

            PerfettoSqlStructuredQuery.GroupBy = (function() {

                /**
                 * Properties of a GroupBy.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface IGroupBy
                 * @property {Array.<string>|null} [columnNames] GroupBy columnNames
                 * @property {Array.<perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.IAggregate>|null} [aggregates] GroupBy aggregates
                 */

                /**
                 * Constructs a new GroupBy.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a GroupBy.
                 * @implements IGroupBy
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IGroupBy=} [p] Properties to set
                 */
                function GroupBy(p) {
                    this.columnNames = [];
                    this.aggregates = [];
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * GroupBy columnNames.
                 * @member {Array.<string>} columnNames
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @instance
                 */
                GroupBy.prototype.columnNames = $util.emptyArray;

                /**
                 * GroupBy aggregates.
                 * @member {Array.<perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.IAggregate>} aggregates
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @instance
                 */
                GroupBy.prototype.aggregates = $util.emptyArray;

                /**
                 * Creates a new GroupBy instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IGroupBy=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy} GroupBy instance
                 */
                GroupBy.create = function create(properties) {
                    return new GroupBy(properties);
                };

                /**
                 * Encodes the specified GroupBy message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.IGroupBy} m GroupBy message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                GroupBy.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.columnNames != null && m.columnNames.length) {
                        for (var i = 0; i < m.columnNames.length; ++i)
                            w.uint32(10).string(m.columnNames[i]);
                    }
                    if (m.aggregates != null && m.aggregates.length) {
                        for (var i = 0; i < m.aggregates.length; ++i)
                            $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.encode(m.aggregates[i], w.uint32(18).fork()).ldelim();
                    }
                    return w;
                };

                /**
                 * Decodes a GroupBy message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy} GroupBy
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                GroupBy.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                if (!(m.columnNames && m.columnNames.length))
                                    m.columnNames = [];
                                m.columnNames.push(r.string());
                                break;
                            }
                        case 2: {
                                if (!(m.aggregates && m.aggregates.length))
                                    m.aggregates = [];
                                m.aggregates.push($root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.decode(r, r.uint32()));
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a GroupBy message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy} GroupBy
                 */
                GroupBy.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy();
                    if (d.columnNames) {
                        if (!Array.isArray(d.columnNames))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.columnNames: array expected");
                        m.columnNames = [];
                        for (var i = 0; i < d.columnNames.length; ++i) {
                            m.columnNames[i] = String(d.columnNames[i]);
                        }
                    }
                    if (d.aggregates) {
                        if (!Array.isArray(d.aggregates))
                            throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.aggregates: array expected");
                        m.aggregates = [];
                        for (var i = 0; i < d.aggregates.length; ++i) {
                            if (typeof d.aggregates[i] !== "object")
                                throw TypeError(".perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.aggregates: object expected");
                            m.aggregates[i] = $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.fromObject(d.aggregates[i]);
                        }
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a GroupBy message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy} m GroupBy
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                GroupBy.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.arrays || o.defaults) {
                        d.columnNames = [];
                        d.aggregates = [];
                    }
                    if (m.columnNames && m.columnNames.length) {
                        d.columnNames = [];
                        for (var j = 0; j < m.columnNames.length; ++j) {
                            d.columnNames[j] = m.columnNames[j];
                        }
                    }
                    if (m.aggregates && m.aggregates.length) {
                        d.aggregates = [];
                        for (var j = 0; j < m.aggregates.length; ++j) {
                            d.aggregates[j] = $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.toObject(m.aggregates[j], o);
                        }
                    }
                    return d;
                };

                /**
                 * Converts this GroupBy to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                GroupBy.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for GroupBy
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                GroupBy.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.GroupBy";
                };

                GroupBy.Aggregate = (function() {

                    /**
                     * Properties of an Aggregate.
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                     * @interface IAggregate
                     * @property {string|null} [columnName] Aggregate columnName
                     * @property {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.Op|null} [op] Aggregate op
                     * @property {string|null} [resultColumnName] Aggregate resultColumnName
                     */

                    /**
                     * Constructs a new Aggregate.
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy
                     * @classdesc Represents an Aggregate.
                     * @implements IAggregate
                     * @constructor
                     * @param {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.IAggregate=} [p] Properties to set
                     */
                    function Aggregate(p) {
                        if (p)
                            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                                if (p[ks[i]] != null)
                                    this[ks[i]] = p[ks[i]];
                    }

                    /**
                     * Aggregate columnName.
                     * @member {string} columnName
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @instance
                     */
                    Aggregate.prototype.columnName = "";

                    /**
                     * Aggregate op.
                     * @member {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.Op} op
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @instance
                     */
                    Aggregate.prototype.op = 0;

                    /**
                     * Aggregate resultColumnName.
                     * @member {string} resultColumnName
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @instance
                     */
                    Aggregate.prototype.resultColumnName = "";

                    /**
                     * Creates a new Aggregate instance using the specified properties.
                     * @function create
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.IAggregate=} [properties] Properties to set
                     * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate} Aggregate instance
                     */
                    Aggregate.create = function create(properties) {
                        return new Aggregate(properties);
                    };

                    /**
                     * Encodes the specified Aggregate message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.verify|verify} messages.
                     * @function encode
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.IAggregate} m Aggregate message or plain object to encode
                     * @param {$protobuf.Writer} [w] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Aggregate.encode = function encode(m, w) {
                        if (!w)
                            w = $Writer.create();
                        if (m.columnName != null && Object.hasOwnProperty.call(m, "columnName"))
                            w.uint32(10).string(m.columnName);
                        if (m.op != null && Object.hasOwnProperty.call(m, "op"))
                            w.uint32(16).int32(m.op);
                        if (m.resultColumnName != null && Object.hasOwnProperty.call(m, "resultColumnName"))
                            w.uint32(26).string(m.resultColumnName);
                        return w;
                    };

                    /**
                     * Decodes an Aggregate message from the specified reader or buffer.
                     * @function decode
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                     * @param {number} [l] Message length if known beforehand
                     * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate} Aggregate
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Aggregate.decode = function decode(r, l, e) {
                        if (!(r instanceof $Reader))
                            r = $Reader.create(r);
                        var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate();
                        while (r.pos < c) {
                            var t = r.uint32();
                            if (t === e)
                                break;
                            switch (t >>> 3) {
                            case 1: {
                                    m.columnName = r.string();
                                    break;
                                }
                            case 2: {
                                    m.op = r.int32();
                                    break;
                                }
                            case 3: {
                                    m.resultColumnName = r.string();
                                    break;
                                }
                            default:
                                r.skipType(t & 7);
                                break;
                            }
                        }
                        return m;
                    };

                    /**
                     * Creates an Aggregate message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {Object.<string,*>} d Plain object
                     * @returns {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate} Aggregate
                     */
                    Aggregate.fromObject = function fromObject(d) {
                        if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate)
                            return d;
                        var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate();
                        if (d.columnName != null) {
                            m.columnName = String(d.columnName);
                        }
                        switch (d.op) {
                        default:
                            if (typeof d.op === "number") {
                                m.op = d.op;
                                break;
                            }
                            break;
                        case "UNSPECIFIED":
                        case 0:
                            m.op = 0;
                            break;
                        case "COUNT":
                        case 1:
                            m.op = 1;
                            break;
                        case "SUM":
                        case 2:
                            m.op = 2;
                            break;
                        case "MIN":
                        case 3:
                            m.op = 3;
                            break;
                        case "MAX":
                        case 4:
                            m.op = 4;
                            break;
                        case "MEAN":
                        case 5:
                            m.op = 5;
                            break;
                        case "MEDIAN":
                        case 6:
                            m.op = 6;
                            break;
                        case "DURATION_WEIGHTED_MEAN":
                        case 7:
                            m.op = 7;
                            break;
                        }
                        if (d.resultColumnName != null) {
                            m.resultColumnName = String(d.resultColumnName);
                        }
                        return m;
                    };

                    /**
                     * Creates a plain object from an Aggregate message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate} m Aggregate
                     * @param {$protobuf.IConversionOptions} [o] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Aggregate.toObject = function toObject(m, o) {
                        if (!o)
                            o = {};
                        var d = {};
                        if (o.defaults) {
                            d.columnName = "";
                            d.op = o.enums === String ? "UNSPECIFIED" : 0;
                            d.resultColumnName = "";
                        }
                        if (m.columnName != null && m.hasOwnProperty("columnName")) {
                            d.columnName = m.columnName;
                        }
                        if (m.op != null && m.hasOwnProperty("op")) {
                            d.op = o.enums === String ? $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.Op[m.op] === undefined ? m.op : $root.perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.Op[m.op] : m.op;
                        }
                        if (m.resultColumnName != null && m.hasOwnProperty("resultColumnName")) {
                            d.resultColumnName = m.resultColumnName;
                        }
                        return d;
                    };

                    /**
                     * Converts this Aggregate to JSON.
                     * @function toJSON
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Aggregate.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };

                    /**
                     * Gets the default type url for Aggregate
                     * @function getTypeUrl
                     * @memberof perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Aggregate.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate";
                    };

                    /**
                     * Op enum.
                     * @name perfetto.protos.PerfettoSqlStructuredQuery.GroupBy.Aggregate.Op
                     * @enum {number}
                     * @property {number} UNSPECIFIED=0 UNSPECIFIED value
                     * @property {number} COUNT=1 COUNT value
                     * @property {number} SUM=2 SUM value
                     * @property {number} MIN=3 MIN value
                     * @property {number} MAX=4 MAX value
                     * @property {number} MEAN=5 MEAN value
                     * @property {number} MEDIAN=6 MEDIAN value
                     * @property {number} DURATION_WEIGHTED_MEAN=7 DURATION_WEIGHTED_MEAN value
                     */
                    Aggregate.Op = (function() {
                        var valuesById = {}, values = Object.create(valuesById);
                        values[valuesById[0] = "UNSPECIFIED"] = 0;
                        values[valuesById[1] = "COUNT"] = 1;
                        values[valuesById[2] = "SUM"] = 2;
                        values[valuesById[3] = "MIN"] = 3;
                        values[valuesById[4] = "MAX"] = 4;
                        values[valuesById[5] = "MEAN"] = 5;
                        values[valuesById[6] = "MEDIAN"] = 6;
                        values[valuesById[7] = "DURATION_WEIGHTED_MEAN"] = 7;
                        return values;
                    })();

                    return Aggregate;
                })();

                return GroupBy;
            })();

            PerfettoSqlStructuredQuery.SelectColumn = (function() {

                /**
                 * Properties of a SelectColumn.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @interface ISelectColumn
                 * @property {string|null} [columnName] SelectColumn columnName
                 * @property {string|null} [alias] SelectColumn alias
                 */

                /**
                 * Constructs a new SelectColumn.
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery
                 * @classdesc Represents a SelectColumn.
                 * @implements ISelectColumn
                 * @constructor
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISelectColumn=} [p] Properties to set
                 */
                function SelectColumn(p) {
                    if (p)
                        for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)
                            if (p[ks[i]] != null)
                                this[ks[i]] = p[ks[i]];
                }

                /**
                 * SelectColumn columnName.
                 * @member {string} columnName
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @instance
                 */
                SelectColumn.prototype.columnName = "";

                /**
                 * SelectColumn alias.
                 * @member {string} alias
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @instance
                 */
                SelectColumn.prototype.alias = "";

                /**
                 * Creates a new SelectColumn instance using the specified properties.
                 * @function create
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISelectColumn=} [properties] Properties to set
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn} SelectColumn instance
                 */
                SelectColumn.create = function create(properties) {
                    return new SelectColumn(properties);
                };

                /**
                 * Encodes the specified SelectColumn message. Does not implicitly {@link perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn.verify|verify} messages.
                 * @function encode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.ISelectColumn} m SelectColumn message or plain object to encode
                 * @param {$protobuf.Writer} [w] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                SelectColumn.encode = function encode(m, w) {
                    if (!w)
                        w = $Writer.create();
                    if (m.columnName != null && Object.hasOwnProperty.call(m, "columnName"))
                        w.uint32(10).string(m.columnName);
                    if (m.alias != null && Object.hasOwnProperty.call(m, "alias"))
                        w.uint32(18).string(m.alias);
                    return w;
                };

                /**
                 * Decodes a SelectColumn message from the specified reader or buffer.
                 * @function decode
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} r Reader or buffer to decode from
                 * @param {number} [l] Message length if known beforehand
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn} SelectColumn
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                SelectColumn.decode = function decode(r, l, e) {
                    if (!(r instanceof $Reader))
                        r = $Reader.create(r);
                    var c = l === undefined ? r.len : r.pos + l, m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn();
                    while (r.pos < c) {
                        var t = r.uint32();
                        if (t === e)
                            break;
                        switch (t >>> 3) {
                        case 1: {
                                m.columnName = r.string();
                                break;
                            }
                        case 2: {
                                m.alias = r.string();
                                break;
                            }
                        default:
                            r.skipType(t & 7);
                            break;
                        }
                    }
                    return m;
                };

                /**
                 * Creates a SelectColumn message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {Object.<string,*>} d Plain object
                 * @returns {perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn} SelectColumn
                 */
                SelectColumn.fromObject = function fromObject(d) {
                    if (d instanceof $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn)
                        return d;
                    var m = new $root.perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn();
                    if (d.columnName != null) {
                        m.columnName = String(d.columnName);
                    }
                    if (d.alias != null) {
                        m.alias = String(d.alias);
                    }
                    return m;
                };

                /**
                 * Creates a plain object from a SelectColumn message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn} m SelectColumn
                 * @param {$protobuf.IConversionOptions} [o] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                SelectColumn.toObject = function toObject(m, o) {
                    if (!o)
                        o = {};
                    var d = {};
                    if (o.defaults) {
                        d.columnName = "";
                        d.alias = "";
                    }
                    if (m.columnName != null && m.hasOwnProperty("columnName")) {
                        d.columnName = m.columnName;
                    }
                    if (m.alias != null && m.hasOwnProperty("alias")) {
                        d.alias = m.alias;
                    }
                    return d;
                };

                /**
                 * Converts this SelectColumn to JSON.
                 * @function toJSON
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                SelectColumn.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                /**
                 * Gets the default type url for SelectColumn
                 * @function getTypeUrl
                 * @memberof perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                SelectColumn.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/perfetto.protos.PerfettoSqlStructuredQuery.SelectColumn";
                };

                return SelectColumn;
            })();

            return PerfettoSqlStructuredQuery;
        })();

        return protos;
    })();

    return perfetto;
})();

module.exports = $root;


/***/ },

/***/ 185
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueryResultIterator = exports.Row = exports.PerfettoException = void 0;
const protobufjs_1 = __webpack_require__(939);
// Values of these constants correspond to the QueryResponse message at
// protos/perfetto/trace_processor/trace_processor.proto
const QUERY_CELL_NULL_FIELD_ID = 1;
const QUERY_CELL_VARINT_FIELD_ID = 2;
const QUERY_CELL_TYPE_COUNT = 6;
/**
 * Extract strings from string_cells field, handling both string and bytes input.
 * Corresponds to Python's _extract_strings function.
 */
function extractStrings(x) {
    let input;
    if (x instanceof Uint8Array) {
        // Decode bytes to string, ignoring invalid UTF-8 characters
        const decoder = new TextDecoder('utf-8', { fatal: false });
        input = decoder.decode(x);
    }
    else {
        input = x;
    }
    const res = input.split('\0');
    if (res.length > 0) {
        res.pop(); // Remove last empty element
    }
    return res;
}
/**
 * Exception class for Perfetto-related errors.
 */
class PerfettoException extends Error {
    constructor(message) {
        super(message);
        this.name = 'PerfettoException';
    }
}
exports.PerfettoException = PerfettoException;
/**
 * Represents a single row in the query result.
 * Each column name is stored as a property of this class.
 * Corresponds to Python's QueryResultIterator.Row class.
 */
class Row {
    toString() {
        return JSON.stringify(this);
    }
    valueOf() {
        return { ...this };
    }
}
exports.Row = Row;
/**
 * Iterator for query results from trace processor.
 * Provides a TypeScript interface to operate on the contents of QueryResult protos.
 * Corresponds to Python's QueryResultIterator class.
 */
class QueryResultIterator {
    constructor(columnNames, batches) {
        this.columnNames = [...columnNames]; // Copy array
        this.columnCount = columnNames.length;
        // Check if last batch has is_last_batch flag set
        if (batches.length > 0 && !batches[batches.length - 1].isLastBatch) {
            throw new PerfettoException('Last batch did not have is_last_batch flag set');
        }
        // Calculate total cell count
        this.cellCount = batches.reduce((total, batch) => {
            return total + (batch.cells ? batch.cells.length : 0);
        }, 0);
        // Validate cell count is divisible by column count
        for (const batch of batches) {
            if (this.columnCount > 0 && batch.cells && batch.cells.length % this.columnCount !== 0) {
                throw new PerfettoException(`Result has ${this.cellCount} cells, not divisible by ${this.columnCount} columns`);
            }
        }
        this.rowCount = this.columnCount > 0 ? Math.floor(this.cellCount / this.columnCount) : 0;
        this.cells = new Array(this.cellCount);
        this.preprocessCells(batches);
    }
    preprocessCells(batches) {
        // Collect all data arrays from batches, similar to Python implementation
        const varintCells = [];
        const float64Cells = [];
        const stringCells = [];
        const blobCells = [];
        const allCellTypes = [];
        // Flatten all cell types and data arrays from batches
        for (const batch of batches) {
            if (batch.cells) {
                allCellTypes.push(...batch.cells);
            }
            if (batch.varintCells) {
                varintCells.push(...batch.varintCells);
            }
            if (batch.float64Cells) {
                float64Cells.push(...batch.float64Cells);
            }
            if (batch.stringCells) {
                const strings = extractStrings(batch.stringCells);
                stringCells.push(...strings);
            }
            if (batch.blobCells) {
                blobCells.push(...batch.blobCells);
            }
        }
        // Create cells array similar to Python's non-numpy implementation
        const cells = [
            [], // QUERY_CELL_INVALID_FIELD_ID
            [], // QUERY_CELL_NULL_FIELD_ID
            varintCells, // QUERY_CELL_VARINT_FIELD_ID
            float64Cells, // QUERY_CELL_FLOAT64_FIELD_ID
            stringCells, // QUERY_CELL_STRING_FIELD_ID
            blobCells, // QUERY_CELL_BLOB_FIELD_ID
        ];
        const cellOffsets = new Array(QUERY_CELL_TYPE_COUNT).fill(0);
        // Fill cells array based on cell types
        for (let i = 0; i < allCellTypes.length; i++) {
            const cellType = allCellTypes[i];
            if (cellType === QUERY_CELL_NULL_FIELD_ID) {
                this.cells[i] = null;
            }
            else if (cellType >= 0 && cellType < cells.length && cells[cellType]) {
                const typeArray = cells[cellType];
                if (cellOffsets[cellType] < typeArray.length) {
                    let value = typeArray[cellOffsets[cellType]];
                    // Handle Long objects (from protobuf) for varint cells
                    if (cellType === QUERY_CELL_VARINT_FIELD_ID && typeof value === 'object' && value.low !== undefined) {
                        // Cast to unsigned 32-bit integers before bit operations
                        const low = value.low >>> 0;
                        const high = value.high >>> 0;
                        // Use LongBits toNumber() method which correctly handles both signed and unsigned integers
                        // If value.unsigned is true, treat as unsigned integer (use toNumber(true))
                        // If value.unsigned is false or undefined, treat as signed integer (use toNumber())
                        const isUnsigned = value.unsigned === true;
                        value = new protobufjs_1.util.LongBits(low, high).toNumber(isUnsigned);
                    }
                    this.cells[i] = value;
                }
                else {
                    this.cells[i] = null;
                }
            }
            else {
                this.cells[i] = null;
            }
            if (cellType !== QUERY_CELL_NULL_FIELD_ID) {
                cellOffsets[cellType]++;
            }
        }
    }
    /**
     * Get the number of rows in the result set.
     * Corresponds to Python's __len__ method.
     */
    get length() {
        return this.rowCount;
    }
    /**
     * Convert the result to a simple array of objects.
     * Similar to Python's as_pandas_dataframe() but returns plain objects.
     */
    toArray() {
        const results = [];
        for (const row of this) {
            results.push(row);
        }
        return results;
    }
    /**
     * Iterator implementation.
     * Corresponds to Python's __iter__ and __next__ methods.
     */
    [Symbol.iterator]() {
        let currentCellIndex = 0;
        const totalCells = this.cellCount;
        const columnCount = this.columnCount;
        const columnNames = this.columnNames;
        const cells = this.cells;
        return {
            next() {
                if (currentCellIndex >= totalCells) {
                    return { done: true, value: undefined };
                }
                const result = new Row();
                for (let i = 0; i < columnNames.length; i++) {
                    const columnName = columnNames[i];
                    result[columnName] = cells[currentCellIndex + i];
                }
                currentCellIndex += columnCount;
                return { done: false, value: result };
            },
        };
    }
}
exports.QueryResultIterator = QueryResultIterator;
//# sourceMappingURL=query-result-iterator.js.map

/***/ },

/***/ 3184
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadShell = loadShell;
const child_process_1 = __webpack_require__(5317);
const fs = __importStar(__webpack_require__(9896));
const net = __importStar(__webpack_require__(9278));
const os = __importStar(__webpack_require__(857));
const path = __importStar(__webpack_require__(6928));
const node_fetch_1 = __importDefault(__webpack_require__(5287));
const exceptions_1 = __webpack_require__(3642);
// Default port that trace_processor_shell runs on
const TP_PORT = 9001;
/**
 * Load and start the trace processor shell.
 * Corresponds to Python's load_shell function.
 */
async function loadShell(binPath, uniquePort = true, verbose = false, ingestFtraceInRaw = true, enableDevFeatures = false, loadTimeout = 2, extraFlags = []) {
    // Get available port
    const port = uniquePort ? await getAvailablePort() : TP_PORT;
    const addr = 'localhost';
    const url = `http://${addr}:${port}`;
    // Get shell path
    const shellPath = getShellPath(binPath);
    // Build command arguments
    const args = ['-D', '--http-port', port.toString()];
    if (!ingestFtraceInRaw) {
        args.push('--no-ftrace-raw');
    }
    if (enableDevFeatures) {
        args.push('--dev');
    }
    if (extraFlags.length > 0) {
        args.push(...extraFlags);
    }
    // Start the subprocess
    const subprocess = (0, child_process_1.spawn)(shellPath, args, {
        stdio: verbose ? 'inherit' : 'ignore',
        detached: false,
    });
    subprocess.on('error', () => { });
    // Wait for the server to be ready
    const success = await waitForServer(url, loadTimeout);
    if (!success) {
        subprocess.kill();
        throw new exceptions_1.TraceProcessorException(`Failed to start trace processor shell at ${url} within ${loadTimeout} seconds`);
    }
    return { url, subprocess };
}
/**
 * Get the path to the trace processor shell binary.
 */
function getShellPath(binPath) {
    if (binPath) {
        if (fs.existsSync(binPath)) {
            return binPath;
        }
        throw new exceptions_1.TraceProcessorException(`Binary not found at ${binPath}`);
    }
    // Try to find trace_processor_shell in common locations
    const possiblePaths = [
        'trace_processor_shell',
        './trace_processor_shell',
        '../tools/trace_processor_shell',
        path.join(process.cwd(), 'trace_processor_shell'),
    ];
    // Add platform-specific extensions
    const extensions = os.platform() === 'win32' ? ['.exe', ''] : [''];
    for (const basePath of possiblePaths) {
        for (const ext of extensions) {
            const fullPath = basePath + ext;
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
    }
    throw new exceptions_1.TraceProcessorException('trace_processor_shell binary not found. Please specify binPath in config.');
}
/**
 * Get an available port for the trace processor.
 */
async function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const addrInfo = server.address();
            if (!addrInfo || typeof addrInfo === 'string') {
                throw new Error('Failed to get available port');
            }
            const port = addrInfo.port;
            server.close(() => {
                if (port) {
                    resolve(port);
                }
                else {
                    reject(new Error('Failed to get available port'));
                }
            });
        });
        server.on('error', reject);
    });
}
/**
 * Wait for the trace processor server to be ready.
 */
async function waitForServer(url, timeoutSeconds) {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    while (Date.now() - startTime < timeoutMs) {
        try {
            // Use dynamic fetch to avoid import issues
            const response = await (0, node_fetch_1.default)(`${url}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(1000),
            });
            if (response.ok) {
                return true;
            }
        }
        catch {
            // Server not ready yet, continue waiting
        }
        // Wait 100ms before next attempt
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
}
//# sourceMappingURL=shell.js.map

/***/ },

/***/ 3062
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TraceProcessor = void 0;
const fs = __importStar(__webpack_require__(9896));
const config_1 = __webpack_require__(1302);
const exceptions_1 = __webpack_require__(3642);
const http_1 = __webpack_require__(2676);
const query_result_iterator_1 = __webpack_require__(185);
const shell_1 = __webpack_require__(3184);
/**
 * Main TraceProcessor class for querying Perfetto traces.
 * Corresponds to Python's TraceProcessor class.
 */
class TraceProcessor {
    /**
     * Create a new TraceProcessor instance.
     *
     * @param trace Trace file path, Buffer, or stream
     * @param addr Optional address to connect to existing instance
     * @param config Configuration options
     * @param filePath Deprecated parameter for compatibility
     * @returns Promise<TraceProcessor>
     */
    static async create(trace, addr, config = new config_1.TraceProcessorConfig(), filePath) {
        if (trace && filePath) {
            throw new exceptions_1.TraceProcessorException('trace and filePath cannot both be specified.');
        }
        const tp = new TraceProcessor(config);
        // Initialize HTTP client
        await tp.initializeHttp(addr);
        // Load trace if provided
        if (trace || filePath) {
            await tp.parseTrace(trace || filePath);
        }
        return tp;
    }
    /**
     * Constructor for TraceProcessor.
     * Note: For proper async initialization, use TraceProcessor.create() instead.
     */
    constructor(config = new config_1.TraceProcessorConfig()) {
        this.config = config;
    }
    /**
     * Execute a SQL query against the loaded trace.
     *
     * @param sql SQL query string
     * @returns QueryResultIterator for iterating through results
     */
    async query(sql) {
        if (!this.http) {
            throw new exceptions_1.TraceProcessorException('TraceProcessor not initialized');
        }
        try {
            const response = await this.http.executeQuery(sql);
            if (response.error) {
                throw new exceptions_1.TraceProcessorException(response.error);
            }
            return new query_result_iterator_1.QueryResultIterator(response.columnNames || [], response.batch || []);
        }
        catch (error) {
            if (error instanceof exceptions_1.TraceProcessorException) {
                throw error;
            }
            throw new exceptions_1.TraceProcessorException(`Query failed: ${error}`);
        }
    }
    /**
     * Compute metrics for the loaded trace.
     *
     * @param metrics Array of metric names to compute
     * @returns Metrics data
     */
    async metric(metrics) {
        if (!this.http) {
            throw new exceptions_1.TraceProcessorException('TraceProcessor not initialized');
        }
        try {
            const response = await this.http.computeMetric(metrics);
            if (response.error) {
                throw new exceptions_1.TraceProcessorException(response.error);
            }
            return response.metrics;
        }
        catch (error) {
            if (error instanceof exceptions_1.TraceProcessorException) {
                throw error;
            }
            throw new exceptions_1.TraceProcessorException(`Metric computation failed: ${error}`);
        }
    }
    /**
     * Enable metatrace for the currently running trace processor.
     */
    async enableMetatrace() {
        if (!this.http) {
            throw new exceptions_1.TraceProcessorException('TraceProcessor not initialized');
        }
        await this.http.enableMetatrace();
    }
    /**
     * Disable and return the metatrace data.
     */
    async disableAndReadMetatrace() {
        if (!this.http) {
            throw new exceptions_1.TraceProcessorException('TraceProcessor not initialized');
        }
        try {
            const response = await this.http.disableAndReadMetatrace();
            if (response.error) {
                throw new exceptions_1.TraceProcessorException(response.error);
            }
            return response.metatrace;
        }
        catch (error) {
            if (error instanceof exceptions_1.TraceProcessorException) {
                throw error;
            }
            throw new exceptions_1.TraceProcessorException(`Metatrace read failed: ${error}`);
        }
    }
    /**
     * Close the trace processor and clean up resources.
     */
    close() {
        if (this.subprocess) {
            this.subprocess.kill();
            this.subprocess = undefined;
        }
    }
    /**
     * Initialize HTTP client, either connecting to existing instance or starting new one.
     */
    async initializeHttp(addr) {
        if (addr) {
            // Connect to existing trace processor instance
            this.http = new http_1.TraceProcessorHttpClient(addr);
        }
        else {
            // Start new trace processor instance
            try {
                const { url, subprocess } = await (0, shell_1.loadShell)(this.config.binPath, this.config.uniquePort, this.config.verbose, this.config.ingestFtraceInRaw, this.config.enableDevFeatures, this.config.loadTimeout, this.config.extraFlags);
                this.http = new http_1.TraceProcessorHttpClient(url);
                this.subprocess = subprocess;
            }
            catch (error) {
                throw new exceptions_1.TraceProcessorException(`Failed to start trace processor: ${error}`);
            }
        }
    }
    /**
     * Parse and load trace data.
     */
    async parseTrace(trace) {
        if (!this.http) {
            throw new exceptions_1.TraceProcessorException('HTTP client not initialized');
        }
        try {
            if (typeof trace === 'string') {
                // File path
                if (!fs.existsSync(trace)) {
                    throw new exceptions_1.TraceProcessorException(`Trace file not found: ${trace}`);
                }
                await this.http.parse({
                    source: 'FILE',
                    file: trace,
                });
            }
            else if (Buffer.isBuffer(trace)) {
                // Buffer data - write to temp file first
                const tempFile = `/tmp/trace_${Date.now()}.pftrace`;
                fs.writeFileSync(tempFile, trace);
                await this.http.parse({
                    source: 'FILE',
                    file: tempFile,
                });
                // Clean up temp file
                fs.unlinkSync(tempFile);
            }
            else {
                // Stream - read chunks and send them
                const chunks = [];
                for await (const chunk of trace) {
                    chunks.push(Buffer.from(chunk));
                }
                const data = Buffer.concat(chunks);
                const tempFile = `/tmp/trace_${Date.now()}.pftrace`;
                fs.writeFileSync(tempFile, data);
                await this.http.parse({
                    source: 'FILE',
                    file: tempFile,
                });
                // Clean up temp file
                fs.unlinkSync(tempFile);
            }
            // Notify that parsing is complete
            await this.http.notifyEof();
        }
        catch (error) {
            if (error instanceof exceptions_1.TraceProcessorException) {
                throw error;
            }
            throw new exceptions_1.TraceProcessorException(`Failed to parse trace: ${error}`);
        }
    }
}
exports.TraceProcessor = TraceProcessor;
TraceProcessor.QueryResultIterator = query_result_iterator_1.QueryResultIterator;
TraceProcessor.Row = query_result_iterator_1.Row;
//# sourceMappingURL=trace-processor.js.map

/***/ },

/***/ 7309
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NS_TO_MS = void 0;
exports.NS_TO_MS = 1000000;
//# sourceMappingURL=constant.js.map

/***/ },

/***/ 9969
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTreeStyleTraceEvents = getTreeStyleTraceEvents;
const constant_1 = __webpack_require__(7309);
function getTreeStyleTraceEvents(traces) {
    /**
     * Convert a list of trace events into a tree structure.
     *
     * @param traces - A list of trace events, where each trace event is an object
     *                 containing at least 'ts' (timestamp), 'dur' (duration), 'name' (event name),
     *                 and optionally 'children' (a list of child trace events).
     *
     * @returns A tree structure of trace events, where each event is an object with the same keys
     *          as the input events, but with an additional 'children' key containing a list of child events.
     */
    // Add 'end_time' field and 'children' for each trace
    const processedTraces = [];
    for (const trace of traces) {
        const traceItem = {
            id: trace.id,
            start_ts_ms: trace.ts / constant_1.NS_TO_MS + 'ms',
            end_ts_ms: (trace.ts + trace.dur) / constant_1.NS_TO_MS + 'ms',
            duration_ms: (trace.dur / constant_1.NS_TO_MS).toFixed(1) + 'ms',
            self_dur_ms: trace.self_dur_ms,
            ts: trace.ts,
            dur: trace.dur,
            track_id: trace.track_id,
            name: trace.name,
            thread_name: trace.thread_name || '',
            children: [],
            args: trace.args || {},
            description: trace.description || '',
        };
        const args = trace.args;
        const description = trace.description;
        if (args) {
            traceItem.args = args;
        }
        if (description) {
            traceItem.description = description;
        }
        processedTraces.push(traceItem);
    }
    processedTraces.sort((a, b) => a.ts - b.ts);
    // Build tree structure
    function buildTree(tracesList) {
        if (!tracesList.length) {
            return [];
        }
        const result = [];
        const usedIndices = new Set();
        for (let i = 0; i < tracesList.length; i++) {
            const parent = tracesList[i];
            if (usedIndices.has(i)) {
                continue;
            }
            // Find all possible child nodes
            const children = [];
            for (let j = 0; j < tracesList.length; j++) {
                const child = tracesList[j];
                if (j <= i || usedIndices.has(j)) {
                    continue;
                }
                const childTs = child.ts;
                const childDur = child.dur;
                const parentTs = parent.ts;
                const parentDur = parent.dur;
                // Check if child is completely contained within parent's time range
                if (childTs > parentTs && childTs + childDur < parentTs + parentDur && child.track_id === parent.track_id) {
                    children.push([j, child]);
                }
            }
            // If there are child nodes, need to further process nested relationships
            if (children.length > 0) {
                // Sort child nodes by start time
                children.sort((a, b) => a[1].ts - b[1].ts);
                // Recursively build child tree, ensuring correct nested levels
                const childTraces = children.map((child) => child[1]);
                const childIndices = children.map((child) => child[0]);
                // Mark these child nodes as used
                childIndices.forEach((index) => usedIndices.add(index));
                // Recursively build child tree, ensuring correct nested levels
                parent.children = buildTree(childTraces);
            }
            result.push(parent);
        }
        return result;
    }
    // Build tree structure
    const treeResult = buildTree(processedTraces);
    function cleanTempFields(node) {
        if ('thread_name' in node && !node.thread_name) {
            delete node.thread_name;
        }
        if ('description' in node && !node.description) {
            delete node.description;
        }
        if ('args' in node && node.args && Object.keys(node.args).length <= 0) {
            delete node.args;
        }
        if ('self_dur_ms' in node && node.self_dur_ms === undefined) {
            delete node.self_dur_ms;
        }
        if ('ts' in node) {
            delete node.ts;
        }
        if ('dur' in node) {
            delete node.dur;
        }
        if ('children' in node && node.children && node.children.length <= 0) {
            delete node.children;
        }
        for (const child of node.children || []) {
            cleanTempFields(child);
        }
    }
    for (const node of treeResult) {
        cleanTempFields(node);
    }
    return treeResult;
}
//# sourceMappingURL=convert_trace_event_style.js.map

/***/ },

/***/ 6331
(__unused_webpack_module, exports) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseTraceEvent = parseTraceEvent;
function isNotEmptyJson(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        if (!data ||
            (typeof data === 'object' && Object.keys(data).length === 0) ||
            (typeof data === 'object' && JSON.stringify(data) === JSON.stringify({ '': '' }))) {
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
const filterTraceEvents = [
    (s) => s.startsWith('LynxEngine::Invoke'),
    (s) => s.startsWith('LynxRuntime::Invoke'),
    (s) => s.startsWith('NativeFacade::Invoke'),
    (s) => s.startsWith('LayoutContext::Invoke'),
    (s) => s === 'QuickContext::GetAndCall',
    (s) => s === 'RunningInJS',
    (s) => s === 'GetStringEnv',
    (s) => s === 'GetBoolEnv',
    (s) => s === 'GetExternalEnv',
    (s) => s === 'LynxUpdateData',
];
function isFilterTraceEvents(eventName) {
    for (const rule of filterTraceEvents) {
        if (rule(eventName)) {
            return true;
        }
    }
    return false;
}
function parseTraceEvent(query) {
    let traceEvents = [];
    for (const row of query) {
        const event = {
            id: row['id'],
            name: row['name'],
            ts: row['ts'],
            dur: row['dur'] || 0,
            track_id: row['track_id'],
            depth: row['depth'] || 0,
            thread_name: row['thread_name'],
        };
        const args = row['args'];
        if (args) {
            if (typeof args === 'string' && isNotEmptyJson(args)) {
                try {
                    // Try to parse JSON string to object for better type consistency
                    const parsedArgs = JSON.parse(args.replace('debug.', ''));
                    event.args = parsedArgs;
                }
                catch {
                    // If parsing fails, keep as string
                    event.args = args.replace('debug.', '');
                }
            }
            else if (typeof args === 'object') {
                event.args = args;
            }
        }
        // const desc = getTraceEventDesc(event.name);
        // if (desc) {
        //   event.description = desc;
        // }
        traceEvents.push(event);
    }
    // Group events by track_id and depth for faster lookup
    // const eventsByTrackAndDepth: Record<string, TraceEvent[]> = {};
    // for (const event of traceEvents) {
    //   const key = `${event.track_id}:${event.depth}`;
    //   if (!eventsByTrackAndDepth[key]) {
    //     eventsByTrackAndDepth[key] = [];
    //   }
    //   eventsByTrackAndDepth[key].push(event);
    // }
    // for (const event of traceEvents) {
    //   const childDepth = (event.depth || 0) + 1;
    //   const childKey = `${event.track_id}:${childDepth}`;
    //   const potentialChildren = eventsByTrackAndDepth[childKey] || [];
    //   const directChildren = potentialChildren.filter(
    //     (child) => child.ts >= event.ts && child.ts + child.dur <= event.ts + event.dur,
    //   );
    //   const sumChildDur = directChildren.reduce((sum, child) => sum + child.dur, 0);
    //   event.self_dur_ms = Math.round((event.dur - sumChildDur) / 1000000) + 'ms';
    // }
    traceEvents = traceEvents.filter((event) => !isFilterTraceEvents(event.name));
    return traceEvents;
}
//# sourceMappingURL=parse_trace_event.js.map

/***/ },

/***/ 6239
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getReadableTrace = getReadableTrace;
const convert_trace_event_style_1 = __webpack_require__(9969);
/**
 * Process traces array and return simplified format with args
 * @param tp Trace processor instance
 * @param traces Array of trace events with fields like id, ts, dur, track_id, name, depth, arg_set_id, etc.
 * @returns Array with simplified trace events containing id, ts, dur, track_id, name, depth, and args
 */
async function getReadableTrace(tp, traces) {
    if (!traces || traces.length === 0) {
        return [];
    }
    // Get all arg_set_id values from traces
    const argSetIds = traces.filter((trace) => trace.arg_set_id !== null).map((trace) => trace.arg_set_id);
    if (argSetIds.length === 0) {
        // No args to fetch, return basic info
        return Promise.all(traces.map(async (trace) => {
            return {
                id: trace.id,
                start_ts_ms: trace.ts / 1000000 + 'ms',
                end_ts_ms: (trace.ts + trace.dur) / 1000000 + 'ms',
                duration_ms: (trace.dur / 1000000).toFixed(1) + 'ms',
                track_id: trace.track_id,
                name: trace.name,
                args: {},
                thread_name: trace.thread_name || `Thread ${trace.thread_tid || ''}`,
                // description: (await getTraceEventDesc(trace.name)) || '',
            };
        }));
    }
    // Query args for all arg_set_ids
    const argSetIdsStr = argSetIds.join(',');
    const argsSql = `
    SELECT arg_set_id, key, display_value
    FROM args
    WHERE arg_set_id IN (${argSetIdsStr})
      AND key LIKE 'debug.%'
  `;
    const argsResult = await tp.query(argsSql);
    // Group args by arg_set_id
    const argsBySetId = {};
    for (const arg of argsResult) {
        const argSetId = arg.arg_set_id;
        const key = arg.key;
        const value = arg.display_value;
        if (!(argSetId in argsBySetId)) {
            argsBySetId[argSetId] = {};
        }
        // Remove 'debug.' prefix from key
        const cleanKey = key && key.startsWith('debug.') ? key.substring(6) : key;
        if (cleanKey === 'url') {
            continue;
        }
        if (argsBySetId[argSetId]) {
            argsBySetId[argSetId][cleanKey] = value;
        }
    }
    // Build result array
    const result = [];
    for (const trace of traces) {
        const argSetId = trace.arg_set_id;
        const args = argSetId ? argsBySetId[argSetId] || {} : {};
        let threadName = trace.thread_name || '';
        if (!threadName) {
            threadName = `Thread ${trace.thread_tid || ''}`;
        }
        result.push({
            id: trace.id,
            ts: trace.ts,
            dur: trace.dur,
            track_id: trace.track_id,
            name: trace.name,
            args: args,
            thread_name: threadName,
            // description: getTraceEventDesc(trace.name) || undefined,
        });
    }
    // Apply tree styling
    const styledResult = (0, convert_trace_event_style_1.getTreeStyleTraceEvents)(result);
    return styledResult;
}
//# sourceMappingURL=readable_trace.js.map

/***/ },

/***/ 2219
(__unused_webpack_module, exports, __webpack_require__) {


// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TraceQuery = void 0;
const crypto = __importStar(__webpack_require__(6982));
const fs = __importStar(__webpack_require__(9896));
const os = __importStar(__webpack_require__(857));
const path = __importStar(__webpack_require__(6928));
const node_fetch_1 = __importDefault(__webpack_require__(5287));
const trace_processor_1 = __importStar(__webpack_require__(2158));
const binaryCache = new Map();
class TraceQuery {
    constructor() {
        this.traceFileCache = new Map();
    }
    /**
     * Initialize the trace processor with the given trace path
     */
    async initProcessor(tracePath) {
        if (this.traceProcessor) {
            return;
        }
        try {
            // Determine the correct binary path based on the current system
            const binPath = await this.getBinaryPath();
            // Initialize the trace processor with the determined binary path
            const config = new trace_processor_1.TraceProcessorConfig({
                binPath: binPath,
                verbose: false,
                uniquePort: true,
                loadTimeout: 30,
            });
            // Check if trace_url is a local file path
            let traceFile;
            if (this.isLocalFilePath(tracePath)) {
                if (!fs.existsSync(tracePath)) {
                    throw new Error(`Trace file does not exist: ${tracePath}`);
                }
                traceFile = tracePath;
            }
            else {
                // Download trace file and get local path
                traceFile = await this.downloadTraceFile(tracePath);
            }
            this.traceProcessor = await trace_processor_1.default.create(traceFile, undefined, config);
        }
        catch (error) {
            console.error('Error initializing TraceProcessor:', error);
            throw error;
        }
    }
    /**
     * Get the appropriate binary path for the current system
     */
    async getBinaryPath() {
        let config;
        // Check if URL and SHA256 are provided via environment variables
        const envUrl = process.env['TRACE_PROCESSOR_SHELL_URL'];
        const envSha256 = process.env['TRACE_PROCESSOR_SHELL_SHA256'];
        if (envUrl) {
            // Check if envUrl is a local file path
            try {
                // Try to parse as URL - if it fails, it's a local path
                new URL(envUrl);
                // It's a URL
                if (envSha256) {
                    config = {
                        url: envUrl,
                        sha256: envSha256,
                    };
                }
                else {
                    throw new Error(`TRACE_PROCESSOR_SHELL_URL is set but TRACE_PROCESSOR_SHELL_SHA256 is missing. Both are required when using a custom URL.`);
                }
            }
            catch {
                // It's a local file path
                if (fs.existsSync(envUrl)) {
                    // Use the local file directly, no need to download
                    binaryCache.set(envUrl, envUrl);
                    return envUrl;
                }
                else {
                    throw new Error(`Local file specified in TRACE_PROCESSOR_SHELL_URL does not exist: ${envUrl}`);
                }
            }
        }
        if (!config) {
            const trace_processor_shell = {
                darwin: {
                    arm64: {
                        url: 'https://github.com/lynx-family/lynx-trace/releases/download/trace_processor_shell-21d0b01/trace_processor_shell_darwin_arm64',
                        sha256: 'c443069229f3e63e21dea29ec32151724aa88f7adfda5f8ce7887c59ffc7ce74',
                    },
                    x64: {
                        url: 'https://github.com/lynx-family/lynx-trace/releases/download/trace_processor_shell-21d0b01/trace_processor_shell_darwin_x64',
                        sha256: 'fb49570afc842c90f07d9d4f3104a2c7da8e00482849e360866b10c57cd5dd42',
                    },
                },
                linux: {
                    arm64: {
                        url: 'https://github.com/lynx-family/lynx-trace/releases/download/trace_processor_shell-21d0b01/trace_processor_shell_linux_arm64',
                        sha256: '4eb05a3472302c9256dc23df0e102ac78e1c3aedfbf45fa1f41b43c0a89c3d10',
                    },
                    x64: {
                        url: 'https://github.com/lynx-family/lynx-trace/releases/download/trace_processor_shell-21d0b01/trace_processor_shell_linux_x64',
                        sha256: 'b0851455a0aea40a524e42445c775281a3b07f4adaa664f33959fb4d1b03836f',
                    },
                },
                win32: {
                    x64: {
                        url: 'https://github.com/lynx-family/lynx-trace/releases/download/trace_processor_shell-21d0b01/trace_processor_shell_win32.exe',
                        sha256: '530bae7d289a4de67b558876ce8de16d8f72a9b1a891b363533f96002787651c',
                    },
                },
            };
            const platform = os.platform();
            const arch = os.arch();
            if (trace_processor_shell[platform] && trace_processor_shell[platform][arch]) {
                config = trace_processor_shell[platform][arch];
            }
            if (!config) {
                throw new Error(`No prebuilt trace_processor_shell available for ${platform}-${arch}`);
            }
        }
        // Determine cache key based on config
        const cacheKey = envUrl && envSha256 ? `${config.url}-${config.sha256}` : `${os.platform()}-${os.arch()}`;
        // Check if we already have a cached binary path
        if (binaryCache.has(cacheKey)) {
            return binaryCache.get(cacheKey);
        }
        // Generate local file path in tmp directory
        const fileName = path.basename(config.url);
        const localPath = path.join(os.tmpdir(), 'lynx-trace', fileName);
        // Check if file already exists and has correct SHA256
        if (await this.fileExistsAndValid(localPath, config.sha256)) {
            binaryCache.set(cacheKey, localPath);
            return localPath;
        }
        // Download file from remote URL with 30-second timeout
        await this.downloadBinary(config.url, localPath, config.sha256, 30000);
        // Cache the binary path
        binaryCache.set(cacheKey, localPath);
        return localPath;
    }
    /**
     * Check if a file exists and has the correct SHA256 hash
     */
    async fileExistsAndValid(filePath, expectedSha256) {
        try {
            if (!fs.existsSync(filePath)) {
                return false;
            }
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            const actualSha256 = hash.digest('hex');
            return actualSha256 === expectedSha256;
        }
        catch (error) {
            console.error('Error checking file validity:', error);
            return false;
        }
    }
    /**
     * Safely delete a file, ignoring errors
     */
    safeUnlink(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch {
            // Ignore errors when deleting
        }
    }
    /**
     * Download a file from a URL to a local path
     */
    async downloadFile(url, filePath, timeout = 60000) {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Use temporary file to avoid file lock issues
        const tempFilePath = `${filePath}.tmp.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
        const file = fs.createWriteStream(tempFilePath);
        let timer = null;
        try {
            const response = await (0, node_fetch_1.default)(url, { redirect: 'follow' });
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            // Pipe response to file
            response.body.pipe(file);
            await new Promise((resolve, reject) => {
                timer = setTimeout(() => {
                    file.destroy();
                    this.safeUnlink(tempFilePath);
                    reject(new Error(`Download timeout after ${timeout}ms for ${url}. You can also set TRACE_PROCESSOR_SHELL_URL environment variable to specify a local path to avoid downloading.`));
                }, timeout);
                file.on('finish', () => {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    file.close();
                    // Rename temporary file to final file - use atomic rename
                    try {
                        // First try to rename directly, will overwrite on Unix-like systems
                        fs.renameSync(tempFilePath, filePath);
                        resolve();
                    }
                    catch (renameErr) {
                        // On Windows, remove existing file first then rename
                        if (renameErr.code === 'EEXIST') {
                            try {
                                fs.unlinkSync(filePath);
                                fs.renameSync(tempFilePath, filePath);
                                resolve();
                            }
                            catch (retryErr) {
                                this.safeUnlink(tempFilePath);
                                reject(new Error(`Failed to rename temporary file after retry: ${retryErr}`));
                            }
                        }
                        else {
                            this.safeUnlink(tempFilePath);
                            reject(new Error(`Failed to rename temporary file: ${renameErr}`));
                        }
                    }
                });
                file.on('error', (err) => {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    this.safeUnlink(tempFilePath);
                    reject(err);
                });
                file.on('close', () => {
                    if (timer) {
                        clearTimeout(timer);
                    }
                });
            });
        }
        catch (error) {
            // Clean up on error
            file.destroy();
            this.safeUnlink(tempFilePath);
            throw error;
        }
    }
    /**
     * Download and verify a binary file
     */
    async downloadBinary(url, localPath, expectedSha256, timeout = 60000) {
        await this.downloadFile(url, localPath, timeout);
        // Verify SHA256
        try {
            const fileBuffer = fs.readFileSync(localPath);
            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            const actualSha256 = hash.digest('hex');
            if (actualSha256 !== expectedSha256) {
                this.safeUnlink(localPath); // Remove invalid file
                throw new Error(`SHA256 mismatch. Expected: ${expectedSha256}, Got: ${actualSha256}`);
            }
            // Make file executable
            fs.chmodSync(localPath, 0o755);
        }
        catch (error) {
            this.safeUnlink(localPath); // Clean up on error
            throw new Error(`Error verifying downloaded file: ${error}`);
        }
    }
    /**
     * Extract the actual trace URL from a potentially encoded URL
     */
    getTraceUrl(url) {
        try {
            const parsed = new URL(url);
            // Search from query parameters
            const urlParam = parsed.searchParams.get('url');
            if (urlParam) {
                return decodeURIComponent(urlParam);
            }
            // Search from fragment
            const queryUrlIndex = url.indexOf('?');
            if (queryUrlIndex !== -1) {
                const queryString = url.substring(queryUrlIndex + 1);
                const params = new URLSearchParams(queryString);
                const encodedUrl = params.get('url');
                if (encodedUrl) {
                    return decodeURIComponent(encodedUrl);
                }
            }
            return url;
        }
        catch {
            return url;
        }
    }
    /**
     * Generate a temporary path for a trace file based on its URL
     */
    traceTmpPath(url) {
        const tmpDir = path.join(os.tmpdir(), 'lynx-trace-files');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        // Generate a unique filename based on the URL to avoid conflicts
        const urlHash = crypto.createHash('md5').update(url).digest('hex');
        const originalFilename = path.basename(new URL(url).pathname) || 'trace_file';
        const filename = `${urlHash}_${originalFilename}`;
        return path.join(tmpDir, filename);
    }
    /**
     * Check if a trace file already exists locally
     */
    urlToFilenameExist(url) {
        const filePath = this.traceTmpPath(url);
        return fs.existsSync(filePath);
    }
    /**
     * Download a trace file from a URL
     */
    async downloadTrace(url) {
        const filePath = this.traceTmpPath(url);
        await this.downloadFile(url, filePath);
    }
    /**
     * Check if a path is a local file path
     */
    isLocalFilePath(path) {
        // Check if path is a valid local file path by checking for protocol
        try {
            // First decode the URL to handle encoded characters
            const decodedPath = decodeURI(path);
            // If it's a valid URL with protocol, it's not a local file
            new URL(decodedPath);
            return false;
        }
        catch {
            // If URL parsing fails, treat it as a local file path
            return true;
        }
    }
    /**
     * Download a trace file and return its local path
     */
    async downloadTraceFile(url) {
        // Check cache first
        if (this.traceFileCache.has(url)) {
            return this.traceFileCache.get(url);
        }
        const traceUrl = this.getTraceUrl(url);
        if (!this.urlToFilenameExist(traceUrl)) {
            await this.downloadTrace(traceUrl);
        }
        const traceFilePath = this.traceTmpPath(traceUrl);
        // Cache the trace file path
        this.traceFileCache.set(url, traceFilePath);
        return traceFilePath;
    }
    /**
     * Execute a SQL query on the trace
     */
    async query(sql) {
        if (!this.traceProcessor) {
            throw new trace_processor_1.TraceProcessorException('TraceProcessor is not initialized. Call initProcessor first.');
        }
        try {
            const result = await this.traceProcessor.query(sql);
            const rows = result.toArray();
            return rows;
        }
        catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }
    /**
     * Destroy the trace processor and clean up resources
     */
    async destroyProcessor() {
        if (this.traceProcessor) {
            try {
                this.traceProcessor.close();
            }
            catch (error) {
                console.error('Error closing TraceProcessor:', error);
            }
            this.traceProcessor = undefined;
        }
    }
    /**
     * Check if the trace processor is initialized
     */
    isInitialized() {
        return this.traceProcessor !== undefined;
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.traceFileCache.clear();
    }
}
exports.TraceQuery = TraceQuery;
//# sourceMappingURL=trace_query.js.map

/***/ },

/***/ 181
(module) {

module.exports = require("buffer");

/***/ },

/***/ 5317
(module) {

module.exports = require("child_process");

/***/ },

/***/ 6982
(module) {

module.exports = require("crypto");

/***/ },

/***/ 4434
(module) {

module.exports = require("events");

/***/ },

/***/ 9896
(module) {

module.exports = require("fs");

/***/ },

/***/ 9278
(module) {

module.exports = require("net");

/***/ },

/***/ 4573
(module) {

module.exports = require("node:buffer");

/***/ },

/***/ 3024
(module) {

module.exports = require("node:fs");

/***/ },

/***/ 7067
(module) {

module.exports = require("node:http");

/***/ },

/***/ 4708
(module) {

module.exports = require("node:https");

/***/ },

/***/ 7030
(module) {

module.exports = require("node:net");

/***/ },

/***/ 6760
(module) {

module.exports = require("node:path");

/***/ },

/***/ 1708
(module) {

module.exports = require("node:process");

/***/ },

/***/ 7075
(module) {

module.exports = require("node:stream");

/***/ },

/***/ 7830
(module) {

module.exports = require("node:stream/web");

/***/ },

/***/ 3136
(module) {

module.exports = require("node:url");

/***/ },

/***/ 7975
(module) {

module.exports = require("node:util");

/***/ },

/***/ 8522
(module) {

module.exports = require("node:zlib");

/***/ },

/***/ 857
(module) {

module.exports = require("os");

/***/ },

/***/ 6928
(module) {

module.exports = require("path");

/***/ },

/***/ 932
(module) {

module.exports = require("process");

/***/ },

/***/ 8167
(module) {

module.exports = require("worker_threads");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, [804], () => (__webpack_require__(4242)))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; (typeof current == 'object' || typeof current == 'function') && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and chunks that the entrypoint depends on
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + "shared" + ".bundle.cjs";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 883;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			883: 1
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.O.require = (chunkId) => (installedChunks[chunkId]);
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 			__webpack_require__.O();
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					var installedChunk = require("./" + __webpack_require__.u(chunkId));
/******/ 					if (!installedChunks[chunkId]) {
/******/ 						installChunk(installedChunk);
/******/ 					}
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			__webpack_require__.e(804);
/******/ 			return next();
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=trace_query.bundle.cjs.map