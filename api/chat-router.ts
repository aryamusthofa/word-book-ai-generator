import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { db } from "./queries/connection";
import { chatHistory } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const chatRouter = createRouter({
  getHistory: authedQuery
    .input(z.object({ sessionId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.sessionId) {
        return db.select().from(chatHistory)
          .where(and(eq(chatHistory.userId, ctx.user.id), eq(chatHistory.sessionId, input.sessionId)))
          .orderBy(desc(chatHistory.createdAt))
          .limit(100);
      }
      return db.select().from(chatHistory)
        .where(eq(chatHistory.userId, ctx.user.id))
        .orderBy(desc(chatHistory.createdAt))
        .limit(100);
    }),

  getSessions: authedQuery.query(async ({ ctx }) => {
    const messages = await db.select().from(chatHistory)
      .where(eq(chatHistory.userId, ctx.user.id))
      .orderBy(desc(chatHistory.createdAt));
    
    const sessions = new Map<string, { sessionId: string; lastMessage: string; updatedAt: Date }>();
    for (const msg of messages) {
      if (!sessions.has(msg.sessionId)) {
        sessions.set(msg.sessionId, {
          sessionId: msg.sessionId,
          lastMessage: msg.content.slice(0, 100),
          updatedAt: msg.createdAt,
        });
      }
    }
    return Array.from(sessions.values());
  }),

  addMessage: authedQuery
    .input(z.object({
      sessionId: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      topicDetected: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(chatHistory).values({
        userId: ctx.user.id,
        ...input,
      }).$returningId();
      return { id: result[0].id };
    }),

  clearSession: authedQuery
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(chatHistory)
        .where(and(eq(chatHistory.userId, ctx.user.id), eq(chatHistory.sessionId, input.sessionId)));
      return { success: true };
    }),

  deleteAll: authedQuery.mutation(async ({ ctx }) => {
    await db.delete(chatHistory).where(eq(chatHistory.userId, ctx.user.id));
    return { success: true };
  }),
});
