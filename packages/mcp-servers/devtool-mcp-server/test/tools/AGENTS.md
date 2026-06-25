# MCP Tools 测试指南 (Testing Guidelines)

本文档旨在指导 AI Agent 和开发者如何为 `devtool-mcp-server` 中的工具编写测试用例。

## 1. 测试架构概览

为了提高测试效率并减少连接开销，所有的工具测试都合并在 `e2e/tools.test.ts` 中，共享同一个 `testWithClient` 会话。

我们提供了 `createToolContext` 辅助函数。它基于 `node:test` 框架，并在已有的连接中处理以下设置：

- **环境交互**: 提供 `openPage` 辅助函数。
- **上下文模拟**: 构造 `McpContext` 和 `McpResponse`。
- **参数注入**: 自动填充 `clientId` 和 `sessionId`。
- **结果解析**: 自动解析工具返回的 JSON 字符串。

## 2. 文件结构

- **源码**: `src/tools/<Domain>/<ToolName>.ts`
- **测试**: `e2e/tools.test.ts` (所有工具测试均在此文件中以 `t.test` 子测试形式存在)

## 3. 编写测试

在 `e2e/tools.test.ts` 的 `testWithClient` 块内添加一个新的 `t.test`。

### 基本模板

```typescript
import type { TestContext } from "node:test";
import { MyTool } from "../src/tools/MyDomain/MyTool.ts";
import { createToolContext } from "./utils/testTool.ts";

// 在 testWithClient 块内部：
await suite.test("MyDomain.myTool", async (t: TestContext) => {
  // 1. 创建工具上下文
  const { call, openPage } = createToolContext(MyTool, connector, clientId);

  // 2. (可选) 准备环境，例如打开特定页面
  // await openPage("https://www.example.com");

  // 3. 调用工具
  // call 函数会自动处理 clientId 和 sessionId (如果 schema 中有定义)
  const result = await call({
    // 在此传入工具特有的参数
    myParam: "value",
  });

  // 4. 断言结果
  // 如果工具返回 JSON 字符串，result 会是被自动 JSON.parse 后的对象
  t.assert.ok(result);
  t.assert.equal(result.someField, "expectedValue");
});
```

### `call` 函数特性

`call` 是测试的核心帮助函数，具有以下“魔法”：

1. **自动注入 `clientId`**: 如果工具的 Schema 定义了 `clientId` 字段且调用时未提供，会自动注入当前测试连接的 Client ID。
2. **自动注入 `sessionId`**: 如果工具的 Schema 定义了 `sessionId` 字段且调用时未提供，会自动调用 `ListSessions` 获取第一个会话的 ID 并注入。
3. **智能返回**:
   - 如果工具通过 `response.appendLines` 返回了 JSON 字符串，`call` 会返回解析后的 **JavaScript 对象**。
   - 如果返回普通文本，则返回字符串。
   - 如果返回包含图像等多模态内容，则返回完整的 `Content` 数组。

## 4. 运行测试

在 `devtool-mcp-server` 目录下：

```bash
# 运行工具测试
node --test e2e/tools.test.ts
```

## 5. 最佳实践

- **尽量少 Mock**: 我们的测试环境是真实的（连接到真实设备或模拟器），尽量测试真实的 CDP 交互。
- **关注 Schema**: 确保传入 `call` 的参数符合工具 Schema 的定义（除了自动注入的 ID）。
- **验证结构**: 对于返回大段 DOM 树或复杂对象的工具，通常验证根节点或关键字段的存在性即可，不必断言整个对象。
