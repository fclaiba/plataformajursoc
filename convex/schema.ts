import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
    reputation: v.optional(v.number()),
    reviewsCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  subjects: defineTable({
    code: v.string(),
    name: v.string(),
    year: v.number(),
    plan: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  cathedras: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subject", ["subjectId"]),

  commissions: defineTable({
    subjectId: v.id("subjects"),
    cathedraId: v.id("cathedras"),
    number: v.number(),
    professor: v.string(),
    seatsTotal: v.number(),
    seatsAvailable: v.number(),
    schedules: v.array(
      v.object({
        day: v.string(),
        start: v.string(),
        end: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_cathedra", ["cathedraId"]),

  enrollments: defineTable({
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    cathedraId: v.id("cathedras"),
    commissionId: v.id("commissions"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_subject", ["userId", "subjectId"]),

  requests: defineTable({
    userId: v.id("users"),
    subjectId: v.id("subjects"),
    commissionOriginId: v.id("commissions"),
    destinations: v.array(
      v.object({
        commissionId: v.id("commissions"),
        priority: v.number(),
      }),
    ),
    status: v.union(
      v.literal("PENDING"),
      v.literal("MATCHED"),
      v.literal("CONFIRMED"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
    matchedRequestId: v.optional(v.id("requests")),
    finalizedBy: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_subject_status", ["subjectId", "status"]),

  requestEvents: defineTable({
    requestId: v.id("requests"),
    actorUserId: v.optional(v.id("users")),
    type: v.string(),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_request", ["requestId"]),

  threads: defineTable({
    requestId: v.id("requests"),
    userAId: v.id("users"),
    userBId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_request", ["requestId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    requestId: v.id("requests"),
    senderUserId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    mediaUrl: v.optional(v.string()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_request", ["requestId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    source: v.optional(v.union(v.literal("auth"), v.literal("requests"), v.literal("chat"), v.literal("ranking"), v.literal("system"))),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  reviews: defineTable({
    requestId: v.id("requests"),
    reviewerUserId: v.id("users"),
    targetUserId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_target", ["targetUserId"])
    .index("by_request_reviewer", ["requestId", "reviewerUserId"]),

  professors: defineTable({
    name: v.string(),
    roles: v.array(v.string()),
    subjectIds: v.array(v.id("subjects")),
    cathedraIds: v.array(v.id("cathedras")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  votes: defineTable({
    voterUserId: v.id("users"),
    winnerProfessorId: v.id("professors"),
    loserProfessorId: v.id("professors"),
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
    pairHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_voter", ["voterUserId"])
    .index("by_pair_context", ["pairHash", "contextType", "contextId"]),

  ratingSnapshots: defineTable({
    professorId: v.id("professors"),
    contextType: v.union(v.literal("general"), v.literal("subject"), v.literal("cathedra")),
    contextId: v.string(),
    elo: v.number(),
    matches: v.number(),
    wins: v.number(),
    updatedAt: v.number(),
  }).index("by_context", ["contextType", "contextId"]),
});
