/* eslint-disable */
/**
 * Generated data model - run `bunx convex dev` to regenerate
 */

import type { GenericDataModel, GenericDocument, GenericId } from "convex/server";

export type Id<TableName extends TableNames> = GenericId<TableName>;

export type TableNames =
  | "spaces"
  | "memberships"
  | "tags"
  | "collections"
  | "saves"
  | "saveTags"
  | "saveCollections"
  | "collectionDefaultTags"
  | "saveSnapshots"
  | "domainMappings"
  | "visitCounts"
  | "snapshotRateLimits";

export type DataModel = GenericDataModel;
