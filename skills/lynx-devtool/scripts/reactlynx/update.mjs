import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "../utils.mjs";
import { formatTree } from "./format.mjs";
import { parseComponentRef, formatInspectResult } from "./inspect.mjs";
import { runReactLynxSession, emptyTreeDiagnostic, buildOutboundFrame } from "./transport.mjs";
function parseUpdateValue(input, options) {
    if (options.raw) return input;
    try {
        return JSON.parse(input);
    } catch (err) {
        throw new Error(`<value> must be valid JSON (e.g. \`"hello"\`, \`42\`, \`true\`, \`null\`, \`{"a":1}\`); pass --raw to send the input verbatim as a string. Underlying error: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err
        });
    }
}
function buildUpdatePath(userPath) {
    if (0 === userPath.length) throw new Error('<path> must not be empty. Use dot notation, e.g. `count`, `user.name`, `items.0.title`.');
    for (const prefix of [
        'root.',
        'props.',
        'state.',
        'context.'
    ])if (userPath.startsWith(prefix)) throw new Error(`<path> ${JSON.stringify(userPath)} must not start with \`${prefix}\`. The CLI prepends \`root.\` automatically; pass paths starting at the field name, e.g. \`count\`.`);
    for (const segment of userPath.split('.'))if (0 === segment.length) throw new Error(`<path> ${JSON.stringify(userPath)} contains an empty segment. Dot notation must look like \`a.b.c\`, not \`a..b\` or \`.a\`.`);
    return `root.${userPath}`;
}
function registerUpdateCommands(reactlynx, context) {
    registerOneUpdate(reactlynx, context, {
        name: 'update-prop',
        description: 'Set a prop on a single ReactLynx component (forceUpdate is called for you)',
        kind: 'update-prop'
    });
    registerOneUpdate(reactlynx, context, {
        name: 'update-state',
        description: 'Set a state field on a single class component (forceUpdate is called for you)',
        kind: 'update-state'
    });
    registerOneUpdate(reactlynx, context, {
        name: 'update-context',
        description: 'Set a context value on a single component. Best-effort; upstream may make this read-only in the future.',
        kind: 'update-context'
    });
}
function registerOneUpdate(reactlynx, context, spec) {
    reactlynx.command(`${spec.name} <ref> <path> <value>`).description(spec.description).option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--show-shells', "When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers the same way `reactlynx tree --show-shells` does. No effect for numeric ids.", false).option('--raw', 'Send <value> verbatim as a string instead of parsing it as JSON', false).option('--json', 'Print the post-update `InspectData` as JSON instead of an ASCII summary', false).action(async (ref, userPath, rawValue, options)=>{
        const path = buildUpdatePath(userPath);
        const value = parseUpdateValue(rawValue, {
            raw: options.raw ?? false
        });
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        let targetId;
        const parsed = parseComponentRef(ref);
        if ('label' === parsed.kind) {
            const snapshot = await runReactLynxSession({
                connector,
                clientId,
                sessionId: Number(sessionId),
                outbound: [
                    buildOutboundFrame('refresh')
                ]
            });
            if (0 === snapshot.state.tree.size) {
                process.stderr.write(`[reactlynx ${spec.name}] ${emptyTreeDiagnostic(snapshot)}\n`);
                process.exitCode = 1;
                return;
            }
            const labels = formatTree(snapshot.state, {
                hideShells: !options.showShells
            }).labels;
            const resolved = labels[parsed.index - 1];
            if (void 0 === resolved) {
                process.stderr.write(`[reactlynx ${spec.name}] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`);
                process.exitCode = 1;
                return;
            }
            targetId = resolved;
        } else targetId = parsed.id;
        let confirmation;
        const session = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame(spec.kind, {
                    id: targetId,
                    path,
                    value
                })
            ],
            idleMs: 1000,
            maxMs: 5000,
            onEnvelope: (env)=>{
                if ('inspect-result' === env.type && env.data && 'object' == typeof env.data && env.data.id === targetId) {
                    confirmation = env.data;
                    return 'stop';
                }
                return 'continue';
            }
        });
        if (!confirmation) {
            const types = [
                ...session.envelopeTypes
            ].sort().join(',') || '(none)';
            process.stderr.write(`[reactlynx ${spec.name}] no confirmation \`inspect-result\` for id ${targetId} after ${session.framesSeen} frame(s) (types=${types}). Common causes:\n  - the path is wrong (the App's setInCopy walks objects/arrays; non-existent intermediate keys are created, but typos still produce a no-op forceUpdate)\n  - the id is stale (component unmounted between snapshot and update)\n  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`${spec.kind}\`\n  - for update-state/update-context: the target is a function component (those have neither)\nRerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(confirmation, null, 2) + '\n');
        process.stdout.write(formatInspectResult(confirmation, ref) + '\n');
    });
}
var update_buildUpdatePath = void 0;
var update_parseUpdateValue = void 0;
export { registerUpdateCommands, update_buildUpdatePath as buildUpdatePath, update_parseUpdateValue as parseUpdateValue };
