import { CLIENT_OPTION, CLIENT_NAME_OPTION, resolveClient } from "./utils.mjs";
const DEBUG_MODE_KEY = 'enable_debug_mode';
const DEBUG_MODE_RESTART_MESSAGE = '`enable_debug_mode` has been enabled. Restart the app and run `recorder start` again.';
function registerStartCommand(parent, context) {
    parent.command('start').description('Start TestBench recording').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const result = await runRecordingStart(connector, clientId);
        console.log(JSON.stringify({
            success: result.started,
            ...result
        }));
    });
}
async function runRecordingStart(connector, clientId) {
    const debugModeEnabled = await connector.getGlobalSwitch(clientId, DEBUG_MODE_KEY);
    if (!debugModeEnabled) {
        await connector.setGlobalSwitch(clientId, DEBUG_MODE_KEY, true);
        return {
            started: false,
            restartRequired: true,
            message: DEBUG_MODE_RESTART_MESSAGE
        };
    }
    try {
        await connector.sendCDPMessage(clientId, -1, 'Recording.start', {});
    } catch (err) {
        if (!isRecordingStartNotImplementedError(err)) throw err;
        throw new Error("Recording.start is not implemented even after `enable_debug_mode` is enabled. The app or engine may not include `ENABLE_TESTBENCH_RECORDER`, or it may not be a dev/recorder build.", {
            cause: err
        });
    }
    return {
        started: true,
        restartRequired: false,
        message: 'Recording started successfully. Open or reload a Lynx page before `recorder end`.'
    };
}
function isRecordingStartNotImplementedError(err) {
    return err instanceof Error && err.message.includes('Not implemented') && err.message.includes('Recording.start');
}
var recorder_start_runRecordingStart = void 0;
export { recorder_start_runRecordingStart as runRecordingStart, registerStartCommand };
