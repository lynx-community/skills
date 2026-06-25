import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClient, parseOnOff } from "./utils.mjs";
const GLOBAL_SWITCH_KEYS = [
    'enable_devtool',
    'enable_logbox',
    'enable_debug_mode',
    'enable_dom_tree',
    'enable_quickjs_debug',
    'enable_quickjs_cache',
    'enable_v8',
    'enable_cdp_domain_dom',
    'enable_cdp_domain_css',
    'enable_cdp_domain_page',
    'enable_long_press_menu',
    'enable_highlight_touch',
    'enable_preview_screen_shot',
    'enable_pixel_copy',
    'enable_fsp_screenshot'
];
const GLOBAL_SWITCH_KEYS_HELP = GLOBAL_SWITCH_KEYS.join(' | ');
function parseKey(input) {
    if (GLOBAL_SWITCH_KEYS.includes(input)) return input;
    throw new Error(`Invalid --key value: ${input}. Use global-switch list to inspect supported keys.`);
}
function registerGlobalSwitchCommand(program, context) {
    const globalSwitch = program.command('global-switch').description('Manage DevTool global switches');
    globalSwitch.command('list').description('List all global switch states').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option('--fail-fast', 'Abort on first key-read failure').action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const switches = [];
        for (const key of GLOBAL_SWITCH_KEYS)try {
            const value = await connector.getGlobalSwitch(clientId, key);
            switches.push({
                key,
                value
            });
        } catch (error) {
            if (options.failFast) throw error;
            switches.push({
                key,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        console.log(JSON.stringify({
            switches
        }, null, 2));
    });
    globalSwitch.command('get').description('Get one global switch state').requiredOption('--key <key>', `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`).option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const key = parseKey(options.key);
        const value = await connector.getGlobalSwitch(clientId, key);
        console.log(JSON.stringify({
            key,
            value
        }, null, 2));
    });
    globalSwitch.command('set').description('Set one global switch state').requiredOption('--key <key>', `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`).requiredOption('--status <status>', 'Switch status: on/off').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const key = parseKey(options.key);
        const value = parseOnOff(options.status);
        await connector.setGlobalSwitch(clientId, key, value);
        console.log(JSON.stringify({
            key,
            value
        }, null, 2));
    });
}
export { registerGlobalSwitchCommand };
