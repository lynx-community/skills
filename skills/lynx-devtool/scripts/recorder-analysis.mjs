import { node_path, node_zlib } from "./786.mjs";
function analyzeRecordingBuffer(filePath, buffer) {
    const fileSizeBytes = buffer.byteLength;
    let recording;
    let parseFailed = false;
    try {
        const raw = buffer.toString('utf-8').trim();
        if (raw.startsWith('{') || raw.startsWith('[')) recording = JSON.parse(raw);
        else {
            const decoded = Buffer.from(raw, 'base64');
            const inflated = node_zlib.inflateSync(decoded);
            recording = JSON.parse(inflated.toString('utf-8'));
        }
    } catch  {
        parseFailed = true;
        recording = {};
    }
    if (parseFailed) return {
        file: filePath,
        fileSizeBytes,
        healthy: false,
        actions: 0,
        hasTemplate: false,
        functionDistribution: {},
        verdict: 'Cannot parse — file is not a valid TestBench recording'
    };
    const actions = Array.isArray(recording) ? recording : recording['Action List'] ?? [];
    const functionDistribution = {};
    for (const action of actions){
        const fn = action['Function Name'];
        functionDistribution[fn] = (functionDistribution[fn] ?? 0) + 1;
    }
    const hasTemplate = actions.some((a)=>'loadTemplate' === a['Function Name']);
    const hasTouchEvents = actions.some((a)=>'SendTouchEvent' === a['Function Name'] || 'sendEventDarwin' === a['Function Name']);
    let healthy;
    let verdict;
    if (0 === actions.length) {
        healthy = false;
        verdict = 'Empty recording — no actions captured';
    } else if (hasTemplate) {
        healthy = true;
        verdict = 'Valid recording — includes template load and interaction data';
    } else if (hasTouchEvents) {
        healthy = true;
        verdict = 'Recording captures touch events but no template load — still useful for analyzing interactions, but cannot be replayed in Lynx Explorer';
    } else {
        healthy = true;
        verdict = 'Recording has actions but no template load — useful for inspecting JSB calls or data updates, but cannot be replayed';
    }
    return {
        file: filePath,
        fileSizeBytes,
        healthy,
        actions: actions.length,
        hasTemplate,
        functionDistribution,
        verdict
    };
}
function recordingOutputPath(basePath, sessionId, index) {
    const suffix = sessionId > 0 ? `-session${sessionId}` : index > 0 ? `-${index}` : '';
    if (!suffix) return basePath;
    const parsed = node_path.parse(basePath);
    return node_path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext || '.json'}`);
}
export { analyzeRecordingBuffer, recordingOutputPath };
