import { registerFindCommand } from "./find.mjs";
import { registerComponentCommand } from "./inspect.mjs";
import { registerTreeCommand } from "./tree.mjs";
import { registerUpdateCommands } from "./update.mjs";
function registerReactLynxCommand(program, context) {
    const reactlynx = program.command('reactlynx').description('Inspect a running ReactLynx app via @lynx-js/preact-devtools');
    registerTreeCommand(reactlynx, context);
    registerComponentCommand(reactlynx, context);
    registerFindCommand(reactlynx, context);
    registerUpdateCommands(reactlynx, context);
}
export { registerReactLynxCommand };
