'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { nanoid } from '../lib/nanoid';

interface UserIdContextType {
  userId: string;
}

const UserIdContext = createContext<UserIdContextType | undefined>(undefined);

export function UserIdProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');

    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      const newUserId = nanoid();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }
  }, []);

  return (
    <UserIdContext.Provider value={{ userId }}>
      {children}
    </UserIdContext.Provider>
  );
}

export function useUserId() {
  const context = useContext(UserIdContext);
  if (context === undefined) {
    throw new Error('useUserId must be used within a UserIdProvider');
  }
  return context;
}