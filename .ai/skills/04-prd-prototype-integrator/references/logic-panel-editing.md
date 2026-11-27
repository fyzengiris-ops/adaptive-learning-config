# 需求面板：编辑、删除、标色

Skill4 落地右侧 PRD 面板和角标浮层时，必须带上这套能力。正文仍然只有 `logicSections`。这套能力是让人在面板里改同一份正文，不是另写一套说明。

技术栈按 `project-context.md`。下面的交互和数据约定不随框架改变。

## 一个开关

用一个布尔开关同时控制右侧 PRD 面板和角标浮层。

- 打开：可以编辑、删除、新增、标色，浮层标题可双击修改。
- 关闭：只查看。不显示输入框、×、添加、标色。已经标过色的文字仍按强调色显示。

开关写在 project-context 的「需求面板编辑」。没有写时，按打开处理。

关闭时只藏控件，不删实现。以后把开关打开，同一套交互恢复。

## 编辑

- 点击小标题或一条正文进入输入。
- 小标题：失焦或 Enter 保存，Escape 取消。空标题不保存。
- 正文：失焦保存，Escape 取消。多行正文用 Ctrl 或 Cmd + Enter 保存。
- 保存的是 `logicSections` 里对应的 `title` 或 `items` 字符串，不另起字段。

## 删除和新增

- 小标题旁的 ×：删掉这一整段。
- 每条内容旁的 ×：只删这一条。
- 段内「添加内容」：在该段末尾加一条空内容。
- 底部「添加小标题」：新增一段，标题为「新小标题」，并带一条空内容。

## 标色

- 每条内容旁有「标色」。
- 没有选中文字：给整条上色；再点一次，整条取消。
- 正在编辑并选中一段：只给选中的文字上色；选区本身已经是一整段标色时，再点一次取消这段。
- 颜色写在正文里，不另存样式表。用字符 U+E000 开头、U+E001 结尾包住要强调的文字。
- 展示时把这对字符拆成强调片段。颜色 `#c2410c`，字重 600。
- 这两个字符要原样留在注册表字符串里。清洗文案、生成 Markdown、提交代码时都不要删掉。

## 浮层标题

角标浮层的需求名称在开关打开时可以双击修改，保存为该条需求的 `title`。开关关闭时标题只读。

## 保存

一次修改同时做两件事：

1. 写入本机，刷新后仍能看到。键按注册表 id 分开。
2. 回写 project-context 里声明的注册表源文件，以及该注册表的 overlay 文件。

回写规则：

- 只替换这一条需求的 `title` 和整个 `logicSections` 数组。
- `items` 仍是字符串数组。标色字符留在字符串内。
- 标题按源文件既有引号写法写回。找不到这条 `id` 时，只保留本机记录，不要改到别的需求上。
- 源文件注册表 id 必须在回写对照表里。没有登记的注册表，保存只能落在本机。

页面内其他读这份正文的地方，在保存后跟着更新。

## 和 Skill 其他步骤的边界

- Skill2、Skill5、Skill6 不负责做这套控件。
- 做面板的人不要借机重写业务口径。用户没在面板里改的句子，保持原样。
- 只查看时，详情仍按 `logicSections` 的段顺序和组内编号展示。

## 本仓库的对照实现

另一个 Next.js 项目要接同一套时，按自己的 `project-context.md` 改路径后，对照这些文件移植，不要只抄交互说明：

```txt
src/components/prd/RequirementLogicEditor.tsx
src/components/prd/RequirementPanel.tsx
src/components/prd/RequirementFloatingCard.tsx
src/lib/requirementLogicEdits.ts
src/app/api/requirements/logic/route.ts
src/app/globals.css
```

`globals.css` 只取 `.prd-logic-*` 相关规则。开关在 `RequirementLogicEditor.tsx` 的 `REQUIREMENT_LOGIC_EDITING`。
