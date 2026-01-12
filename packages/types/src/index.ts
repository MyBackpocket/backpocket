// @backpocket/types - Shared type definitions

// Saves
export type {
  APISave,
  CheckDuplicateInput,
  CheckDuplicateResponse,
  CreateSaveInput,
  DashboardData,
  DuplicateSaveErrorCause,
  DuplicateSaveErrorData,
  DuplicateSaveInfo,
  ListSavesInput,
  ListSavesResponse,
  PublicSave,
  Save,
  SaveVisibility,
  StatsResponse,
  UpdateSaveInput,
} from "./saves";

// Collections
export type {
  APICollection,
  Collection,
  CollectionVisibility,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "./collections";

// Tags
export type { APITag, CreateTagInput, Tag, UpdateTagInput } from "./tags";

// Spaces
export type {
  Membership,
  MembershipRole,
  MembershipStatus,
  PublicLayout,
  PublicSpace,
  Space,
  SpaceSettingsInput,
  SpaceType,
  SpaceVisibility,
} from "./spaces";

// Snapshots
export type {
  GetSaveSnapshotInput,
  GetSaveSnapshotResponse,
  SaveSnapshot,
  SnapshotBlockedReason,
  SnapshotContent,
  SnapshotStatus,
} from "./snapshots";

// Domains
export type {
  DomainMapping,
  DomainStatus,
  DomainStatusResponse,
  SlugAvailability,
  SlugUnavailableReason,
} from "./domains";

