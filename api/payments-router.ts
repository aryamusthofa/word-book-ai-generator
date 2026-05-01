import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { db } from "./queries/connection";
import { payments, subscriptions, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const paymentsRouter = createRouter({
  // Create a payment intent (mock for now - in production integrate with Midtrans/Xendit)
  createIntent: authedQuery
    .input(z.object({
      amount: z.number(),
      currency: z.string().default("IDR"),
      method: z.enum(["google_pay", "credit_card", "e_wallet", "qris"]),
      provider: z.string().optional(), // "dana", "ovo", "gopay", etc
    }))
    .mutation(async ({ ctx, input }) => {
      const externalId = `pay_${randomUUID()}`;
      const result = await db.insert(payments).values({
        userId: ctx.user.id,
        amount: input.amount,
        currency: input.currency,
        method: input.method,
        provider: input.provider || input.method,
        status: "pending",
        externalId,
        metadata: { ...input },
      }).$returningId();
      
      return { 
        paymentId: result[0].id,
        externalId,
        status: "pending",
        // Mock payment URL / QR code data
        paymentUrl: `/api/mock-payment/${externalId}`,
        qrData: input.method === "qris" ? `00020101021226660014ID.CO.QRIS.WWW011893600914${externalId}0202${input.amount}5404${input.currency}5802ID6304` : undefined,
      };
    }),

  // Verify payment (mock - in production webhook handler)
  verify: publicQuery
    .input(z.object({ externalId: z.string() }))
    .mutation(async ({ input }) => {
      const payment = await db.select().from(payments).where(eq(payments.externalId, input.externalId)).limit(1);
      if (payment.length === 0) throw new Error("Payment not found");
      
      // Mock: always succeed for demo
      await db.update(payments).set({ status: "success", updatedAt: new Date() })
        .where(eq(payments.id, payment[0].id));
      
      // Update user to premium
      await db.update(users).set({ tier: "premium" }).where(eq(users.id, payment[0].userId));
      
      // Create subscription record
      const subResult = await db.insert(subscriptions).values({
        userId: payment[0].userId,
        plan: "premium",
        status: "active",
        paymentMethod: payment[0].method,
        paymentProvider: payment[0].provider,
        amount: payment[0].amount,
        currency: payment[0].currency,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).$returningId();
      
      // Update payment with subscription ID
      await db.update(payments).set({ subscriptionId: subResult[0].id })
        .where(eq(payments.id, payment[0].id));
      
      return { success: true, status: "success" };
    }),

  getSubscription: authedQuery.query(async ({ ctx }) => {
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, ctx.user.id)).limit(1);
    if (sub.length === 0) return null;
    return sub[0];
  }),

  getPaymentHistory: authedQuery.query(async ({ ctx }) => {
    return db.select().from(payments)
      .where(eq(payments.userId, ctx.user.id))
      .orderBy(desc(payments.createdAt));
  }),

  // Cancel subscription
  cancel: authedQuery.mutation(async ({ ctx }) => {
    await db.update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptions.userId, ctx.user.id));
    
    // Revert to free tier
    await db.update(users)
      .set({ tier: "free", maxBooksAllowed: 4 })
      .where(eq(users.id, ctx.user.id));
    
    return { success: true };
  }),

  // Get pricing plans
  plans: publicQuery.query(() => {
    return [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "IDR",
        features: ["Generate up to 4 books", "Basic models", "Standard themes", "Community support"],
        limits: { books: 4, pages: 50, models: "basic" },
      },
      {
        id: "premium",
        name: "Premium",
        price: 99000,
        currency: "IDR",
        features: ["Unlimited books", "All models including advanced", "Custom themes", "Priority support", "No generation limits"],
        limits: { books: -1, pages: 200, models: "all" },
      },
    ];
  }),
});
