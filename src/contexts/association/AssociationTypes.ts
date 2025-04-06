
import { Association } from '@/types/association';

// Context state
export interface AssociationState {
  currentAssociation: Association | null;
  userAssociations: Association[];
  isLoading: boolean;
}

// Context methods
export interface AssociationContextMethods {
  setCurrentAssociation: (association: Association | null) => void;
  updateAssociation: (data: Partial<Association>) => Promise<void>;
  createAssociation: (data: Partial<Association>) => Promise<Association | null>;
}

// Complete context type
export type AssociationContextType = AssociationState & AssociationContextMethods;
