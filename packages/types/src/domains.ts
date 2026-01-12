// Domain types

export type DomainStatus =
  | "pending_verification"
  | "verified"
  | "active"
  | "error"
  | "disabled";

export interface DomainMapping {
  id: string;
  domain: string;
  spaceId: string;
  status: DomainStatus;
  verificationToken: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DomainStatusResponse {
  id: string;
  domain: string;
  status: DomainStatus;
  verified: boolean;
  misconfigured: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
  }>;
  createdAt: string;
}

export type SlugUnavailableReason =
  | "reserved"
  | "taken"
  | "too_short"
  | "too_long"
  | "invalid_format";

export interface SlugAvailability {
  available: boolean;
  reason: SlugUnavailableReason | null;
}

