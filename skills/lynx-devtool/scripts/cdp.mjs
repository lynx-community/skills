import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClientAndSession, SESSION_OPTION } from "./utils.mjs";
function registerCdpCommand(program, context) {
    program.command('cdp').description('Send a CDP request').requiredOption('-m, --method <method>', 'CDP method (e.g., DOM.getDocument)').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--thread <thread>', "Thread to target (e.g., 'main' or 'background'). Defaults to 'background'").argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        const { method } = options;
        const thread = options.thread ?? 'background';
        const params = paramsStr ? JSON.parse(paramsStr) : {};
        const result = await connector.sendCDPMessage(clientId, Number(sessionId), method, params, 'main' === thread);
        console.log(JSON.stringify(result, null, 2));
    });
}
export { registerCdpCommand };
