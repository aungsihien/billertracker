import React, { createContext, useContext, useRef } from 'react';

export interface BillerStatusEvent {
  id: string | number;
  status: string;
  [key: string]: any;
}

interface BillerStatusContextValue {
  subscribe: (fn: (event: BillerStatusEvent) => void) => () => void;
  publish: (event: BillerStatusEvent) => void;
}

const BillerStatusContext = createContext<BillerStatusContextValue | undefined>(undefined);

export const useBillerStatusSync = () => {
  const context = useContext(BillerStatusContext);
  if (!context) throw new Error('useBillerStatusSync must be used within BillerStatusProvider');
  return context;
};

export const BillerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<((event: BillerStatusEvent) => void)[]>([]);

  const subscribe = (fn: (event: BillerStatusEvent) => void) => {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter(l => l !== fn);
    };
  };

  const publish = (event: BillerStatusEvent) => {
    listeners.current.forEach(fn => fn(event));
  };

  return (
    <BillerStatusContext.Provider value={{ subscribe, publish }}>
      {children}
    </BillerStatusContext.Provider>
  );
};
