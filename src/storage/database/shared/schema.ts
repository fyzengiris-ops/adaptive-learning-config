import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ==================== 教材体系相关表 ====================

// 教材表
export const textbooks = pgTable(
  "textbooks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 50 }).notNull(),
    phase: varchar("phase", { length: 50 }).notNull(), // 学段：高中/初中/小学
    grade: varchar("grade", { length: 50 }).notNull(),
    publisher: varchar("publisher", { length: 100 }).notNull(), // 出版社/版本
    version: varchar("version", { length: 50 }).notNull(), // 年份版本
    year: varchar("year", { length: 20 }).notNull(),
    region: varchar("region", { length: 50 }).notNull(),
    coverImage: varchar("cover_image", { length: 500 }),
    // 发布相关
    currentVersion: varchar("current_version", { length: 20 }),
    lastPublishTime: timestamp("last_publish_time", { withTimezone: true }),
    lastPublisher: varchar("last_publisher", { length: 100 }),
    // 统计数据
    chapterCount: integer("chapter_count").default(0).notNull(),
    knowledgePointCount: integer("knowledge_point_count").default(0).notNull(),
    schoolCount: integer("school_count").default(0).notNull(),
    // 状态
    hasUnpublishedChanges: boolean("has_unpublished_changes").default(false).notNull(),
    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("textbooks_subject_idx").on(table.subject),
    index("textbooks_phase_idx").on(table.phase),
    index("textbooks_grade_idx").on(table.grade),
  ]
);

// 教材章节表
export const textbookChapters = pgTable(
  "textbook_chapters",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    textbookId: varchar("textbook_id", { length: 36 }).notNull(),
    parentId: varchar("parent_id", { length: 36 }), // 父章节ID，用于层级结构
    name: varchar("name", { length: 255 }).notNull(),
    level: varchar("level", { length: 20 }).notNull(), // chapter/section
    order: integer("order").default(0).notNull(),
    expanded: boolean("expanded").default(false).notNull(),
    // 知识点关联（存储为JSON数组）
    knowledgePoints: jsonb("knowledge_points"),
    // 同步课程
    syncCourses: jsonb("sync_courses"),
    // 练习试卷
    practiceExams: jsonb("practice_exams"),
    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("textbook_chapters_textbook_idx").on(table.textbookId),
    index("textbook_chapters_parent_idx").on(table.parentId),
  ]
);

// 变更记录表
export const textbookChangeRecords = pgTable(
  "textbook_change_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    textbookId: varchar("textbook_id", { length: 36 }).notNull(),
    changeType: varchar("change_type", { length: 50 }).notNull(), // add/modify/delete
    changeDescription: text("change_description").notNull(),
    changedBy: varchar("changed_by", { length: 100 }).notNull(), // 修改人
    changedByRole: varchar("changed_by_role", { length: 20 }).notNull(), // supervisor/teacher
    dimension: varchar("dimension", { length: 50 }), // 变更维度：章节信息/知识点关联/同步课程/练习试卷
    target: varchar("target", { length: 255 }), // 变更对象
    isPublished: boolean("is_published").default(false).notNull(), // 是否已发布
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("textbook_change_records_textbook_idx").on(table.textbookId),
    index("textbook_change_records_published_idx").on(table.isPublished),
  ]
);

// 发布记录表
export const textbookPublishRecords = pgTable(
  "textbook_publish_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    textbookId: varchar("textbook_id", { length: 36 }).notNull(),
    version: varchar("version", { length: 20 }).notNull(),
    description: text("description").notNull(),
    publishTime: timestamp("publish_time", { withTimezone: true }).notNull(),
    publisher: varchar("publisher", { length: 100 }).notNull(),
    publisherAccount: varchar("publisher_account", { length: 50 }),
    // 定时发布信息
    scheduledDate: varchar("scheduled_date", { length: 20 }),
    scheduledTime: varchar("scheduled_time", { length: 10 }),
    // 变更详情
    changes: jsonb("changes"), // 关联的变更记录
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("textbook_publish_records_textbook_idx").on(table.textbookId),
    index("textbook_publish_records_version_idx").on(table.version),
  ]
);

// 使用学校表
export const textbookSchools = pgTable(
  "textbook_schools",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    textbookId: varchar("textbook_id", { length: 36 }).notNull(),
    schoolId: varchar("school_id", { length: 36 }).notNull(),
    schoolName: varchar("school_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("textbook_schools_textbook_idx").on(table.textbookId),
  ]
);

// ==================== 知识树体系相关表 ====================

// 学科表
export const subjects = pgTable(
  "subjects",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull().unique(),
    code: varchar("code", { length: 50 }),
    order: integer("order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    hasUnpublishedChanges: boolean("has_unpublished_changes").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("subjects_name_idx").on(table.name),
  ]
);

// 知识树节点表
export const knowledgeNodes = pgTable(
  "knowledge_nodes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    subjectId: varchar("subject_id", { length: 36 }).notNull(),
    parentId: varchar("parent_id", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),
    level: integer("level").default(0).notNull(), // 层级
    order: integer("order").default(0).notNull(),
    expanded: boolean("expanded").default(false).notNull(),
    // 知识点详情
    description: text("description"),
    difficulty: varchar("difficulty", { length: 20 }), // 难度等级
    // 关联信息
    textbooks: jsonb("textbooks"), // 关联的教材
    exams: jsonb("exams"), // 关联的试卷
    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("knowledge_nodes_subject_idx").on(table.subjectId),
    index("knowledge_nodes_parent_idx").on(table.parentId),
  ]
);

// 知识树变更记录表
export const knowledgeChangeRecords = pgTable(
  "knowledge_change_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    subjectId: varchar("subject_id", { length: 36 }).notNull(),
    nodeId: varchar("node_id", { length: 36 }),
    changeType: varchar("change_type", { length: 50 }).notNull(),
    changeDescription: text("change_description").notNull(),
    changedBy: varchar("changed_by", { length: 100 }).notNull(),
    changedByRole: varchar("changed_by_role", { length: 20 }).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("knowledge_change_records_subject_idx").on(table.subjectId),
  ]
);

// 知识树发布记录表
export const knowledgePublishRecords = pgTable(
  "knowledge_publish_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    subjectId: varchar("subject_id", { length: 36 }).notNull(),
    version: varchar("version", { length: 20 }).notNull(),
    description: text("description").notNull(),
    publishTime: timestamp("publish_time", { withTimezone: true }).notNull(),
    publisher: varchar("publisher", { length: 100 }).notNull(),
    publisherAccount: varchar("publisher_account", { length: 50 }),
    changes: jsonb("changes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("knowledge_publish_records_subject_idx").on(table.subjectId),
  ]
);

// ==================== 系统健康检查表（保留） ====================

export const healthCheck = pgTable("health_check", {
	id: integer("id").primaryKey().default(1),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ==================== TypeScript 类型导出 ====================

export type Textbook = typeof textbooks.$inferSelect;
export type TextbookChapter = typeof textbookChapters.$inferSelect;
export type TextbookChangeRecord = typeof textbookChangeRecords.$inferSelect;
export type TextbookPublishRecord = typeof textbookPublishRecords.$inferSelect;
export type TextbookSchool = typeof textbookSchools.$inferSelect;

export type Subject = typeof subjects.$inferSelect;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type KnowledgeChangeRecord = typeof knowledgeChangeRecords.$inferSelect;
export type KnowledgePublishRecord = typeof knowledgePublishRecords.$inferSelect;
