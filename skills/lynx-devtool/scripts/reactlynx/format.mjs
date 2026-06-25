import { typeTag } from "./protocol.mjs";
const PIPE = '│  ';
const TEE = '├─ ';
const ELBOW = '└─ ';
const SPACE = '   ';
const SHELL_NAMES = new Set([
    'Fragment',
    'Root',
    'Anonymous'
]);
function isShell(node) {
    return SHELL_NAMES.has(node.name);
}
function visibleChildren(ctx, node) {
    const out = [];
    for (const cid of node.children){
        const child = ctx.state.tree.get(cid);
        if (child) if (ctx.hideShells && isShell(child)) out.push(...visibleChildren(ctx, child));
        else out.push(child);
    }
    return out;
}
function formatRef(ctx, node) {
    const label = ctx.labelOf.get(node.id) ?? '@c?';
    let out = `${label} [${typeTag(node.type)}] ${node.name}`;
    if (node.key) out += ` key=${node.key}`;
    return out;
}
function walk(ctx, node, prefix, isLast, isRoot, depth) {
    const connector = isRoot ? '' : isLast ? ELBOW : TEE;
    ctx.lines.push(`${prefix}${connector}${formatRef(ctx, node)}`);
    if (depth >= ctx.maxDepth) return;
    const children = visibleChildren(ctx, node);
    const childPrefix = isRoot ? '' : prefix + (isLast ? SPACE : PIPE);
    children.forEach((child, idx)=>{
        walk(ctx, child, childPrefix, idx === children.length - 1, false, depth + 1);
    });
}
function formatTree(state, options = {}) {
    const ctx = {
        state,
        labels: [],
        labelOf: new Map(),
        maxDepth: options.maxDepth ?? 1 / 0,
        lines: [],
        hideShells: options.hideShells ?? true
    };
    const visibleRoots = [];
    for (const rootId of state.roots){
        const root = state.tree.get(rootId);
        if (root) if (ctx.hideShells && isShell(root)) visibleRoots.push(...visibleChildren(ctx, root));
        else visibleRoots.push(root);
    }
    function assign(node, depth) {
        ctx.labels.push(node.id);
        ctx.labelOf.set(node.id, `@c${ctx.labels.length}`);
        if (depth >= ctx.maxDepth) return;
        for (const c of visibleChildren(ctx, node))assign(c, depth + 1);
    }
    for (const r of visibleRoots)assign(r, 1);
    visibleRoots.forEach((root, idx)=>{
        walk(ctx, root, '', idx === visibleRoots.length - 1, true, 1);
    });
    return {
        text: ctx.lines.join('\n'),
        labels: ctx.labels
    };
}
export { formatTree };
