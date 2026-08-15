---
name: requirement-registry-writer
description: 把页面代码、Skill1 已确认决策与合理延伸边界合并为需求注册表（含 logicSections）。支持全量生成与增量更新（仅 A∪B 必审对象）。路径以 project-context.md 为准。
---

# 需求注册表生成 Skill

## 目标

为当前页面或流程生成或**增量更新**业务逻辑注册表。

注册表不是“只记录被用户确认过的问题”，也不是“只描述当前前端已经实现了什么”。  
它是对应对象应有的业务规则源数据，供 Skill3 / Skill4 / Skill5 同源使用。

本 Skill 不负责重新向用户做全量审核，也不负责实现角标或右侧面板。  
它负责：收集规则、补齐合理延伸、归类成 `logicSections`、编号并结构化落盘。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/incremental-scope-mode.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/02-requirement-registry-writer/references/registry-field-spec.md
```

注册表路径、文件格式（JS/TS 等）以 `project-context.md` 为准，**不要**写死为某一技术栈。

## 全量 vs 增量

| 模式 | 行为 |
| --- | --- |
| 全页 / 全量 | 可为整页对象建立或重建注册表（仍尊重 excludedDecisions） |
| 增量 | **只新增或更新** Skill0 必审对象（A∪B）对应条目；**禁止**重写或删除 C 类既有条目的业务口径，除非用户明确要求 |

增量输入优先：

1. `docs/prd-workflow/inventories/*.inventory.md`（审核模式=增量）  
2. `docs/prd-workflow/decisions/*.decision.md`（本批决策）  
3. 相关代码中与 A∪B 相关的实现  

若已有 registry：合并更新目标条目；保留无关条目原样。

## 输入来源（三来源）

1. **A. 页面代码已体现**  
2. **B. Skill1 已确认决策**（`docs/prd-workflow/decisions/*.decision.md`）  
3. **C. 合理延伸**（与已确认口径一致的边界；拿不准回 Skill1）

如果用户没有指定具体决策文件：目录仅一个则使用；多个则询问；没有则可基于代码+延伸生成，但须说明，且影响验收的点提示回 Skill1。

## 输出文件

路径见 `project-context.md`（示例形态）：

```txt
<requirements-root>/schema.(js|ts)
<requirements-root>/<页面或流程>.registry.(js|ts)
<requirements-root>/index.(js|ts)
```

- schema：结构定义（含 `logicSections`）
- registry：页面注册表
- index：统一导出

## 用户可见正文：logicSections

每条需求必须有 `logicSections`，这是用户可见业务逻辑的**唯一来源**。

生成顺序必须是：

```txt
收集规则素材（A+B+C）
→ 整理成原子业务规则
→ 按“回答什么问题”归类
→ 生成一级标题与 items
→ 无规则的标题不生成；一条规则只进一组
```

详细写作规范见：

```txt
.ai/skills/shared/logic-writing-spec.md
```

### 禁止

- 只写当前前端已实现内容
- 固定套用「显示说明 + 操作说明」两段式
- 再拆「页面展示 / 状态反馈 / 操作规则 / 后续流程」固定子模板
- 跨标题重复同一规则
- 为凑结构写空标题或空兜底句
- 继续把 `display` / `operation` 当作用户正文主结构

### 允许的一级标题示例

显示说明、操作说明、统计口径、计算规则、数据规则/数据来源、选取规则、排序规则/展示顺序、状态规则、生成规则、快照/历史类标题、异常情况处理，以及更准确的自定义标题。

## 执行流程

1. 确认页面或流程范围，以及全量 / 增量。  
2. 读取 `project-context.md`、`incremental-scope-mode.md`、`logic-writing-spec.md`、`registry-field-spec.md`。  
3. 按 project-context 打开相关代码；增量时优先只读 A∪B 相关实现。  
4. 读取 inventory（若有）与 `.decision.md`。  
5. 识别需求项：增量时**仅** A∪B（及决策中明确纳入的对象）；全量时按整页业务对象。  
6. 对每条进入 `requirements` 的需求：收集规则 → 原子规则 → `logicSections` → 编号/锚点/`activate`/验收/来源。  
7. 范围外或 C 类说明写入 `excludedDecisions`（增量时写明「本次不重审」）。  
8. 创建或**合并更新** schema / registry / index（增量禁止清空无关条目）。  
9. 输出生成摘要（标明全量或增量；增量列出更新了哪些 id）。

## 哪些内容进入 requirements

满足任一即可（**增量模式仅限 A∪B**）：

- 页面上有业务含义的可见对象（且在必审范围内）
- 用户可执行或不可执行的操作
- 需要定清的统计/生成/快照/排序/异常等业务规则
- 需要角标核对、右侧 PRD 展示或进入 Markdown PRD

注意：即使 Skill1 未提问，只要对象在必审范围内且需要完整业务规则，也要进入注册表；`logicSections` 不得只停留在 UI 表象。  
增量模式下：不要把 C 类对象「顺便」重写进 registry。

## 需求拆分粒度：决策单元（既不能太粗也不能太细）

按「**一个核对入口 = 一个可独立拍板的业务决策**」拆条，不按像素拆，也不按整页大框糊成一条。

### 应拆开

满足任一即可拆成多条：

1. **决策对象不同**（如课程筛选 vs 试卷筛选）
2. **页面落点不同**（如来源 Tab vs 试卷「X 套」）
3. **验收点不同**（如数量角标口径 vs Tab 切换规则）
4. **有无独立 UI 不同**（有控件的规则 vs 纯口径规则；后者仍可成条，但要指定最强关联落点）

### 不应拆开

满足任一应合并：

1. **同一字段下的枚举选项**（如待学习 / 学习中 / 已学习）——写进同一条，不要每个选项一个角标
2. **同一操作的连续步骤**（打开抽屉 → 选择 → 确定）若只在描述同一入口怎么用
3. **拆开后大量重复**，只是换了选项名
4. **拆开后仍只能挂在同一落点**，无法让人从位置区分在说谁

### 自检问句

> 产品/测试会不会单独指着这个角标说：我们就核对这一块？  
> - 会 → 可成条  
> - 只会说「这是某个筛选项里的一个值」→ 合并进父条

### 筛选模块示例（目标粒度）

- 一条：筛选抽屉有哪些维度（课程状态 / 试卷状态）
- 一条：课程筛选规则（三态、只滤课程等；选项写在 items 里）
- 一条：试卷筛选规则（二态、只滤试卷等）
- **不要**：已学习、学习中、已练习各一条

## 锚点选择规则

1. **有明确字段/文案/按钮**：`anchorId` 必须对应那个具体对象，不要挂无关父级大容器。  
2. **无独立 UI 的口径规则**：仍单独成条时，锚到**与该逻辑关联性最强**的可见对象旁（关联落点）。  
3. `objectName` 与锚点对象名称应一致，便于 Skill3 贴准角标。

示例：

```txt
section.source.tabs          → 三类来源 Tab
section.source.count         → 来源数量角标
section.papers.count         → 试卷「X 套」
section.filter.course        → 课程筛选（可落在课程状态或筛选入口的课程维度）
```

## 哪些内容进入 excludedDecisions

- “本次不改 / 本期不管 / 已上线非本次范围”
- “不属于当前页面”
- 仅作范围边界说明的内容

## 需求编号 / 锚点 / activate

编号前缀以当前页面域名为准（由 project-context 与页面范围决定），例如：

```txt
<PAGE_PREFIX>-001
```

`activate` 常见动作：`navigate`、`openPanel`、`openDialog`、`setStep`、`setTab`、`scrollTo`、`highlight`（含义见 `project-context.md`）。

已有编号不要重排；删除编号不复用。增量更新时优先复用已有 id，仅对新对象分配新号。

## 运行后摘要格式

```md
一、生成结果
- 模式：全量 | 增量
- 已生成/更新 schema：<path>
- 已生成/更新注册表：<path>
- 已生成/更新统一出口：<path>

二、进入注册表的需求（增量则只列本批）
1. <需求编号>：<需求标题>（来源：…；标题：…）
2. ...

三、未纳入 / 明确不重审
- <对象>：<原因>

四、需要后续处理
- <例如：需要 Skill3 为 anchorId 增加 data-req-anchor>
```

## 输出约束

- 除必要路径与字段名外，尽量中文
- 不要把未确认审核建议写进 registry
- 不要把“本次不改”伪装成需求卡片
- 不要只输出代码表面实现
- 不要与 Skill1 已确认口径矛盾
- 文件格式遵循 project-context（JSDoc JS 或 TS 等）
- 需求 id / 锚点不使用运行时随机值
- 增量模式禁止无指令时整表重建或覆盖无关条目
