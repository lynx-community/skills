import { Connector } from "./347.mjs";
const NO_CLIENTS_FOUND_MESSAGE = "No Lynx DevTool clients were found.\n\nTry these steps:\n1. Make sure the target device/simulator and app are running.\n2. If the app just launched, wait a moment and rerun `list-clients`.\n3. If this is unexpected, rerun with `DEBUG='devtool-mcp-server:connector*'` or try `--no-daemon`.\n\nSee `skills/lynx-devtool/references/troubleshooting/symptoms.md#list-clients-returns-` for more details.";
async function runListClientsCommand(connector, { print = console.log } = {}) {
    const clients = await connector.listClients();
    if (0 === clients.length) throw new Error(NO_CLIENTS_FOUND_MESSAGE);
    print(JSON.stringify(clients, null, 2));
}
function registerListClientsCommand(program, { transports }) {
    program.command('list-clients').description('List all available clients').action(async ()=>{
        const connector = new Connector(transports);
        await runListClientsCommand(connector);
    });
}
var list_clients_runListClientsCommand = void 0;
export { list_clients_runListClientsCommand as runListClientsCommand, registerListClientsCommand };
