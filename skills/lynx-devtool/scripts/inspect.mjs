import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "./utils.mjs";
const DEFAULT_DAEMON_PORT = 21783;
function registerInspectCommand(program, context) {
    program.command('inspect').description('Output the inspector URL for a client/session').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--port <port>', 'Daemon port', String(DEFAULT_DAEMON_PORT)).action(async (options)=>{
        const { clientId, sessionId } = await resolveClientAndSession(context, options);
        const port = parseInt(options.port, 10) || DEFAULT_DAEMON_PORT;
        const inspectorUrl = `http://127.0.0.1:${port}/devtool/connector/inspector?clientId=${encodeURIComponent(clientId)}&sessionId=${encodeURIComponent(sessionId)}`;
        console.log(inspectorUrl);
    });
}
export { registerInspectCommand };
