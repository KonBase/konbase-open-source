
// User related types
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  associationId?: string;
  profileImage?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Association related types
export interface Association {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

// Category related types
export interface Category {
  id: string;
  name: string;
  description?: string;
  associationId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Location related types
export interface Location {
  id: string;
  name: string;
  description?: string;
  associationId: string;
  parentId?: string;
  isRoom?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Item related types
export type ItemCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged' | 'retired';
export type ItemType = 'equipment' | 'consumable';

export interface Item {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  barcode?: string;
  condition: ItemCondition;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiration?: string;
  categoryId: string;
  locationId: string;
  associationId: string;
  isConsumable: boolean;
  quantity?: number;
  minimumQuantity?: number;
  image?: string;
  documents?: Document[];
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Document related types
export interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  itemId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Equipment Set related types
export interface EquipmentSet {
  id: string;
  name: string;
  description?: string;
  associationId: string;
  items: EquipmentSetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentSetItem {
  id: string;
  setId: string;
  itemId: string;
  quantity: number;
}

// Convention related types
export type ConventionStatus = 'planned' | 'active' | 'completed' | 'archived';

export interface Convention {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  associationId: string;
  status: ConventionStatus;
  createdAt: string;
  updatedAt: string;
}

// Equipment movement related types
export type MovementType = 'checkout' | 'return' | 'transfer';

export interface Movement {
  id: string;
  itemId: string;
  fromLocationId?: string;
  toLocationId: string;
  quantity: number;
  conventionId?: string;
  userId: string;
  movementType: MovementType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Requirement related types
export type RequirementStatus = 'requested' | 'approved' | 'fulfilled' | 'denied';

export interface Requirement {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  quantity: number;
  conventionId: string;
  locationId?: string;
  status: RequirementStatus;
  requestedBy: string;
  assignedItemIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Report related types
export type ReportType = 'inventory' | 'movement' | 'convention' | 'audit';

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  parameters?: Record<string, any>;
  associationId: string;
  createdBy: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification related types
export interface Notification {
  id: string;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// Audit log related types
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  changes?: Record<string, any>;
  createdAt: string;
  ipAddress?: string;
}

// Backup related types
export interface Backup {
  id: string;
  name: string;
  size: number;
  associationId: string;
  createdBy: string;
  fileUrl: string;
  createdAt: string;
}
