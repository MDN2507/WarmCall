import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  cancelDailyReminder,
  scheduleDailyReminder,
} from "../utils/notifications";

export interface CallRecord {
  id: string;
  timestamp: number;
  duration: number;
  type: 'incoming' | 'outgoing';
  status: 'completed' | 'missed' | 'cancelled';
}

export interface ParentContact {
  id: string;
  name: string;
  phoneNumber: string;
  photoUri?: string;
  relationship: string;
}

export interface ParentMood {
  id: string;
  parentId: string;
  mood: 'happy' | 'sad' | 'neutral';
  timestamp: number;
}

interface AppContextType {
  callRecords: CallRecord[];
  addCallRecord: (record: Omit<CallRecord, 'id'>) => void;
  parentContacts: ParentContact[];
  addParentContact: (contact: Omit<ParentContact, 'id'>) => void;
  updateParentContact: (id: string, updates: Partial<ParentContact>) => void;
  deleteParentContact: (id: string) => void;
  parentMoods: ParentMood[];
  addParentMood: (mood: Omit<ParentMood, 'id'>) => void;
  childName: string;
  setChildName: (name: string) => void;
  childPhotoUri: string | null;
  setChildPhotoUri: (uri: string | null) => void;
  reminderTime: string | null;
  setReminderTime: (time: string | null) => void;
  dailyReminderEnabled: boolean;
  setDailyReminderEnabled: (enabled: boolean) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [parentContacts, setParentContacts] = useState<ParentContact[]>([]);
  const [parentMoods, setParentMoods] = useState<ParentMood[]>([]);
  const [childName, setChildName] = useState('');
  const [childPhotoUri, setChildPhotoUri] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addCallRecord = (record: Omit<CallRecord, 'id'>) => {
    const newRecord: CallRecord = {
      ...record,
      id: Date.now().toString(),
    };
    setCallRecords(prev => [newRecord, ...prev]);
  };

  const addParentContact = (contact: Omit<ParentContact, 'id'>) => {
    const newContact: ParentContact = {
      ...contact,
      id: Date.now().toString(),
    };
    setParentContacts(prev => [...prev, newContact]);
  };

  const updateParentContact = (id: string, updates: Partial<ParentContact>) => {
    setParentContacts(prev =>
      prev.map(contact =>
        contact.id === id ? { ...contact, ...updates } : contact
      )
    );
  };

  const deleteParentContact = (id: string) => {
    setParentContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const addParentMood = (mood: Omit<ParentMood, 'id'>) => {
    const newMood: ParentMood = {
      ...mood,
      id: Date.now().toString(),
    };
    setParentMoods(prev => [...prev, newMood]);
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  useEffect(() => {
    if (dailyReminderEnabled && reminderTime) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const now = new Date();
      const scheduled = new Date();
      scheduled.setHours(hours, minutes, 0, 0);
      
      let delay = scheduled.getTime() - now.getTime();
      if (delay < 0) {
        delay += 24 * 60 * 60 * 1000;
      }
      
      reminderTimeoutRef.current = setTimeout(() => {
        scheduleDailyReminder();
      }, delay);
    } else if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
      cancelDailyReminder();
    }
    
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, [dailyReminderEnabled, reminderTime]);

  const value = {
    callRecords,
    addCallRecord,
    parentContacts,
    addParentContact,
    updateParentContact,
    deleteParentContact,
    parentMoods,
    addParentMood,
    childName,
    setChildName,
    childPhotoUri,
    setChildPhotoUri,
    reminderTime,
    setReminderTime,
    dailyReminderEnabled,
    setDailyReminderEnabled,
    hasCompletedOnboarding,
    completeOnboarding,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
