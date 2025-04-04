
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Association } from '../types';
import { useAuth } from './AuthContext';

interface AssociationContextType {
  currentAssociation: Association | null;
  isLoading: boolean;
  setCurrentAssociation: (association: Association | null) => void;
  updateAssociation: (data: Partial<Association>) => Promise<void>;
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export const useAssociation = () => {
  const context = useContext(AssociationContext);
  if (!context) {
    throw new Error('useAssociation must be used within an AssociationProvider');
  }
  return context;
};

export const AssociationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadAssociation = async () => {
      if (user?.associationId) {
        try {
          // Mock fetch association
          const mockAssociation: Association = {
            id: user.associationId,
            name: "Fantasy Club Association",
            description: "A community of fantasy enthusiasts organizing conventions and activities.",
            contactEmail: "contact@fantasyclub.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setCurrentAssociation(mockAssociation);
        } catch (error) {
          console.error("Error loading association:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadAssociation();
  }, [user]);

  const updateAssociation = async (data: Partial<Association>) => {
    setIsLoading(true);
    try {
      if (currentAssociation) {
        const updatedAssociation = {
          ...currentAssociation,
          ...data,
          updatedAt: new Date().toISOString()
        };
        setCurrentAssociation(updatedAssociation);
      }
    } catch (error) {
      console.error("Error updating association:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AssociationContext.Provider
      value={{
        currentAssociation,
        isLoading,
        setCurrentAssociation,
        updateAssociation
      }}
    >
      {children}
    </AssociationContext.Provider>
  );
};
