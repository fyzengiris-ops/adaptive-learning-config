# `.ai/skills` 使用说明（可复制到其他项目）

本目录提供一套**与具体业务解耦**的「页面业务逻辑审核 → 注册表 → PRD」Skill，并支持：

- **全页模式**：新页 / 大重构 / 首次建档  
- **增量模式**：后置局部需求优化（**直接变更 A + 连带影响 B** 必审，无影响 C 不重审）

## 复制到新项目

1. 复制整个 `.ai/skills`（建议连同 `.ai/evals` 一并复制，可选）。  
2. 用 `shared/project-context.template.md` 覆盖填写为新的 `shared/project-context.md`。  
3. **不要**改 `shared/incremental-scope-mode.md` 的 A/B/C 通用定义（除非要升级方法论）。  
4. 按新项目创建 `docs/prd-workflow/` 等落盘目录（路径以你填写的 project-context 为准）。

## 建议执行顺序

```txt
Skill0 清单 → Skill1 审核决策 → Skill2 注册表 →（Skill3/4 角标可选）→ Skill5 PRD
```

增量优化时：用户先说明「本次改什么」→ Skill0 增量清单（含连带 B）→ 其后步骤只处理 A∪B。

## 关键文件

| 文件 | 是否随项目改 |
| --- | --- |
| `shared/incremental-scope-mode.md` | 否（通用） |
| `shared/logic-writing-spec.md` | 尽量否 |
| `shared/project-context.template.md` | 复制用模板 |
| `shared/project-context.md` | **是**（每项目填写） |
| `00`–`05` 各 `SKILL.md` | 一般否；升级流程时再改 |

## 与历史整页 PRD 模板

默认**忽略**各仓库自带的旧整页 PRD 编写模板；以本套 Skill 产出为准。详见 `incremental-scope-mode.md` 第 6 节。
