// Space types

export type SpaceType = "personal" | "org";
export type SpaceVisibility = "public" | "private";
export type PublicLayout = "list" | "grid";

export type MembershipRole = "owner" | "admin" | "writer" | "viewer";
export type MembershipStatus = "active" | "invited" | "removed";

export interface Space {
  id: string;
  type: SpaceType;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SpaceVisibility;
  publicLayout: PublicLayout;
  defaultSaveVisibility: SaveVisibility;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Membership {
  id: string;
  spaceId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SpaceSettingsInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  visibility?: SpaceVisibility;
  publicLayout?: PublicLayout;
  defaultSaveVisibility?: SaveVisibility;
}

// Public types (for public space viewing)
export interface PublicSpace {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  publicLayout: PublicLayout;
  visitCount: number;
}

// Re-export for convenience
import type { SaveVisibility } from "./saves";

