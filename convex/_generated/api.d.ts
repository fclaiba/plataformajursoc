/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as correlatives from "../correlatives.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as matches from "../matches.js";
import type * as matchingEngine from "../matchingEngine.js";
import type * as matchingOrchestrator from "../matchingOrchestrator.js";
import type * as notifications from "../notifications.js";
import type * as ops from "../ops.js";
import type * as ranking from "../ranking.js";
import type * as requests from "../requests.js";
import type * as requestsRules from "../requestsRules.js";
import type * as resources from "../resources.js";
import type * as reviews from "../reviews.js";
import type * as subjects from "../subjects.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  chat: typeof chat;
  correlatives: typeof correlatives;
  health: typeof health;
  http: typeof http;
  matches: typeof matches;
  matchingEngine: typeof matchingEngine;
  matchingOrchestrator: typeof matchingOrchestrator;
  notifications: typeof notifications;
  ops: typeof ops;
  ranking: typeof ranking;
  requests: typeof requests;
  requestsRules: typeof requestsRules;
  resources: typeof resources;
  reviews: typeof reviews;
  subjects: typeof subjects;
  support: typeof support;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
