import { now } from "./utils";

export const writeOperationalLog = async (
  ctx: any,
  args: {
    domain: string;
    level: "info" | "warning" | "error";
    message: string;
    metadata?: any;
    actorUserId?: any;
  },
) => {
  await ctx.db.insert("operationalLogs", {
    domain: args.domain,
    level: args.level,
    message: args.message,
    metadata: args.metadata,
    actorUserId: args.actorUserId,
    createdAt: now(),
  });
};
