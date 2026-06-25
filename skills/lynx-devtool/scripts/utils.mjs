import { promises_setTimeout } from "./786.mjs";
import { Connector } from "./347.mjs";
const CLIENT_OPTION = [
    '-c, --client <clientId>',
    'Client ID (optional, auto-discovered if omitted).'
];
const CLIENT_NAME_OPTION = [
    '--client-name <name>',
    'Client package/app name (optional, resolved from list-clients; e.g. com.example.app)'
];
const SESSION_OPTION = [
    '-s, --session <sessionId>',
    'Session ID (optional, will auto-discover if not provided)'
];
async function getFirstClient(connector) {
    const clients = await connector.listClients();
    const firstClient = clients[0];
    if (!firstClient) throw new Error('No available clients found.');
    return firstClient.id;
}
function uniqueNonEmptyStrings(values) {
    return Array.from(new Set(values.filter((value)=>'string' == typeof value).map((value)=>value.trim()).filter(Boolean)));
}
function getClientNames(client) {
    return uniqueNonEmptyStrings([
        client.info.AppProcessName,
        client.info.bundleId,
        client.info.bundleName,
        client.info.App
    ]);
}
function formatClientForError(client) {
    const names = getClientNames(client);
    const suffix = names.length > 0 ? ` (${names.join(', ')})` : '';
    return `  ${client.id}${suffix}`;
}
async function getClientByName(connector, clientName) {
    const clients = await connector.listClients();
    const matches = clients.filter((client)=>getClientNames(client).includes(clientName));
    if (1 === matches.length) {
        const matchedClient = matches[0];
        return matchedClient.id;
    }
    if (matches.length > 1) throw new Error(`Multiple clients found matching --client-name "${clientName}". Use --client with one of:\n` + matches.map(formatClientForError).join('\n'));
    const availableClients = clients.map(formatClientForError).join('\n');
    throw new Error(`No client found matching --client-name "${clientName}".` + (availableClients ? `\nAvailable clients:\n${availableClients}` : '\nNo real-device clients are available.'));
}
async function getLatestSession(connector, clientId) {
    const sessions = await connector.sendListSessionMessage(clientId);
    if (!sessions || 0 === sessions.length) throw new Error(`No available sessions found for client: ${clientId}`);
    const latestSession = sessions.reduce((max, session)=>Number(session.session_id) > Number(max.session_id) ? session : max);
    return String(latestSession.session_id);
}
async function resolveClient({ transports }, options) {
    const connector = new Connector(transports);
    if (options.client && options.clientName) throw new Error('Use either --client or --client-name, not both.');
    const clientId = options.client ?? (options.clientName ? await getClientByName(connector, options.clientName) : await getFirstClient(connector));
    return {
        connector,
        clientId
    };
}
async function resolveClientAndSession(context, options) {
    const { connector, clientId } = await resolveClient(context, options);
    const sessionId = options.session ?? await getLatestSession(connector, clientId);
    return {
        connector,
        clientId,
        sessionId
    };
}
function isAbortError(err) {
    return err instanceof Error && 'AbortError' === err.name;
}
function parseOnOff(input, optionName = '--status') {
    const normalized = input.trim().toLowerCase();
    if ('on' === normalized || 'true' === normalized || '1' === normalized) return true;
    if ('off' === normalized || 'false' === normalized || '0' === normalized) return false;
    throw new Error(`Invalid ${optionName} value: ${input}. Use on/off.`);
}
async function readOrTimeout(reader, idleMs) {
    const idleAbortController = new AbortController();
    const idle = promises_setTimeout(idleMs, 'timeout', {
        signal: idleAbortController.signal
    });
    try {
        return await Promise.race([
            reader.read(),
            idle
        ]);
    } finally{
        idleAbortController.abort();
        await idle.catch(()=>{});
    }
}
async function* readUntilIdle(stream, opts) {
    const reader = stream.getReader();
    const startTime = Date.now();
    let terminated = false;
    try {
        while(Date.now() - startTime < opts.maxMs){
            const result = await readOrTimeout(reader, opts.idleMs);
            if ('timeout' === result) {
                await reader.cancel();
                terminated = true;
                return;
            }
            const { done, value } = result;
            if (done) {
                terminated = true;
                return;
            }
            yield value;
        }
        await reader.cancel();
        terminated = true;
    } finally{
        if (!terminated) await reader.cancel().catch(()=>{});
        reader.releaseLock();
    }
}
var utils_buildWatchSignal = void 0;
var utils_getClientByName = void 0;
var utils_getFirstClient = void 0;
var utils_getLatestSession = void 0;
export { CLIENT_NAME_OPTION, CLIENT_OPTION, SESSION_OPTION, isAbortError, parseOnOff, readUntilIdle, resolveClient, resolveClientAndSession, utils_buildWatchSignal as buildWatchSignal, utils_getClientByName as getClientByName, utils_getFirstClient as getFirstClient, utils_getLatestSession as getLatestSession };
