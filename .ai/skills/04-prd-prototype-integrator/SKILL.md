---
name: prd-prototype-integrator
description: 在注册表与锚点就绪后，实现右侧 PRD 阅读面板与页面联动（activate、高亮、与角标同步）。业务详情原样展示 logicSections。运行时路径以 project-context 为准，不绑定单一技术栈。
---

# 右侧 PRD 面板联动 Skill

## 目标

基于需求注册表与页面已有锚点，打通右侧 PRD 阅读面板与页面。

最终效果：

- 可开关右侧面板；打开后与主内容布局协调（具体布局见 references 与 project-context）
- 点击需求卡片执行 `activate`，定位并高亮锚点
- 与角标/悬浮面板尽量同步选中
- 详情区**原样展示 `logicSections`**

执行前必须先读：

```txt
.ai/skills/shared/project-context.md
.ai/skills/shared/logic-writing-spec.md
.ai/skills/04-prd-prototype-integrator/references/layout-and-activation.md
```

再按 project-context 读取 requirements 与现有 PRD 运行时文件。  
技术栈与文件布局**以 project-context 为准**（静态原型或 React 等均可）；不要假设必须使用或禁止某一框架。

若注册表不存在，提示先跑 Skill2。  
若无稳定锚点且用户未明确要求本次补锚点，提示先跑 Skill3。

**增量模式**：面板数据源可只高亮/列出本批更新条目；不要为了整页展示去改写无关需求的 logicSections。

## 执行边界

可以：

- 新增/更新 `requirement-reader-shell.js`、`requirement-panel.js`、`requirement-highlight.js`、`requirement-utils.js`、`css/prd.css`
- 包装布局、开关、拖拽宽度、列表、详情、`activate`

不可以：

- 负责逐个补初始角标（除非用户明确要求最小补齐）
- 生成 Markdown PRD
- **改写或二次组织 `logicSections`**

## 业务逻辑详情渲染（关键）

右侧详情必须：

1. 只读 `requirement.logicSections`
2. 按 section 顺序展示 `title` + `items`
3. 组内单层编号（如 `1.1`、`1.2`）

右侧详情禁止：

1. 固定渲染「显示说明 / 操作说明」两段式（除非 `logicSections` 本身就是这两项）
2. 自动补「页面展示 / 状态反馈 / 后续流程」等栏目
3. 双编号
4. 展示空兜底说明
5. 读取旧 `display` / `operation` 作为主正文

**渲染层不负责重新组织业务逻辑，只负责呈现 Skill2 已生成的分组。**

总规范：

```txt
.ai/skills/shared/logic-writing-spec.md
```

## 布局与激活

布局、拖拽、浮层避让、`activate` 执行方式见：

```txt
.ai/skills/04-prd-prototype-integrator/references/layout-and-activation.md
```

支持动作：`navigate`、`openPanel`、`openDialog`、`setStep`、`setTab`、`scrollTo`、`highlight`。  
优先显式控制器，不要文案模拟点击。

## 注册表使用

从 project-context 声明的 requirements index 读取 registries。列表可用：

- `pageName`、`module`、`requirements`
- `id`、`title`、`sourceType`、`anchorId`、`activate`
- 详情正文：`logicSections`

`excludedDecisions` 不作为普通需求卡片。

## 样式与验证

实现技术栈、样式文件与验证命令以 `project-context.md` 为准（静态原型或 React 工程均可）。  
检查：面板可开关、`activate` 有效、详情按 `logicSections` 展示、与角标尽量同步；增量时本批条目可定位即可。

## 完成摘要

```md
一、实现结果
- 新增/更新文件：...

二、已支持能力
- 右侧 PRD 面板开关
- 拖拽调整宽度
- 点击定位和高亮
- activate 路径执行
- logicSections 原样展示：是/否
- 与角标/悬浮面板同步：支持/不支持/部分支持

三、验证结果
- node --check：通过/失败
- 页面检查：...
```
