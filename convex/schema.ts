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
    approvedSubjectExternalIds: v.optional(v.array(v.string())),
    documentUrls: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  subjects: defineTable({
    externalId: v.string(),
    code: v.string(),
    name: v.string(),
    year: v.number(),
    plan: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_external", ["externalId"]),

  cathedras: defineTable({
    externalId: v.string(),
    subjectId: v.id("subjects"),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_external", ["externalId"]),

  commissions: defineTable({
    externalId: v.string(),
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
    .index("by_cathedra", ["cathedraId"])
    .index("by_external", ["externalId"]),

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
    giveToRequestId: v.optional(v.id("requests")),
    receiveFromRequestId: v.optional(v.id("requests")),
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

  operationalLogs: defineTable({
    domain: v.string(),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
    message: v.string(),
    metadata: v.optional(v.any()),
    actorUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_domain", ["domain"]),

  matchingJobs: defineTable({
    subjectId: v.id("subjects"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    nextRunAt: v.number(),
    runToken: v.optional(v.string()),
    lastError: v.optional(v.string()),
    lastMatchedPairs: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subject", ["subjectId"]),

  threads: defineTable({
    pairKey: v.optional(v.string()),
    requestId: v.id("requests"),
    userAId: v.id("users"),
    userBId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_request", ["requestId"])
    .index("by_pair_key", ["pairKey"]),

  messages: defineTable({
    threadId: v.id("threads"),
    requestId: v.id("requests"),
    senderUserId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    mediaUrl: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_request", ["requestId"]),

  subjectResources: defineTable({
    subjectExternalId: v.string(),
    category: v.union(v.literal("biblio"), v.literal("apuntes"), v.literal("resumenes")),
    title: v.string(),
    author: v.optional(v.string()),
    type: v.union(v.literal("pdf"), v.literal("link"), v.literal("video")),
    url: v.string(),
    size: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_subject_category", ["subjectExternalId", "category"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    source: v.optional(v.union(v.literal("auth"), v.literal("requests"), v.literal("chat"), v.literal("ranking"), v.literal("system"))),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  supportReports: defineTable({
    userId: v.id("users"),
    category: v.union(v.literal("bug"), v.literal("abuse"), v.literal("support")),
    message: v.string(),
    status: v.union(v.literal("open"), v.literal("reviewed"), v.literal("closed")),
    createdAt: v.number(),
    updatedAt: v.number(),
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
    subjectExternalIds: v.array(v.string()),
    cathedraExternalIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

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

  rateLimits: defineTable({
    key: v.string(),       // e.g. "createRequest:<userId>"
    hits: v.number(),
    windowStart: v.number(),
  }).index("by_key", ["key"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});
