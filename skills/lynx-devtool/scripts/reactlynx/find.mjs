import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "../utils.mjs";
import { formatTree } from "./format.mjs";
import { runReactLynxSession, emptyTreeDiagnostic, buildOutboundFrame } from "./transport.mjs";
import { typeTag } from "./protocol.mjs";
function findComponents(state, matcher, options) {
    const formatted = formatTree(state, {
        hideShells: options.hideShells
    });
    const idToLabel = new Map();
    formatted.labels.forEach((id, idx)=>{
        idToLabel.set(id, `@c${idx + 1}`);
    });
    const matches = [];
    for (const id of formatted.labels){
        const node = state.tree.get(id);
        if (!node) continue;
        if (!matcher(node.name)) continue;
        const ancestors = [];
        let cursorId = node.parent;
        while(void 0 !== cursorId && -1 !== cursorId){
            const cursor = state.tree.get(cursorId);
            if (!cursor) break;
            const label = idToLabel.get(cursorId);
            if (label) ancestors.unshift({
                label,
                name: cursor.name
            });
            cursorId = cursor.parent;
        }
        matches.push({
            label: idToLabel.get(id) ?? '@c?',
            id: node.id,
            name: node.name,
            type: node.type,
            key: node.key,
            ancestors
        });
        if (matches.length >= options.limit) break;
    }
    return matches;
}
function buildSubstringMatcher(pattern) {
    const needle = pattern.toLowerCase();
    return (name)=>name.toLowerCase().includes(needle);
}
function buildRegexMatcher(pattern) {
    let re;
    try {
        re = new RegExp(pattern);
    } catch (err) {
        throw new Error(`--regex pattern is invalid: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err
        });
    }
    return (name)=>re.test(name);
}
function registerFindCommand(reactlynx, context) {
    reactlynx.command('find <pattern>').description("Find components by display name. Default match is case-insensitive substring; use --regex for a JavaScript regular expression.").option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--regex', 'Treat <pattern> as a JavaScript regular expression', false).option('--show-shells', 'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts', false).option('--limit <n>', 'Maximum number of matches to print (default: 50)', (v)=>{
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) throw new Error(`--limit must be a positive integer (got ${v})`);
        return n;
    }, 50).option('--json', 'Emit a JSON array `[{ label, id, name, type, key, ancestors: [{label, name}] }]`', false).action(async (pattern, options)=>{
        const matcher = options.regex ? buildRegexMatcher(pattern) : buildSubstringMatcher(pattern);
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        const result = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame('refresh')
            ]
        });
        if (0 === result.state.tree.size) {
            process.stderr.write(`[reactlynx find] ${emptyTreeDiagnostic(result)}\n`);
            process.exitCode = 1;
            return;
        }
        const matches = findComponents(result.state, matcher, {
            hideShells: !options.showShells,
            limit: options.limit ?? 50
        });
        if (0 === matches.length) {
            process.stderr.write(`[reactlynx find] no components match ${options.regex ? 'regex' : 'substring'} ${JSON.stringify(pattern)} (searched ${result.state.tree.size} components${options.showShells ? '' : ', shells hidden'})\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(matches, null, 2) + '\n');
        process.stdout.write(formatMatches(matches) + '\n');
    });
}
function formatMatches(matches) {
    const lines = [];
    for (const match of matches){
        let header = `${match.label} [${typeTag(match.type)}] ${match.name}`;
        if (match.key) header += ` key=${match.key}`;
        lines.push(header);
        if (match.ancestors.length > 0) lines.push('  in ' + match.ancestors.map((a)=>`${a.label} ${a.name}`).join(' > '));
    }
    return lines.join('\n');
}
var find_buildRegexMatcher = void 0;
var find_buildSubstringMatcher = void 0;
var find_findComponents = void 0;
var find_formatMatches = void 0;
export { find_buildRegexMatcher as buildRegexMatcher, find_buildSubstringMatcher as buildSubstringMatcher, find_findComponents as findComponents, find_formatMatches as formatMatches, registerFindCommand };
