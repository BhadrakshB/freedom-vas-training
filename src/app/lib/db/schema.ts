import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const thread = pgTable("Thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Thread = InferSelectModel<typeof thread>;

export const trainings = pgTable("Training", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  threadId: uuid("threadId")
    .notNull()
    .references(() => thread.id),
  scenario: json("scenario").notNull(),
  persona: json("persona").notNull(),
  status: varchar("status", { enum: ["active", "completed", "paused"] })
    .notNull()
    .default("active"),
  score: json("score"),
  feedback: json("feedback"),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Training = InferSelectModel<typeof trainings>;

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => thread.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  isTraining: boolean("isTraining").notNull().default(false),
  trainingId: uuid("trainingId").references(() => trainings.id),
});

export type DBMessage = InferSelectModel<typeof message>;

// export const document = pgTable(
//   "Document",
//   {
//     id: uuid("id").notNull().defaultRandom(),
//     createdAt: timestamp("createdAt").notNull(),
//     title: text("title").notNull(),
//     content: text("content"),
//     isResearch: boolean("isResearch").notNull().default(false),
//     kind: varchar("text", { enum: ["text", "ppt", "image", "sheet"] })
//       .notNull()
//       .default("text"),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => user.id),
//   },
//   (table) => {
//     return {
//       pk: primaryKey({ columns: [table.id, table.createdAt] }),
//     };
//   },
// );

// export type Document = InferSelectModel<typeof document>;

// export const suggestion = pgTable(
//   "Suggestion",
//   {
//     id: uuid("id").notNull().defaultRandom(),
//     documentId: uuid("documentId").notNull(),
//     documentCreatedAt: timestamp("documentCreatedAt").notNull(),
//     originalText: text("originalText").notNull(),
//     suggestedText: text("suggestedText").notNull(),
//     description: text("description"),
//     isResolved: boolean("isResolved").notNull().default(false),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => user.id),
//     createdAt: timestamp("createdAt").notNull(),
//   },
//   (table) => ({
//     pk: primaryKey({ columns: [table.id] }),
//     documentRef: foreignKey({
//       columns: [table.documentId, table.documentCreatedAt],
//       foreignColumns: [document.id, document.createdAt],
//     }),
//   }),
// );

// export type Suggestion = InferSelectModel<typeof suggestion>;

// export const stream = pgTable(
//   "Stream",
//   {
//     id: uuid("id").notNull().defaultRandom(),
//     chatId: uuid("chatId").notNull(),
//     createdAt: timestamp("createdAt").notNull(),
//   },
//   (table) => ({
//     pk: primaryKey({ columns: [table.id] }),
//     chatRef: foreignKey({
//       columns: [table.chatId],
//       foreignColumns: [thread.id],
//     }),
//   }),
// );

// export type Stream = InferSelectModel<typeof stream>;
