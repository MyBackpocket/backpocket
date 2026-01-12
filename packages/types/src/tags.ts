// Tag types

export interface Tag {
  id: string;
  spaceId: string;
  name: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  _count?: {
    saves: number;
  };
}

// API input types
export interface CreateTagInput {
  name: string;
}

export interface UpdateTagInput {
  id: string;
  name: string;
}

// API response types (dates serialized as strings over the wire)
export interface APITag {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    saves: number;
  };
}

