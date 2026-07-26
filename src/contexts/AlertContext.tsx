import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal, { AlertModalProps } from '../components/AlertModal';

type AlertContextType = {
  alert: (message: string, title?: string, type?: 'info' | 'success' | 'error') => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [modalProps, setModalProps] = useState<AlertModalProps | null>(null);
  
  // Use refs or something else to store the resolver for promises in confirm
  const [resolveConfirm, setResolveConfirm] = useState({ resolve: (value: boolean) => {} });
  const [resolveAlert, setResolveAlert] = useState({ resolve: () => {} });

  const alert = (message: string, title?: string, type: 'info' | 'success' | 'error' = 'info') => {
    return new Promise<void>((resolve) => {
      setResolveAlert({ resolve });
      setModalProps({
        isOpen: true,
        message,
        title,
        type,
        onClose: () => {
          setModalProps(null);
          resolve();
        }
      });
    });
  };

  const confirm = (message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setResolveConfirm({ resolve });
      setModalProps({
        isOpen: true,
        message,
        title,
        type: 'confirm',
        onClose: () => {
          setModalProps(null);
          resolve(false);
        },
        onConfirm: () => {
          resolve(true);
        }
      });
    });
  };

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      {modalProps && <AlertModal {...modalProps} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
