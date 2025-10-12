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

//
// ➤ Core User Identity Table
//
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  deletedAt: timestamp("deletedAt"),
});

export type User = InferSelectModel<typeof user>;

//
// ➤ User Authentication Methods Table
//
export const userAuth = pgTable("UserAuth", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => user.id),
  provider: varchar("provider", { length: 32 }).notNull(),       // e.g., 'email', 'google', 'github'
  providerUserId: varchar("providerUserId", { length: 128 }).notNull(),  // External provider's user ID
  email: varchar("email", { length: 128 }),
  password: varchar("password", { length: 128 }),               // Only for email/password auth
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type UserAuth = InferSelectModel<typeof userAuth>;

//
// Thread Table (Conversation Thread)
//
export const thread = pgTable("Thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  title: text("title").notNull(),                         // Training session title
  userId: uuid("userId").notNull().references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] }).notNull().default("private"),
  scenario: json("scenario").notNull(),                  // Training scenario details
  persona: json("persona").notNull(),                    // Persona information
  status: varchar("status", { enum: ["active", "completed", "paused"] }).notNull().default("active"),
  score: json("score"),                                  // Final score data
  feedback: json("feedback"),                            // Training feedback
  startedAt: timestamp("startedAt").notNull(),          // Start time of the training
  completedAt: timestamp("completedAt"),
  version: text("version").default("1"),                // Schema versioning
  deletedAt: timestamp("deletedAt"),
  groupId: uuid("groupId").references(() => threadGroup.id),
});

export type Thread = InferSelectModel<typeof thread>;


//
// Messages Table
//
export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => thread.id),
  role: varchar("role").notNull(),                       // 'AI' or 'trainee'
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  isTraining: boolean("isTraining").notNull().default(false),
  messageRating: json("messageRating"),                  // Rating data for trainee messages
  messageSuggestions: json("messageSuggestions"),        // Alternative suggestions for trainee messages
});

export type DBMessage = InferSelectModel<typeof message>;

//
// Thread Group Table
//

export const threadGroup = pgTable("ThreadGroup", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").notNull().references(() => user.id),
  groupName: text("groupName").notNull(),
  groupFeedback: json("groupFeedback"), // Optional feedback for the group
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ThreadGroup = InferSelectModel<typeof threadGroup>;
