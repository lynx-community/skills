const DevNodeType = {
    Group: 0,
    Element: 1,
    ClassComponent: 2,
    FunctionComponent: 3,
    ForwardRef: 4,
    Memo: 5,
    Suspense: 6,
    Context: 7,
    Consumer: 8,
    Portal: 9
};
const MsgType = {
    ADD_ROOT: 1,
    ADD_VNODE: 2,
    REMOVE_VNODE: 3,
    UPDATE_VNODE_TIMINGS: 4,
    REORDER_CHILDREN: 5,
    RENDER_REASON: 6,
    COMMIT_STATS: 7,
    HOC_NODES: 8
};
function createRendererState() {
    return {
        tree: new Map(),
        roots: []
    };
}
function parseStringTable(slice) {
    const len = slice[0];
    const strings = [];
    if (len > 0) for(let i = 1; i < len; i++){
        const strLen = slice[i];
        let start = i + 1;
        const end = i + strLen + 1;
        let str = '';
        for(; start < end; start++){
            const code = slice[start];
            if ('number' == typeof code && code >= 0 && code <= 0x10ffff) str += String.fromCodePoint(code);
            else str += '?';
        }
        strings.push(str);
        i += strLen;
    }
    return strings;
}
function applyOperationV2(state, ops) {
    const { tree, roots } = state;
    let i = ops[1] + 1;
    const strings = parseStringTable(ops.slice(1, i + 1));
    for(i += 1; i < ops.length; i++)switch(ops[i]){
        case MsgType.ADD_ROOT:
            {
                const rootId = ops[i + 1];
                if (!roots.includes(rootId)) roots.push(rootId);
                i += 1;
                break;
            }
        case MsgType.ADD_VNODE:
            {
                const id = ops[i + 1];
                const type = ops[i + 2];
                const parentId = ops[i + 3];
                const owner = ops[i + 4];
                const nameId = ops[i + 5];
                const keyId = ops[i + 6];
                const startTime = ops[i + 7] / 1000;
                const endTime = ops[i + 8] / 1000;
                const parent = tree.get(parentId);
                if (parent) parent.children.push(id);
                tree.set(id, {
                    id,
                    type,
                    name: strings[nameId - 1] ?? '',
                    key: keyId > 0 ? strings[keyId - 1] ?? '' : '',
                    parent: parentId,
                    owner,
                    children: [],
                    startTime,
                    endTime
                });
                i += 8;
                break;
            }
        case MsgType.UPDATE_VNODE_TIMINGS:
            {
                const id = ops[i + 1];
                const node = tree.get(id);
                if (node) {
                    node.startTime = ops[i + 2] / 1000;
                    node.endTime = ops[i + 3] / 1000;
                }
                i += 3;
                break;
            }
        case MsgType.REMOVE_VNODE:
            {
                const unmounts = ops[i + 1];
                i += 2;
                const len = i + unmounts;
                for(; i < len; i++){
                    const nodeId = ops[i];
                    const node = tree.get(nodeId);
                    if (!node) continue;
                    const parent = tree.get(node.parent);
                    if (parent) {
                        const idx = parent.children.indexOf(nodeId);
                        if (idx > -1) parent.children.splice(idx, 1);
                    }
                    const stack = [
                        nodeId
                    ];
                    while(stack.length){
                        const cur = stack.pop();
                        const cnode = tree.get(cur);
                        if (!cnode) continue;
                        tree.delete(cur);
                        stack.push(...cnode.children);
                    }
                    const rIdx = roots.indexOf(nodeId);
                    if (rIdx > -1) roots.splice(rIdx, 1);
                }
                if (len > 0) i--;
                break;
            }
        case MsgType.REORDER_CHILDREN:
            {
                const parentId = ops[i + 1];
                const count = ops[i + 2];
                const node = tree.get(parentId);
                if (node) node.children = ops.slice(i + 3, i + 3 + count);
                i = i + 2 + count;
                break;
            }
        case MsgType.RENDER_REASON:
            {
                const count = ops[i + 3];
                i = i + 3 + count;
                break;
            }
        case MsgType.COMMIT_STATS:
            throw new Error('operation_v2 commit-stats not implemented; enable stats parsing if needed');
        case MsgType.HOC_NODES:
            {
                const count = ops[i + 2];
                i = i + 2 + count;
                break;
            }
        default:
            throw new Error(`Unknown operation_v2 op ${ops[i]} at index ${i}`);
    }
}
function applyRootOrder(state, rootOrder) {
    state.roots = [
        ...rootOrder
    ];
}
function typeTag(type) {
    switch(type){
        case DevNodeType.FunctionComponent:
            return 'fn';
        case DevNodeType.ClassComponent:
            return 'cls';
        case DevNodeType.ForwardRef:
            return 'fRef';
        case DevNodeType.Memo:
            return 'memo';
        case DevNodeType.Suspense:
            return 'susp';
        case DevNodeType.Context:
            return 'ctx';
        case DevNodeType.Consumer:
            return 'cons';
        case DevNodeType.Portal:
            return 'portal';
        case DevNodeType.Element:
            return 'host';
        case DevNodeType.Group:
            return 'group';
        default:
            return '?';
    }
}
var protocol_DevNodeType = void 0;
export { applyOperationV2, applyRootOrder, createRendererState, protocol_DevNodeType as DevNodeType, typeTag };
