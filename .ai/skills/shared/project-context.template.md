# 项目上下文模板（复制到新项目时使用）

> 使用方式：把本文件复制为同目录下的 `project-context.md`，按目标项目填写占位符。  
> Skill 执行时只读 `project-context.md`，不读本 template。  
> 流程类规则（增量 A/B/C）在 `incremental-scope-mode.md`，**不要**写进本文件的业务特例里。

本文件约束 `.ai/skills` 在**当前仓库**的落地方式。执行任一 Skill 前，必须先阅读已填写的 `project-context.md`。

---

## Skill 主流程顺序

```txt
Skill0 页面对象清单 → Skill1 页面逻辑审核 → Skill2 需求注册表 → Skill3 角标评审 → …
```

| Skill | 目录 | 作用 |
| --- | --- | --- |
| 0 | `00-page-object-inventory` | 锁「审什么」（含全页 / 增量+连带） |
| 1 | `01-page-logic-auditor` | 只对必审对象出决策题 |
| 2+ | `02-…` 及之后 | 注册表、角标、PRD；输入以 Skill1 决策为准 |

清单 / 决策 / 变更范围建议路径（可按项目改名，但需在本文件写清）：

```txt
docs/prd-workflow/inventories/<页面或流程>.inventory.md
docs/prd-workflow/decisions/<页面或流程>.decision.md
docs/prd-workflow/change-scopes/<变更批次>.scope.md
docs/prd/<页面或流程>.prd.md
```

约束：

- 无已确认 Skill0 清单时，不要直接开始 Skill1 的 `1A2C3D` 输出。
- 增量模式规则见：`.ai/skills/shared/incremental-scope-mode.md`

---

## 项目类型与技术栈（必填）

- 项目类型：`<例如：静态 HTML 原型 / Next.js App Router / 其他>`
- 主要语言与框架：`<…>`
- 包管理与常用检查命令：`<例如 pnpm lint；无则写「无」>`

主要入口与源码根目录：

```txt
<例如：index.html + js/  或  src/app/ >
```

---

## 如何读页面代码（必填）

说明 Agent 审核时应优先打开的文件类型与路由方式：

- 路由方式：`<hash / App Router path / 其他>`
- 页面/视图对照表（示例行可增删）：

| 路由或标识 | 页面/视图 | 主要文件 |
| --- | --- | --- |
| `<#home 或 /foo>` | `<名称>` | `<path>` |

---

## 需求注册表落地路径（必填）

```txt
<path/to/schema>
<path/to/<页面>.registry>
<path/to/index>
```

- 文件格式：`<JS+JSDoc / TS / 其他>`
- 字段语义（`id`、`anchorId`、`logicSections`、`activate` 等）保持 Skill 约定，不因技术栈改名。

---

## 角标 / 悬浮面板 / PRD 面板路径（按项目有则填）

```txt
<path/to/prd-runtime>
```

锚点约定：`<例如 data-req-anchor>`

---

## activate / 路由字段约定（按项目有则填）

| type | 本项目含义 |
| --- | --- |
| `navigate` | `<…>` |
| `openDialog` | `<…>` |
| `setTab` | `<…>` |
| … | … |

---

## 验证方式（必填）

1. `<如何本地打开页面>`
2. `<如何抽查角标/面板（若有）>`
3. `<语法或类型检查命令；无则写「无强制命令」>`

---

## 文档与旧模板策略（建议填写）

- 本流程产出的 PRD / 决策路径：见上文
- 是否忽略仓库内历史「整页 PRD 编写模板」：**默认忽略**（与 `incremental-scope-mode.md` 一致），除非用户当轮要求沿用
- 历史模板路径（若存在，仅作说明）：`<path 或「无」>`

---

## 禁止事项（按项目填写）

列出**不要**当作本项目默认前提的技术或业务假设，例如错误的技术栈、其他产品线的业务示例等。
