/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as achievements from "../achievements.js";
import type * as admin from "../admin.js";
import type * as crons from "../crons.js";
import type * as entitlements from "../entitlements.js";
import type * as http from "../http.js";
import type * as leaderboards from "../leaderboards.js";
import type * as progress from "../progress.js";
import type * as push from "../push.js";
import type * as ranking from "../ranking.js";
import type * as reminders from "../reminders.js";
import type * as results from "../results.js";
import type * as schedule from "../schedule.js";
import type * as scoring from "../scoring.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  achievements: typeof achievements;
  admin: typeof admin;
  crons: typeof crons;
  entitlements: typeof entitlements;
  http: typeof http;
  leaderboards: typeof leaderboards;
  progress: typeof progress;
  push: typeof push;
  ranking: typeof ranking;
  reminders: typeof reminders;
  results: typeof results;
  schedule: typeof schedule;
  scoring: typeof scoring;
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
