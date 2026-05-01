import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { db } from "./queries/connection";
import { apiKeys } from "@db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function encryptKey(key: string): string {
  // Simple encryption for storage - in production use proper key management
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.API_KEY_SECRET || "default_secret_key_32_bytes_long!!"),
    Buffer.alloc(16, 0)
  );
  return cipher.update(key, "utf8", "hex") + cipher.final("hex");
}

function decryptKey(encrypted: string): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.API_KEY_SECRET || "default_secret_key_32_bytes_long!!"),
    Buffer.alloc(16, 0)
  );
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}

export const apiKeysRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id));
    // Return without actual key values for security
    return keys.map(k => ({
      ...k,
      keyHash: undefined,
      keyPreview: `****${k.keyHash.slice(-4)}`,
    }));
  }),

  add: authedQuery
    .input(z.object({
      provider: z.string(),
      key: z.string().min(1),
      label: z.string().optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const encrypted = encryptKey(input.key);
      const result = await db.insert(apiKeys).values({
        userId: ctx.user.id,
        provider: input.provider,
        keyLabel: input.label || (input.provider + " Key"),
        keyHash: encrypted,
        isDefault: input.isDefault,
      }).$returningId();
      return { id: result[0].id };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      label: z.string().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.update(apiKeys).set({ ...data, updatedAt: new Date() })
        .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
      return { success: true };
    }),

  getDecrypted: authedQuery
    .input(z.object({ provider: z.string() }))
    .query(async ({ ctx, input }) => {
      const keys = await db.select().from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, input.provider), eq(apiKeys.isActive, true)));
      if (keys.length === 0) return [];
      return keys.map(k => ({
        id: k.id,
        provider: k.provider,
        label: k.keyLabel,
        key: decryptKey(k.keyHash),
        isDefault: k.isDefault,
      }));
    }),

  providers: authedQuery.query(async ({ ctx }) => {
    const keys = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.isActive, true)));
    const providers = new Set(keys.map(k => k.provider));
    return Array.from(providers);
  }),
});
