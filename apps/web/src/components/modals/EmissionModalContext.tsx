'use client';

import React, { createContext, useContext, useState } from 'react';

export type EmissionDocType = 'NFE' | 'NFCE' | 'NFSE' | 'CTE';

interface EmissionModalContextType {
  isOpen: boolean;
  docType: EmissionDocType;
  openEmissionModal: (type?: EmissionDocType) => void;
  closeEmissionModal: () => void;
}

const EmissionModalContext = createContext<EmissionModalContextType>({
  isOpen: false,
  docType: 'NFE',
  openEmissionModal: () => {},
  closeEmissionModal: () => {},
});

export const EmissionModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [docType, setDocType] = useState<EmissionDocType>('NFE');

  const openEmissionModal = (type: EmissionDocType = 'NFE') => {
    setDocType(type);
    setIsOpen(true);
  };

  const closeEmissionModal = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('modal')?.toUpperCase() as EmissionDocType | null;
      if (m && ['NFE', 'NFCE', 'NFSE', 'CTE'].includes(m)) {
        openEmissionModal(m);
      }
    } catch {}
  }, []);

  return (
    <EmissionModalContext.Provider
      value={{
        isOpen,
        docType,
        openEmissionModal,
        closeEmissionModal,
      }}
    >
      {children}
    </EmissionModalContext.Provider>
  );
};

export const useEmissionModal = () => useContext(EmissionModalContext);
