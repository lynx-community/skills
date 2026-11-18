import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const DEFAULT_LYNX_LLMS_URL = 'https://lynxjs.org/next/llms.txt';
function getDefaultPluginRoot() {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    return "scripts" === basename(moduleDir) ? dirname(moduleDir) : moduleDir;
}
function readSkillNames(pluginRoot) {
    const skillsDir = resolve(pluginRoot, 'skills');
    if (!existsSync(skillsDir)) return [];
    return readdirSync(skillsDir, {
        withFileTypes: true
    }).filter((entry)=>entry.isDirectory()).map((entry)=>entry.name).filter((name)=>existsSync(resolve(skillsDir, name, 'SKILL.md'))).sort();
}
function formatMcpServer(name, server) {
    if (null == server || 'object' != typeof server) return name;
    const args = 'args' in server ? server.args : void 0;
    if (!Array.isArray(args)) return name;
    const packageArg = args.find((arg)=>'string' == typeof arg && arg.startsWith('@') && arg.includes('/'));
    return packageArg ? `${name} -> ${packageArg}` : name;
}
function readMcpServerNames(pluginRoot) {
    const mcpConfigPath = resolve(pluginRoot, '.mcp.json');
    if (!existsSync(mcpConfigPath)) return [];
    try {
        const config = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
        return Object.entries(config?.mcpServers ?? {}).map(([name, server])=>formatMcpServer(name, server)).sort();
    } catch  {
        return [];
    }
}
function readLynxPluginManifest(pluginRoot = getDefaultPluginRoot()) {
    return {
        skills: readSkillNames(pluginRoot),
        mcpServers: readMcpServerNames(pluginRoot)
    };
}
function formatManifestList(items) {
    return items.length > 0 ? items.join(', ') : 'none';
}
function createLynxStartupReminder(options = {}) {
    const llmsUrl = options.llmsUrl ?? DEFAULT_LYNX_LLMS_URL;
    const manifest = options.manifest ?? readLynxPluginManifest(options.pluginRoot);
    return [
        'Lynx development reminder:',
        'If the task involves a Lynx or ReactLynx project, switch out of the default Web/React-DOM mental model. Lynx uses Web-like syntax to author cross-platform UI, but it is a native rendering engine, not a browser or WebView.',
        "Key guardrails: there is no DOM/window/document; built-in elements such as view/text/image map to native controls; text must live in text elements. Layout is not CSS layout parity: elements are block-like by default, box-sizing is border-box, margin collapse is absent, inline/block toggles do not exist, scrolling uses scroll-view rather than overflow: scroll, and display modes include linear/flex/grid/relative with Lynx-specific behavior. CSS inheritance, events, refs, and JS/runtime APIs can also differ from the Web. ReactLynx runs with a main/background thread model, so use 'background only', 'main thread', and Lynx selector/ref APIs when the docs require them.",
        'Plugin scope manifest:',
        '- Startup context: injects this reminder and the Lynx llms.txt URL.',
        `- Skills: ${formatManifestList(manifest.skills)}.`,
        `- MCP servers: ${formatManifestList(manifest.mcpServers)}.`,
        'Before changing Lynx code, prefer Lynx docs and bundled skills over generic Web assumptions.',
        `Lynx llms.txt: ${llmsUrl}`
    ].join('\n');
}
export { DEFAULT_LYNX_LLMS_URL, createLynxStartupReminder, readLynxPluginManifest };
