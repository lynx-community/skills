import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClient } from "./utils.mjs";
function registerAppCommand(program, context) {
    program.command('app').description('Send an App request').requiredOption('-m, --method <method>', 'App method (e.g., App.openPage)').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const { method } = options;
        const params = paramsStr ? JSON.parse(paramsStr) : {};
        const result = await connector.sendAppMessage(clientId, method, params);
        console.log(JSON.stringify(result, null, 2));
    });
}
export { registerAppCommand };
