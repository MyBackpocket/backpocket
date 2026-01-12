/* eslint-disable */
/**
 * Generated API types - run `bunx convex dev` to regenerate
 * This is a placeholder that will be replaced by Convex
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as collections from "../collections";
import type * as public_ from "../public";
import type * as saves from "../saves";
import type * as snapshots from "../snapshots";
import type * as spaces from "../spaces";
import type * as tags from "../tags";

declare const fullApi: ApiFromModules<{
  collections: typeof collections;
  public: typeof public_;
  saves: typeof saves;
  snapshots: typeof snapshots;
  spaces: typeof spaces;
  tags: typeof tags;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
