import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClient } from "./utils.mjs";
function registerListSessionsCommand(program, context) {
    program.command('list-sessions').description('List all available sessions').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const sessions = await connector.sendListSessionMessage(clientId);
        console.log(JSON.stringify(sessions, null, 2));
    });
}
export { registerListSessionsCommand };
