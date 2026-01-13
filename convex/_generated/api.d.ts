/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as collections from "../collections.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_domain_extractors from "../lib/domain_extractors.js";
import type * as lib_snapshot_processor from "../lib/snapshot_processor.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations_fix_uppercase_slugs from "../migrations/fix_uppercase_slugs.js";
import type * as public_ from "../public.js";
import type * as saves from "../saves.js";
import type * as snapshots from "../snapshots.js";
import type * as spaces from "../spaces.js";
import type * as tags from "../tags.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  collections: typeof collections;
  "lib/auth": typeof lib_auth;
  "lib/domain_extractors": typeof lib_domain_extractors;
  "lib/snapshot_processor": typeof lib_snapshot_processor;
  "lib/validators": typeof lib_validators;
  "migrations/fix_uppercase_slugs": typeof migrations_fix_uppercase_slugs;
  public: typeof public_;
  saves: typeof saves;
  snapshots: typeof snapshots;
  spaces: typeof spaces;
  tags: typeof tags;
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
