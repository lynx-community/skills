# Connector 架构与开发约束

Connector 为上层 MCP Server 和 Agent Lynx 提供设备发现、CDP、App 和会话请求接口。初始化和调用示例见 [包 README](../README.md)。

## 默认连接模型

- 默认使用 `DaemonTransport`。daemon 持有到设备目标的持久物理连接，通过虚拟连接复用给多个调用方。
- 单次请求仍需完成发送、响应匹配和清理；请求结束不等于关闭 daemon 持有的物理连接。不要把新 API 实现为每次请求都重新建立设备连接。
- DebugRouter 的同一调试端口只允许一个活跃物理连接。daemon 可能仍持有连接时，不得为同一目标另建 direct 连接。
- Direct transport 用于明确选择的直连模式或允许的发现回退。保留 `Connector.listClients()` 的选择规则：daemon 成功返回时使用其结果（即使为空）；daemon lifecycle 错误直接抛出；其余发现失败才依次尝试 HDT 和 direct transports。

## 按任务定位代码

- 请求发现、路由或响应匹配：`index.ts`、`client-id.ts`。
- daemon 生命周期与复用：`daemon/manager.ts`、`daemon/server.ts`、`daemon/device-connection.ts`。
- 具体平台连接：`transport/`，并遵循该目录更具体的 `AGENTS.md`。
- Peertalk 和消息转换：`transport/peertalk.ts`、`streams/`、`types.ts`。
- 上层命令和交互：`command/`。

无需为局部修改遍历所有入口；沿实际调用路径读取。

## 标识与生命周期

- `Device` 是传输层发现的设备；`Client` 是其上的 DebugRouter 目标；`Session` 是客户端中的页面或视图会话。
- 使用发现结果返回的 `clientId` 和 `session_id`，不手工拼接 ID 或假设固定格式。内部编解码统一使用 `client-id.ts`。
- 发现结果是当时的快照；持久连接不保证客户端或页面一直存在。目标关闭、断连和请求取消都需要明确结束等待并清理订阅。
- 将连接建立超时与请求、共享连接的存活期分开。遵循 [Transport 生命周期约束](transport/AGENTS.md)，请求取消不能意外终止其他调用方复用的连接。
- 新增 Transport 时实现 `transport/transport.ts` 的接口，并在实际使用它的入口配置中接入。清理必须释放该层拥有的资源，并保留原始请求错误。

调试使用 `DEBUG=devtool-mcp-server:connector*`；daemon 问题使用 `DEBUG=devtool-mcp-server:daemon*`。按变更选择 `test/` 中的请求、transport 或 daemon 测试；设备测试只在明确配置目标和测试环境后运行；纯代码修改不自动触发设备租赁或完整 E2E。
