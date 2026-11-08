---
name: lynx-tasm-codec
description: |
  通过 `agent-lynx tasm` 在模板 JSON 与 tasm 二进制之间进行转换（编码、解码）。

  触发场景：
  - 用户明确提到 `agent-lynx tasm`、`lynx-tasm`、`@lynx-js/tasm`、`encode/decode tasm`、`json 转 tasm`、`tasm 转 json`、`反编译/解码 tasm`
  - 用户要求指定某个 `@lynx-js/tasm` 版本执行，或明确要求使用 CLI 而不是 Node API
  - agent 在处理中自行发现需要读取、生成、回写、对比 `.tasm` 文件，或需要把 `.json` 和 `.tasm` 互转
  - agent 在排查与 tasm 相关的常见问题，例如模板二进制无法直接查看、需要把 `.tasm` 解码后分析、需要重新编码验证修改结果、怀疑不同 tasm 版本导致产物差异、需要确认输入文件到底是 JSON 还是 tasm
---

# Lynx TASM CLI

用这个 skill 处理通过 CLI 执行的 TASM 编码/解码任务，不要改写成 Node API 方案，除非用户明确要求。

`agent-lynx` 的 `tasm` 子命令调用 `@lynx-js/tasm`。

## 何时使用

当用户要做以下任一事项时，使用本 skill：

- 把模板 JSON 编码成 `.tasm`
- 把 `.tasm` 解码回 JSON
- 指定某个 `@lynx-js/tasm` 版本执行转换
- 希望直接给出或执行 `agent-lynx tasm` 命令

如果用户没有直接提到 `lynx-tasm`，但 agent 在任务中发现以下问题，也应主动使用本 skill：

- 仓库里已有 `.tasm` 文件，需要读懂其内容
- 修改了模板 JSON，需要重新产出 `.tasm`
- 需要比较两个 `.tasm` 产物的真实差异，先解码成 JSON 更合适
- 怀疑不同 `@lynx-js/tasm` 版本导致编码结果不同
- 报错信息显示当前输入文件类型和执行子命令可能不匹配

## 默认策略

优先按下面顺序选择执行方式：

1. 默认使用 `agent-lynx tasm`
2. 用户要求指定版本时，使用 `agent-lynx tasm --codec-version <version>`
3. 只有用户明确要求全局安装时，才使用 `npm i -g`

不要默认建议全局安装，也不要把依赖写入项目。

## 命令格式

`agent-lynx tasm` 支持两个子命令：

- `encode`: JSON -> tasm
- `decode`: tasm -> JSON

本 skill 不要求单独安装 TASM，直接使用 `agent-lynx tasm` 执行：

```bash
agent-lynx tasm encode -i <input.json> -o <output.tasm>
agent-lynx tasm decode -i <input.tasm> -o <output.json>
```

始终显式传入输入输出参数 `-i` 和 `-o`。

如果用户指定版本，使用 `--codec-version`；只接受精确版本，不接受 `latest` 或范围：

```bash
agent-lynx tasm --codec-version <version> encode -i <input.json> -o <output.tasm>
agent-lynx tasm --codec-version <version> decode -i <input.tasm> -o <output.json>
```

用户明确要求全局命令时，安装 `agent-lynx` 后仍使用同一子命令：

```bash
agent-lynx tasm encode -i <input.json> -o <output.tasm>
agent-lynx tasm decode -i <input.tasm> -o <output.json>
```

## 工作流

按这个顺序执行：

1. 先判断用户要 `encode` 还是 `decode`
2. 确认输入文件和输出文件路径
3. 优先使用绝对路径；如果用户给的是相对路径，基于当前工作目录解释
4. 选择最小影响的执行方式
5. 执行命令，并保留原始报错
6. 成功后明确告知输出文件路径

如果输入或输出路径缺失，不要猜测文件名；先补齐路径再执行。

## 如何找到正确输入

在执行前，先判断当前任务是 `encode` 还是 `decode`，再找对应类型的输入文件。

### `encode`

`encode` 的输入必须是 JSON。优先按下面顺序找：

1. 用户在请求里直接给出的 JSON 文件路径
2. 当前任务上下文里刚生成、刚修改、或明确提到的模板 JSON 文件
3. 与目标输出文件同目录、同名或近似命名的 `.json` 文件

执行前要确认：

- 输入文件扩展名和内容都符合 JSON
- 文件确实存在
- 如果仓库里有多个候选 JSON，不要自行猜测，优先选和当前修改链路最接近的那个，仍不明确时再向用户确认

### `decode`

`decode` 的输入必须是 `.js` 或者 `.bundle` 文件。优先按下面顺序找：

1. 用户在请求里直接给出的 `.js` 或者 `.bundle` 文件路径
2. 当前任务上下文里需要分析、比较、反编译的 `.js` 或者 `.bundle` 产物
3. 构建产物目录、临时目录、或用户提到的发布包中的目标 `.js` 或者 `.bundle` 文件

执行前要确认：

- 输入文件是要分析的目标 `.js` 或者 `.bundle`，不是其他中间产物
- 文件确实存在
- 如果有多个 `.js` 或者 `.bundle` 候选，优先选择最新生成、名称最匹配、或与当前问题最直接相关的那个

### 通用规则

- 能用绝对路径就用绝对路径
- 如果用户给的是相对路径，按当前工作目录解释
- 不要只靠文件名猜类型；必要时结合扩展名、上下文和文件来源一起判断
- 找不到唯一输入时，不要盲试多个文件；先缩小候选，再执行

## 安装与版本选择

统一使用 `agent-lynx tasm`，由 CLI 按需下载并缓存 TASM，不要推荐项目内安装。

使用独立 CLI 时，先用 `command -v agent-lynx` 检查入口。若未找到命令，将命令中的 `agent-lynx` 替换为 `npx --yes --registry https://registry.npmjs.org agent-lynx`，保留后面的子命令和参数。例如：

```bash
npx --yes --registry https://registry.npmjs.org agent-lynx tasm --help
```

默认方式：

```bash
agent-lynx tasm --help
```

全局安装，仅在用户明确要求时：

```bash
npm i -g agent-lynx --registry https://registry.npmjs.org
agent-lynx tasm --help
```

如果只是验证命令可用性，优先执行 `agent-lynx tasm --help`，不要先做全局安装。

## 常见排查

- 报错缺少 `--input` 或 `--output`
  说明命令参数不完整，补全 `-i` 和 `-o`
- 报错输入文件不存在
  先检查路径，再检查当前工作目录，必要时改用绝对路径
- `encode` 时报 JSON parse 失败
  输入文件不是合法 JSON，先修正 JSON 再编码
- `decode` 或 `encode` 时报格式错误
  通常是子命令和输入文件类型不匹配：`encode` 读 JSON，`decode` 读 `.tasm`
- 用户要求固定版本复现问题
  使用 `agent-lynx tasm --codec-version <version>`，不要用未固定版本的全局命令

## 示例

```bash
# 编码
agent-lynx tasm encode \
  -i /abs/path/input.json \
  -o /abs/path/output.tasm

# 解码
agent-lynx tasm decode \
  -i /abs/path/output.tasm \
  -o /abs/path/output.json
```
