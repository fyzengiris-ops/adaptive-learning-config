---
name: registry-to-prd-generator
description: 从需求注册表生成 Markdown PRD。支持全页 PRD 与增量 PRD（仅输出/更新本批 A∪B 相关章节，不重写未改章节）。业务逻辑必须原样按 logicSections 输出。
---

# 注册表生成 Markdown PRD Skill

## 目标

从需求注册表生成 Markdown PRD。

PRD 是核对后的归档文档，必须与角标悬浮面板、右侧 PRD 面板（若有）同源，均来自注册表的 `logicSections`。

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/incremental-scope-mode.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/05-registry-to-prd-generator/references/prd-document-template.md
```

再读 `project-context.md` 中声明的 requirements index/schema，以及目标 `*.registry.*`。  
若注册表不存在，提示先跑 Skill2。  
若尚未页面核对，可出草稿，但摘要中必须说明。

**默认忽略**仓库内历史整页 PRD 编写模板，除非用户当轮要求沿用。

## 全页 vs 增量 PRD

| 模式 | 行为 |
| --- | --- |
| 全页 | 输出完整 `docs/prd/<页面>.prd.md` |
| 增量 | **优先**更新既有 PRD 中本批需求章节，或另存 `docs/prd/<页面>.delta.<批次>.prd.md`；**禁止**无指令时整页重写无关章节的业务逻辑 |

增量时文档须在文首标明：

- 审核模式：增量  
- 本次变更摘要  
- 本批需求编号列表  
- 未覆盖章节：明确写「本次不重审 / 未改」

## 输出文件

```txt
docs/prd/<页面或流程>.prd.md
docs/prd/<页面或流程>.delta.<批次>.prd.md   # 增量可选
```

路径以 project-context 为准。

## PRD 必须包含

1. 页面范围（当前页 / 上游 / 下游 / 边界摘要）
2. 功能概述
3. 业务逻辑说明（按 `logicSections`）
4. 范围边界
5. 验收标准
6. 来源追溯

无法确认上下游时，写“未在当前代码或注册表中确认”，不编造。

## 页面关系生成规则

1. 优先读 `route`、`relatedFiles`、`activate`，以及 `logicSections` 中与跳转/生成/流转相关的条目  
2. 再读代码中的 hash 跳转、弹窗、Tab、状态传递  
3. 再读决策文件范围说明  
4. 仍无法确认则明确写未确认

## 业务逻辑渲染规则（关键）

必须遵循：

```txt
.ai/skills/shared/logic-writing-spec.md
```

对每条需求，**原样按 `logicSections` 输出**：

```md
### <需求编号> <需求标题>

来源：<代码事实 / 确认决策 / 代码事实 + 确认决策>

#### <logicSections[0].title>
1.1 <item>
1.2 <item>

#### <logicSections[1].title>
1.1 <item>

#### 验收标准
1. ...
```

规则：

- 有几个 section 就输出几个 `####` 标题
- 标题名称、顺序、条目均来自注册表，不重排业务含义
- **禁止**强制改写成「显示说明 + 操作说明」两段式
- **禁止**自动补固定子栏目
- **禁止**跨 section 复述同一规则
- 忽略旧 `display` / `operation` 主正文（若残留）
- 不输出空 section、空兜底句
- 不输出大段 JavaScript 原始数据
- `excludedDecisions` 写入范围边界，不混入普通需求

## 空兜底过滤

不输出：

- 无额外权限限制
- 无额外数据流转
- 无异常场景
- 本对象无操作入口
- 本对象仅展示
- 空字符串 / 空数组

## 验收标准与来源追溯

- 验收标准按需求编号分组，来自 `acceptance`
- 来源追溯包含：决策文件、相关代码、注册表文件
- `sourceType` 中文：代码事实 / 确认决策 / 代码事实 + 确认决策

## 文档标题

```md
# <页面名称> PRD
```

例如：`# 学情报告 PRD`、`# 课程中心·章节页 PRD`

## 生成后摘要

```md
一、生成结果
- 模式：全页 | 增量
- 已生成 PRD：<path>

二、文档包含
- 页面范围 / 变更摘要（增量）
- 上游/下游（能确认的）
- 业务逻辑说明（logicSections 原样；增量仅本批）
- 范围边界
- 验收标准
- 来源追溯

三、注意事项
- <未确认上下游、或明确未重审的章节>
```

## 输出约束

- 尽量中文
- 不编造注册表与代码无法确认的规则
- 不改注册表，除非用户明确要求
- 若 `logicSections` 缺失，提示先修正 Skill2，不要自行用旧整页 PRD 模板补写
- 增量模式禁止无指令整页覆盖无关章节
