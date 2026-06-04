"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@jursoc.com";

    if (!publicKey || !privateKey) {
      console.warn("Push notifications not configured: Missing VAPID keys");
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(internal.push.getSubscriptions, { userId: args.userId });

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            // Subscription has expired
            await ctx.runMutation(internal.push.internalUnsubscribe, { _id: sub._id });
          }
          throw error;
        }
      })
    );

    const successes = results.filter((r: any) => r.status === "fulfilled").length;
    console.log(`Sent push notification to user ${args.userId}: ${successes}/${subscriptions.length} delivered.`);
  },
});
