# 需求注册表字段规范

本文件定义 `js/requirements/schema.js` 和各页面 `*.registry.js` 的字段。除代码字段名外，说明文字优先使用中文。

落地前先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
```

本项目用 **JavaScript + JSDoc** 描述结构，不生成 TypeScript `.ts` 文件。

需求注册表记录的是“完整页面业务逻辑”，不是“已确认问题列表”，也不是“当前前端实现说明书”。  
用户可见业务逻辑正文以 `logicSections` 为唯一来源。

## 总体结构

每个页面或流程生成一个 `RequirementRegistry`：

```js
/**
 * @typedef {Object} RequirementRegistry
 * @property {string} registryId
 * @property {string} pageName
 * @property {string} route
 * @property {string} module
 * @property {string} description
 * @property {string} sourceDecisionFile
 * @property {string[]} relatedFiles
 * @property {RequirementItem[]} requirements
 * @property {ExcludedDecision[]} excludedDecisions
 */
```

## RequirementRegistry 字段

| 字段名 | 中文名称 | 是否必填 | 用途 | 后续使用方 |
| --- | --- | --- | --- | --- |
| `registryId` | 注册表编号 | 是 | 标识当前页面或流程的需求注册表，例如 `chapter-course` | Skill3、Skill4、Skill5 |
| `pageName` | 页面名称 | 是 | 页面、组件或流程的人类可读名称 | Skill3、Skill4、Skill5 |
| `route` | 页面路由/视图标识 | 是 | hash 或视图标识；例如 `#chapter`，或 `view:view-kp-lecture` | Skill3、Skill4、Skill5 |
| `module` | 所属业务模块 | 是 | 用于右侧 PRD 面板和 Markdown PRD 分组 | Skill3、Skill4、Skill5 |
| `description` | 注册表说明 | 是 | 简述本注册表覆盖的页面范围和业务边界 | Skill4、Skill5 |
| `sourceDecisionFile` | 来源决策文件 | 是 | 追溯来自哪个 `.decision.md` | Skill2、Skill5 |
| `relatedFiles` | 相关代码文件 | 是 | 标识与页面逻辑相关的代码文件 | Skill2、Skill3、Skill5 |
| `requirements` | 需求项列表 | 是 | 进入页面角标、右侧 PRD 面板、Markdown PRD 的需求项 | Skill3、Skill4、Skill5 |
| `excludedDecisions` | 未纳入需求卡片的决策 | 是 | 记录本次不改、不属于当前范围、已上线无需处理等边界决策 | Skill5 |

## RequirementItem 字段

```js
/**
 * @typedef {Object} RequirementItem
 * @property {string} id
 * @property {string} title
 * @property {RequirementSourceType} sourceType
 * @property {RequirementObjectType} objectType
 * @property {string} objectName
 * @property {string} module
 * @property {string} pageName
 * @property {string} route
 * @property {string} anchorId
 * @property {AnchorStatus} anchorStatus
 * @property {ActivationStep[]} activate
 * @property {LogicSection[]} logicSections
 * @property {string[]} acceptance
 * @property {RequirementSource} source
 */
```

| 字段名 | 中文名称 | 是否必填 | 用途 | 后续使用方 |
| --- | --- | --- | --- | --- |
| `id` | 需求编号 | 是 | 稳定引用编号，例如 `CHAPTER_COURSE-001` | Skill3、Skill4、Skill5 |
| `title` | 需求标题 | 是 | 右侧 PRD 列表和 Markdown PRD 标题 | Skill3、Skill4、Skill5 |
| `sourceType` | 来源类型 | 是 | 区分需求主要来自代码、决策或二者合并 | Skill2、Skill3、Skill4、Skill5 |
| `objectType` | 对象类型 | 是 | 标识需求对应对象 | Skill3、Skill4、Skill5 |
| `objectName` | 对象名称 | 是 | 页面上的具体对象名称 | Skill3、Skill4、Skill5 |
| `module` | 所属模块 | 是 | 用于分组展示 | Skill3、Skill4、Skill5 |
| `pageName` | 页面名称 | 是 | 所属页面/流程名称 | Skill3、Skill4、Skill5 |
| `route` | 页面路由/视图标识 | 是 | 页面跳转或视图定位依据 | Skill3、Skill4、Skill5 |
| `anchorId` | 页面锚点编号 | 是 | 对应 `data-req-anchor` | Skill3、Skill4 |
| `anchorStatus` | 锚点状态 | 是 | `implemented` / `planned` | Skill3、Skill4 |
| `activate` | 激活路径 | 是 | 点击右侧需求时打开正确页面状态 | Skill4 |
| `logicSections` | 业务逻辑分组 | 是 | **用户可见业务逻辑的唯一来源** | Skill3、Skill4、Skill5 |
| `acceptance` | 验收标准 | 是 | 用于验证需求是否实现 | Skill5 |
| `source` | 来源信息 | 是 | 追溯决策与代码文件 | Skill2、Skill5 |

### 已废弃的用户正文结构

不要再把 `display`、`operation`、`permission`、`dataFlow`、`exceptions` 作为用户可见正文主结构。  
不要为凑这些旧字段生成「无额外权限限制」等空兜底说明。

若旧注册表仍残留这些字段，Skill3/4/5 **默认忽略**，只读 `logicSections`。

## LogicSection 字段

```js
/**
 * @typedef {Object} LogicSection
 * @property {string} title 一级标题，由规则归类产生
 * @property {string[]} items 该标题下的业务规则条目
 */
```

| 字段名 | 中文名称 | 是否必填 | 用途 | 后续使用方 |
| --- | --- | --- | --- | --- |
| `title` | 一级标题 | 是 | 准确概括本组规则的业务性质 | Skill3、Skill4、Skill5 |
| `items` | 规则条目 | 是 | 每条一个可验收业务事实；不能为空数组 | Skill3、Skill4、Skill5 |

生成 `logicSections` 时必须遵循：

```txt
.ai/skills/shared/logic-writing-spec.md
```

要点：

1. 先收集规则（代码 + Skill1 决策 + 合理延伸），再归类开标题  
2. 有规则才生成对应 section；无规则不开 section  
3. 一条规则只进入一个 section  
4. `items` 内不要手写多层编号前缀；展示时由面板/PRD 使用单层 `1.1`、`1.2`  
5. 禁止固定套用「显示说明 + 操作说明」两段式

## 规则素材收集规则

生成每条需求的 `logicSections` 前，必须收集：

### A. 代码已体现

从页面代码提取可见对象与已实现交互，用于识别“对象是什么、页面露出了什么”。包括：

- 标题、文案、按钮、Tab、弹窗、空状态、禁用态
- 已实现的切换、跳转、打开关闭行为
- 已展示的数据与条件显示

### B. Skill1 已确认

从 `.decision.md` 读取已拍板口径，作为硬约束写入规则。

### C. 合理延伸

基于 A+B，补齐该类对象通常必须定清的边界，例如：

- 统计周期、纳入/排除
- 生成触发与不触发生成
- 快照是否回刷
- 转班、重批、历史入口跳转等与主口径直接相关的场景

**禁止只写 A。** 页面可以很简单，`logicSections` 仍应写全应有业务规则。

## 代码事实与决策合并规则

1. 同一对象优先合并为一条需求。  
2. 只有代码清晰、无 Skill1 提问时，仍可生成需求，但 `logicSections` 仍需做合理延伸（拿不准回 Skill1）。  
3. 决策补充了代码未体现、但需要进入 PRD 的规则时，必须写入 `logicSections`。  
4. “本次不改 / 不属于当前页面”写入 `excludedDecisions`，不进 `requirements`。  
5. 不要对同一对象生成重复需求。

## 枚举字段

```js
/**
 * @typedef {'field'|'copy'|'button'|'region'|'dialog'|'panel'|'tab'|'step'|'state'|'data'} RequirementObjectType
 * @typedef {'implemented'|'planned'} AnchorStatus
 * @typedef {'code'|'decision'|'code+decision'} RequirementSourceType
 */
```

中文含义：

- `field`：字段
- `copy`：文案
- `button`：按钮
- `region`：区域
- `dialog`：弹窗
- `panel`：面板
- `tab`：Tab
- `step`：步骤
- `state`：状态
- `data`：数据展示或数据流转对象

来源类型：

- `code`：主要来自代码事实
- `decision`：主要来自已确认决策
- `code+decision`：代码基础 + 决策补充

说明：`sourceType` 只标记需求项整体来源倾向；`logicSections` 内部仍可同时包含代码、决策与延伸规则。

## ActivationStep 字段

```js
/**
 * @typedef {Object} ActivationStep
 * @property {'navigate'|'openPanel'|'openDialog'|'setStep'|'setTab'|'scrollTo'|'highlight'} type
 * @property {string} label
 * @property {string} [to]
 * @property {string} [panel]
 * @property {string} [dialog]
 * @property {string} [step]
 * @property {string} [tab]
 * @property {string} [anchorId]
 */
```

| 字段名 | 中文名称 | 用途 | 后续使用方 |
| --- | --- | --- | --- |
| `type` | 激活动作类型 | 标识要执行的动作 | Skill4 |
| `label` | 动作说明 | 给人读的动作解释 | Skill4、Skill5 |
| `to` | 目标 hash/视图 | `navigate` 使用 | Skill4 |
| `panel` | 面板标识 | `openPanel` 使用 | Skill4 |
| `dialog` | 弹窗标识 | `openDialog` 使用 | Skill4 |
| `step` | 步骤标识 | `setStep` 使用 | Skill4 |
| `tab` | Tab 标识 | `setTab` 使用 | Skill4 |
| `anchorId` | 锚点编号 | `scrollTo` / `highlight` 使用 | Skill4 |

## RequirementSource 字段

| 字段名 | 中文名称 | 是否必填 | 用途 | 后续使用方 |
| --- | --- | --- | --- | --- |
| `decisionFile` | 决策文件 | 是 | 追溯需求来源 | Skill2、Skill5 |
| `decisionObject` | 决策对象 | 是 | 对应 `.decision.md` 中的对象名称 | Skill2、Skill5 |
| `relatedFiles` | 相关代码文件 | 是 | 追溯影响代码 | Skill2、Skill3、Skill4、Skill5 |

## ExcludedDecision 字段

| 字段名 | 中文名称 | 是否必填 | 用途 | 后续使用方 |
| --- | --- | --- | --- | --- |
| `objectName` | 对象名称 | 是 | 哪个对象未纳入需求卡片 | Skill5 |
| `reason` | 未纳入原因 | 是 | 例如“已上线能力，本次不改” | Skill5 |
| `sourceDecision` | 来源决策 | 是 | 摘录或概括来源决策结论 | Skill5 |

## schema.js 推荐模板

```js
/**
 * 需求注册表结构定义
 * 用户可见业务逻辑正文以 logicSections 为唯一来源。
 *
 * @typedef {'field'|'copy'|'button'|'region'|'dialog'|'panel'|'tab'|'step'|'state'|'data'} RequirementObjectType
 * @typedef {'implemented'|'planned'} AnchorStatus
 * @typedef {'code'|'decision'|'code+decision'} RequirementSourceType
 *
 * @typedef {Object} ActivationStep
 * @property {'navigate'|'openPanel'|'openDialog'|'setStep'|'setTab'|'scrollTo'|'highlight'} type
 * @property {string} label
 * @property {string} [to]
 * @property {string} [panel]
 * @property {string} [dialog]
 * @property {string} [step]
 * @property {string} [tab]
 * @property {string} [anchorId]
 *
 * @typedef {Object} LogicSection
 * @property {string} title 一级标题；由规则归类产生；使用方：Skill3、Skill4、Skill5
 * @property {string[]} items 业务规则条目；每条一个可验收事实
 *
 * @typedef {Object} RequirementSource
 * @property {string} decisionFile
 * @property {string} decisionObject
 * @property {string[]} relatedFiles
 *
 * @typedef {Object} RequirementItem
 * @property {string} id
 * @property {string} title
 * @property {RequirementSourceType} sourceType
 * @property {RequirementObjectType} objectType
 * @property {string} objectName
 * @property {string} module
 * @property {string} pageName
 * @property {string} route
 * @property {string} anchorId
 * @property {AnchorStatus} anchorStatus
 * @property {ActivationStep[]} activate
 * @property {LogicSection[]} logicSections
 * @property {string[]} acceptance
 * @property {RequirementSource} source
 *
 * @typedef {Object} ExcludedDecision
 * @property {string} objectName
 * @property {string} reason
 * @property {string} sourceDecision
 *
 * @typedef {Object} RequirementRegistry
 * @property {string} registryId
 * @property {string} pageName
 * @property {string} route
 * @property {string} module
 * @property {string} description
 * @property {string} sourceDecisionFile
 * @property {string[]} relatedFiles
 * @property {RequirementItem[]} requirements
 * @property {ExcludedDecision[]} excludedDecisions
 */

export {};
```
