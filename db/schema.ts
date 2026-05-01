import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
  boolean,
  mysqlEnum,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tier: mysqlEnum("tier", ["guest", "free", "premium"]).default("free").notNull(),
  authMethod: mysqlEnum("authMethod", ["oauth", "email", "passkey", "guest"]).default("oauth").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passkeyCredential: text("passkeyCredential"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
  booksGenerated: int("booksGenerated").default(0).notNull(),
  maxBooksAllowed: int("maxBooksAllowed").default(4).notNull(),
  trialUsed: boolean("trialUsed").default(false).notNull(),
});

export const apiKeys = mysqlTable("apiKeys", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  keyLabel: varchar("keyLabel", { length: 255 }),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  lang: varchar("lang", { length: 10 }).default("en").notNull(),
  pages: int("pages").default(50).notNull(),
  writingStyle: varchar("writingStyle", { length: 64 }).default("educational").notNull(),
  audience: varchar("audience", { length: 64 }).default("high_school").notNull(),
  authorName: varchar("authorName", { length: 255 }),
  structure: json("structure"),
  content: json("content"),
  wordCount: int("wordCount").default(0).notNull(),
  pageCount: int("pageCount").default(0).notNull(),
  providerUsed: varchar("providerUsed", { length: 64 }),
  modelUsed: varchar("modelUsed", { length: 128 }),
  status: mysqlEnum("status", ["generating", "completed", "failed", "interrupted"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const generationLogs = mysqlTable("generationLogs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  bookId: bigint("bookId", { mode: "number", unsigned: true }),
  provider: varchar("provider", { length: 64 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  sectionId: varchar("sectionId", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["success", "retry", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  plan: mysqlEnum("plan", ["free", "premium", "trial"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "pending"]).default("active").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  paymentProvider: varchar("paymentProvider", { length: 64 }),
  amount: int("amount").default(0).notNull(),
  currency: varchar("currency", { length: 10 }).default("IDR").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  subscriptionId: bigint("subscriptionId", { mode: "number", unsigned: true }),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("IDR").notNull(),
  method: varchar("method", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }),
  status: mysqlEnum("status", ["pending", "success", "failed", "refunded"]).default("pending").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const chatHistory = mysqlTable("chatHistory", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  topicDetected: varchar("topicDetected", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type GenerationLog = typeof generationLogs.$inferSelect;
export type ChatMessage = typeof chatHistory.$inferSelect;
