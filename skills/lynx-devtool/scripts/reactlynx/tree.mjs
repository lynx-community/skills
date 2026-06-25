import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "../utils.mjs";
import { formatTree } from "./format.mjs";
import { runReactLynxSession, emptyTreeDiagnostic, buildOutboundFrame } from "./transport.mjs";
function registerTreeCommand(reactlynx, context) {
    reactlynx.command('tree').description('Print the ReactLynx component tree as an ASCII diagram with @cN labels.').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--depth <n>', 'Maximum tree depth to print (default: unbounded)', (v)=>{
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) throw new Error(`--depth must be a positive integer (got ${v})`);
        return n;
    }).option('--show-shells', 'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts', false).option('--json', 'Emit a JSON object { labels, roots, nodes } instead of ASCII', false).action(async (options)=>{
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
            process.stderr.write(`[reactlynx tree] ${emptyTreeDiagnostic(result)}\n`);
            process.exitCode = 1;
            return;
        }
        const formatted = formatTree(result.state, {
            maxDepth: options.depth,
            hideShells: !options.showShells
        });
        if (options.json) {
            const nodes = Array.from(result.state.tree.values()).map((n)=>({
                    id: n.id,
                    type: n.type,
                    name: n.name,
                    key: n.key,
                    parent: n.parent,
                    children: n.children
                }));
            process.stdout.write(JSON.stringify({
                labels: formatted.labels,
                roots: result.state.roots,
                nodes
            }, null, 2) + '\n');
        } else process.stdout.write(formatted.text + '\n');
    });
}
export { registerTreeCommand };
