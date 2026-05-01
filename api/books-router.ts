import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { db } from "./queries/connection";
import { books, users } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const booksRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return db.select().from(books).where(eq(books.userId, ctx.user.id)).orderBy(desc(books.createdAt));
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db.select().from(books)
        .where(and(eq(books.id, input.id), eq(books.userId, ctx.user.id)))
        .limit(1);
      if (result.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found" });
      return result[0];
    }),

  create: authedQuery
    .input(z.object({
      topic: z.string().min(1),
      lang: z.string().default("en"),
      pages: z.number().min(10).max(200).default(50),
      writingStyle: z.string().default("educational"),
      audience: z.string().default("high_school"),
      authorName: z.string().optional(),
      structure: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check generation limits
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (user.length === 0) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
      
      const u = user[0];
      if (u.tier === "guest" && u.booksGenerated >= 1) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Guest limit reached. Please register to continue." });
      }
      if (u.tier === "free" && u.booksGenerated >= u.maxBooksAllowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Free tier limit reached. Upgrade to premium for unlimited books." });
      }

      const result = await db.insert(books).values({
        userId: ctx.user.id,
        ...input,
        status: "generating",
      }).$returningId();
      
      return { id: result[0].id };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      content: z.any().optional(),
      structure: z.any().optional(),
      status: z.enum(["generating", "completed", "failed", "interrupted"]).optional(),
      wordCount: z.number().optional(),
      pageCount: z.number().optional(),
      providerUsed: z.string().optional(),
      modelUsed: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // If completing, increment user's book count
      if (data.status === "completed") {
        await db.execute("UPDATE users SET booksGenerated = booksGenerated + 1 WHERE id = " + ctx.user.id);
      }
      
      await db.update(books).set({ ...data, updatedAt: new Date() })
        .where(and(eq(books.id, id), eq(books.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(books)
        .where(and(eq(books.id, input.id), eq(books.userId, ctx.user.id)));
      return { success: true };
    }),

  // Stats
  stats: authedQuery.query(async ({ ctx }) => {
    const userBooks = await db.select().from(books).where(eq(books.userId, ctx.user.id));
    const words = userBooks.reduce((a, b) => a + (b.wordCount || 0), 0);
    const pages = userBooks.reduce((a, b) => a + (b.pageCount || 0), 0);
    return { books: userBooks.length, words, pages };
  }),

  // Check limits
  checkLimits: authedQuery.query(async ({ ctx }) => {
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (user.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    const u = user[0];
    const canGenerate = u.tier === "premium" || u.booksGenerated < u.maxBooksAllowed;
    const remaining = u.tier === "premium" ? -1 : Math.max(0, u.maxBooksAllowed - u.booksGenerated);
    return { canGenerate, remaining, tier: u.tier, booksGenerated: u.booksGenerated, maxBooks: u.maxBooksAllowed };
  }),
});
