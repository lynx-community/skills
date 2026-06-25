import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "../utils.mjs";
import { formatTree } from "./format.mjs";
import { runReactLynxSession, emptyTreeDiagnostic, buildOutboundFrame } from "./transport.mjs";
import { typeTag } from "./protocol.mjs";
function parseComponentRef(ref) {
    const labelMatch = /^@c(\d+)$/.exec(ref);
    if (labelMatch) {
        const index = Number.parseInt(labelMatch[1], 10);
        if (!Number.isFinite(index) || index < 1) throw new Error(`Invalid label ${ref}; expected @c1, @c2, ...`);
        return {
            kind: 'label',
            index
        };
    }
    const numeric = Number.parseInt(ref, 10);
    if (!Number.isFinite(numeric) || String(numeric) !== ref.trim()) throw new Error(`Invalid <ref> ${JSON.stringify(ref)}; expected @cN or a numeric id.`);
    return {
        kind: 'id',
        id: numeric
    };
}
function formatInspectResult(data, ref) {
    const lines = [];
    const headerKey = data.key ? ` key=${data.key}` : '';
    lines.push(`${ref} (id=${data.id}) [${typeTag(data.type)}] ${data.name}${headerKey}`);
    if (data.__source) lines.push(`  source: ${data.__source.fileName}:${data.__source.lineNumber}:${data.__source.columnNumber}`);
    if (void 0 !== data.suspended && data.suspended) lines.push('  suspended: true');
    appendSection(lines, 'props', data.props);
    appendSection(lines, 'state', data.state);
    appendSection(lines, 'hooks', data.hooks);
    appendSection(lines, 'context', data.context);
    appendSection(lines, 'signals', data.signals);
    return lines.join('\n');
}
function appendSection(lines, label, value) {
    if (null == value) return;
    if (Array.isArray(value) && 0 === value.length) return;
    if ('object' == typeof value && !Array.isArray(value) && 0 === Object.keys(value).length) return;
    lines.push(`  ${label}:`);
    const rendered = JSON.stringify(value, null, 2).split('\n').map((l)=>`    ${l}`).join('\n');
    lines.push(rendered);
}
function registerComponentCommand(reactlynx, context) {
    reactlynx.command('component <ref>').description("Inspect a single component (props/state/hooks/context). <ref> is either `@cN` (resolved against `reactlynx tree`) or a numeric id.").option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--show-shells', "When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers the same way `reactlynx tree --show-shells` does. Has no effect on numeric ids.", false).option('--json', 'Print the raw `InspectData` payload as JSON', false).action(async (ref, options)=>{
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
                process.stderr.write(`[reactlynx component] ${emptyTreeDiagnostic(snapshot)}\n`);
                process.exitCode = 1;
                return;
            }
            const labels = formatTree(snapshot.state, {
                hideShells: !options.showShells
            }).labels;
            const resolved = labels[parsed.index - 1];
            if (void 0 === resolved) {
                process.stderr.write(`[reactlynx component] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`);
                process.exitCode = 1;
                return;
            }
            targetId = resolved;
        } else targetId = parsed.id;
        let inspectResult;
        const inspectSession = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame('inspect', targetId)
            ],
            idleMs: 1000,
            maxMs: 5000,
            onEnvelope: (env)=>{
                if ('inspect-result' === env.type && env.data && 'object' == typeof env.data) {
                    inspectResult = env.data;
                    return 'stop';
                }
                return 'continue';
            }
        });
        if (!inspectResult) {
            const types = [
                ...inspectSession.envelopeTypes
            ].sort().join(',') || '(none)';
            process.stderr.write(`[reactlynx component] no \`inspect-result\` for id ${targetId} after ${inspectSession.framesSeen} frame(s) (types=${types}). Common causes:\n  - the id is stale (the App has unmounted that component since the snapshot was taken)\n  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`inspect\`\n  - the targeted thread does not have a Preact renderer (e.g. you picked a non-ReactLynx session).\nRerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(inspectResult, null, 2) + '\n');
        process.stdout.write(formatInspectResult(inspectResult, ref) + '\n');
    });
}
export { formatInspectResult, parseComponentRef, registerComponentCommand };
