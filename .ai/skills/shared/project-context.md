# 项目上下文（本仓库已填写）

本文件约束 `.ai/skills` 在**当前仓库**的落地方式。执行任一 Skill 前，必须先阅读本文件，并阅读：

```txt
.ai/skills/shared/incremental-scope-mode.md
```

复制到其他项目时：请改用 `project-context.template.md` 重新填写，不要原样照搬本文件中的路径与业务名。

---

## Skill 主流程顺序

```txt
Skill0 页面对象清单 → Skill1 页面逻辑审核 → Skill2 需求注册表 → Skill3 角标评审 → …
```

| Skill | 目录 | 作用 |
| --- | --- | --- |
| 0 | `00-page-object-inventory` | 锁「审什么」（全页 / 增量+连带） |
| 1 | `01-page-logic-auditor` | 只对必审（A∪B）出决策题 |
| 2+ | `02-…` 及之后 | 注册表、角标、PRD；以 Skill1 决策为准 |

落盘路径：

```txt
docs/prd-workflow/inventories/<页面或流程>.inventory.md
docs/prd-workflow/decisions/<页面或流程>.decision.md
docs/prd-workflow/change-scopes/<变更批次>.scope.md
docs/prd/<页面或流程>.prd.md
```

约束：

- 无已确认 Skill0 清单时，不要直接开始 Skill1 的 `1A2C3D` 输出。
- Skill0 只产出清单，不替代 decision 文件。
- 增量模式见 `incremental-scope-mode.md`：必审 = 直接变更 A ∪ 连带影响 B；C 不重审。

---

## 项目类型与技术栈

- 项目类型：**Next.js App Router 前端应用（含大量页面级业务原型逻辑）**
- 主要语言与框架：TypeScript、React 19、Next.js 16、Tailwind CSS、shadcn/ui
- 包管理与检查：`pnpm`；可用 `pnpm ts-check` / `pnpm lint`（按需，非强制每步都跑）

主要源码根目录：

```txt
src/app/
src/components/
src/data/
产品文档/          # 历史产品文档；默认不作为本 .ai 流程写作规范
```

---

## 如何读页面代码

- 路由方式：Next.js App Router 路径（如 `/knowledge-system`）
- 知识体系等大页多为单文件内多视图（首页 / 详情 / 弹窗），审核时按「页面范围 + 对象」定位，不要假设存在独立 `index.html` hash 原型。

| 路由或标识 | 页面/视图 | 主要文件 |
| --- | --- | --- |
| `/knowledge-system` | 知识体系管理（多 Tab） | `src/app/knowledge-system/page.tsx` |
| 通用知识树 | Tab：通用知识树 | `src/app/system-settings/KnowledgeTree.tsx` |
| 教材体系知识树 | Tab：教材体系知识树 | `src/app/system-settings/TextbookTree.tsx` |
| 教材体系知识树2 | Tab：教材体系知识树2 | `src/app/system-settings/TextbookTree2.tsx` |
| 专题体系知识树 | Tab：专题体系知识树 | `src/app/system-settings/TopicSystem.tsx` |
| `/adaptive-strategy` 等 | 策略相关 | `src/app/adaptive-strategy/**` |

读取顺序建议：用户给定的页面范围 → 对应 `page.tsx` / 大组件 → 相关 shared 组件与 `src/data/prd-rules/*`（若有）。

---

## 需求注册表落地路径

本仓库若尚未建立 `js/requirements` 静态原型注册表，按下面约定**择一落地**（执行 Skill2 前与用户确认实际目录）：

**优先（与当前 Next 工程对齐，推荐）：**

```txt
src/data/requirements/schema.ts
src/data/requirements/<页面或流程>.registry.ts
src/data/requirements/index.ts
```

**兼容（若项目坚持沿用 skill 原文静态原型结构）：**

```txt
js/requirements/schema.js
js/requirements/<页面或流程>.registry.js
js/requirements/index.js
```

- 字段语义（`id`、`anchorId`、`logicSections`、`activate` 等）保持 Skill 约定。
- 用户可见业务逻辑唯一来源：`logicSections`。

---

## 角标 / 悬浮面板 / PRD 面板

若本仓库已有 React 侧实现（如 `DocPanel` / `PrdTooltip` 等），Skill3/4 落地时优先复用现有组件，路径以当轮与用户确认为准。  
若无现成运行时，可先完成 Skill0–2 与 Markdown PRD（Skill5），角标运行时后置。

锚点约定：优先 `data-req-anchor="<anchorId>"`（或项目既有等价属性）。

---

## activate / 路由约定

| type | 本项目含义 |
| --- | --- |
| `navigate` | 跳转 App Router 路径或页内视图状态 |
| `openDialog` / `openPanel` | 打开已有弹窗/面板 |
| `setTab` | 切换页内 Tab（含知识体系 Tab、详情 Tab） |
| `scrollTo` / `highlight` | 滚动或高亮锚点 |

---

## 验证方式

1. 本地：`pnpm next dev --webpack --port 5000`，浏览器打开对应路由。
2. 抽查目标页交互与（若有）需求角标/面板。
3. 按需：`pnpm ts-check` 或对改动文件做类型/语法检查。

---

## 文档与旧模板策略

- 本流程产出：`docs/prd-workflow/**`、`docs/prd/**`
- **默认忽略**仓库内历史整页 PRD 写法，包括但不限于：
  - `产品文档/5-PRD编写模板/PRD-模板.md`
  - `产品文档/2-单页PRD/**` 的整页重写义务  
  除非用户当轮明确要求沿用或对照。
- 业务逻辑审核与编写以 `.ai` Skill + `incremental-scope-mode.md` 为准。

---

## 禁止事项

- 不要假设本仓库是「仅静态 `index.html` + hash 路由、禁止按 Next.js 读取」的旧原型约定。
- 不要把其他产品线（作业管理、AI 小乐等）业务示例当作本项目默认对象。
- 不要在增量模式下对 C 类（无影响）对象重审或改写既有业务口径。
- 不要把具体某次需求（如某一字段名）写进通用 Skill 正文；实例只出现在当轮清单/决策/scope 文件中。
