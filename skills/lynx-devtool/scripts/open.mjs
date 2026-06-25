import { FilterTransformStream } from "./347.mjs";
import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClient } from "./utils.mjs";
import { isListSessionResponse } from "./182.mjs";
function registerOpenCommand(program, context) {
    program.command('open').description('Open page').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).argument('<url>', 'The url of the page').action(async (url, options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const result = await connector.sendMessage(clientId, {
            event: 'Customized',
            data: {
                type: 'OpenCard',
                data: {
                    type: 'url',
                    url
                },
                sender: -1
            },
            from: -1
        }, {
            input: [],
            output: [
                new FilterTransformStream(isListSessionResponse)
            ]
        });
        console.log(JSON.stringify(result, null, 2));
    });
}
export { registerOpenCommand };
