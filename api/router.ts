import { authRouter } from "./auth-router";
import { booksRouter } from "./books-router";
import { apiKeysRouter } from "./apikeys-router";
import { chatRouter } from "./chat-router";
import { paymentsRouter } from "./payments-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  books: booksRouter,
  apiKeys: apiKeysRouter,
  chat: chatRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
