import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { db } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  // Email registration
  register: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const unionId = `email_${randomUUID()}`;
      
      const result = await db.insert(users).values({
        unionId,
        email: input.email,
        name: input.name || input.email.split("@")[0],
        passwordHash,
        authMethod: "email",
        tier: "free",
        maxBooksAllowed: 4,
      }).$returningId();
      
      return { success: true, userId: result[0].id };
    }),

  // Email login
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (user.length === 0) {
        throw new Error("Invalid email or password");
      }
      const u = user[0];
      if (!u.passwordHash) {
        throw new Error("Account does not support password login");
      }
      const valid = await bcrypt.compare(input.password, u.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password");
      }
      
      // Update last sign in
      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, u.id));
      
      // Create session token (simple JWT-like approach)
      const token = Buffer.from(JSON.stringify({ id: u.id, unionId: u.unionId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64");
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: 30 * 24 * 60 * 60,
        }),
      );
      
      return { success: true, user: { id: u.id, name: u.name, email: u.email, tier: u.tier, role: u.role } };
    }),

  // Guest mode
  createGuest: publicQuery.mutation(async ({ ctx }) => {
    const guestId = `guest_${randomUUID()}`;
    const result = await db.insert(users).values({
      unionId: guestId,
      name: "Guest User",
      authMethod: "guest",
      tier: "guest",
      maxBooksAllowed: 1,
      booksGenerated: 0,
    }).$returningId();
    
    const token = Buffer.from(JSON.stringify({ id: result[0].id, unionId: guestId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64");
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 7 * 24 * 60 * 60,
      }),
    );
    
    return { success: true, guestId, token, userId: result[0].id };
  }),

  // Upgrade guest to registered
  upgradeGuest: publicQuery
    .input(z.object({
      guestId: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const guest = await db.select().from(users).where(eq(users.unionId, input.guestId)).limit(1);
      if (guest.length === 0) {
        throw new Error("Guest account not found");
      }
      
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }
      
      const passwordHash = await bcrypt.hash(input.password, 10);
      const newUnionId = "email_" + randomUUID();
      
      await db.update(users).set({
        unionId: newUnionId,
        email: input.email,
        name: input.name || input.email.split("@")[0],
        passwordHash,
        authMethod: "email",
        tier: "free",
        maxBooksAllowed: 4,
      }).where(eq(users.id, guest[0].id));
      
      return { success: true };
    }),

  // Passkey registration (simplified - stores credential)
  registerPasskey: authedQuery
    .input(z.object({
      credential: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(users).set({
        passkeyCredential: input.credential,
      }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
