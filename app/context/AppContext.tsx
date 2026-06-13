import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  cancelDailyReminder,
  scheduleDailyReminder,
} from ./utils/notifications";

export interface CallRecord {
  id: string;
  date: string;
  contactName: string;
  note?: string;
}

export type ParentMood = "happy" | "okay" | "miss" | null;

export interface ParentContact {
  id: string;
  name: string;
  phone: string;
  photoUri: string | null;
  relation: string;
}

interface AppContextType {
  role: "parent" | "child" | null;
  setRole: (role: "parent" | "child" | null) => void;
  // Child's own profile (shown on parent screen)
  childName: string;
  setChildName: (name: string) => void;
  childPhotoUri: string | null;
  setChildPhotoUri: (uri: string | null) => void;
  // Parent's phone for parent-screen back-call
  parentPhone: string;
  setParentPhone: (phone: string) => void;
  // Multiple contacts (elderly relatives the child calls)
  contacts: ParentContact[];
  addContact: (c: Omit<ParentContact, "id">) => void;
  updateContact: (id: string, updates: Partial<Omit<ParentContact, "id">>) => void;
  removeContact: (id: string) => void;
  // Mood (set by parent, shown on child contact card)
  parentMood: ParentMood;
  setParentMood: (mood: ParentMood) => void;
  // Onboarding
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  // Warm reminder (child → parent)
  hasPendingNotification: boolean;
  pendingMessage: string;
  sendReminder: (message: string) => void;
  clearNotification: () => void;
  // Call history
  callHistory: CallRecord[];
  logCall: (contactName: string, note?: string) => void;
  currentStreak: number;
  // Daily reminder notification
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  setReminder: (enabled: boolean, hour: number, minute: number) => Promise<void>;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = "warm_call_state_v2";

function computeStreak(history: CallRecord[]): number {
  if (history.length === 0) return 0;
  const days = Array.from(
    new Set(history.map((r) => r.date.slice(0, 10)))
  ).sort((a, b) => b.localeCompare(a));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<"parent" | "child" | null>(null);
  const [childName, setChildNameState] = useState("Маша");
  const [childPhotoUri, setChildPhotoUriState] = useState<string | null>(null);
  const [parentPhone, setParentPhoneState] = useState("+7 900 000 0000");
  const [contacts, setContacts] = useState<ParentContact[]>([]);
  const [parentMood, setParentMoodState] = useState<ParentMood>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasPendingNotification, setHasPendingNotification] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(19);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          // Try migrating from old key
          return AsyncStorage.getItem("warm_call_state").then((oldRaw) => {
            if (!oldRaw) return;
            const old = JSON.parse(oldRaw);
            if (old.role) setRoleState(old.role);
            if (old.childName) setChildNameState(old.childName);
            if (old.childPhotoUri) setChildPhotoUriState(old.childPhotoUri);
            if (old.parentPhone) setParentPhoneState(old.parentPhone);
            if (old.hasSeenOnboarding) setHasSeenOnboarding(old.hasSeenOnboarding);
            if (old.hasPendingNotification) setHasPendingNotification(old.hasPendingNotification);
            if (old.pendingMessage) setPendingMessage(old.pendingMessage);
            if (old.parentMood) setParentMoodState(old.parentMood);
            if (typeof old.reminderEnabled === "boolean") setReminderEnabled(old.reminderEnabled);
            if (typeof old.reminderHour === "number") setReminderHour(old.reminderHour);
            if (typeof old.reminderMinute === "number") setReminderMinute(old.reminderMinute);
            // Migrate old call history (parentName → contactName)
            if (Array.isArray(old.callHistory)) {
              setCallHistory(old.callHistory.map((r: { id: string; date: string; parentName?: string; contactName?: string; note?: string }) => ({
                ...r,
                contactName: r.contactName ?? r.parentName ?? "Мама",
              })));
            }
            // Migrate single parent contact
            if (old.parentName) {
              setContacts([{
                id: makeId(),
                name: old.parentName,
                phone: old.parentPhone || "+7 900 000 0000",
                photoUri: old.parentPhotoUri || null,
                relation: "Родитель",
              }]);
            }
          });
        }
        const s = JSON.parse(raw);
        if (s.role) setRoleState(s.role);
        if (s.childName) setChildNameState(s.childName);
        if (s.childPhotoUri) setChildPhotoUriState(s.childPhotoUri);
        if (s.parentPhone) setParentPhoneState(s.parentPhone);
        if (Array.isArray(s.contacts)) setContacts(s.contacts);
        if (s.parentMood) setParentMoodState(s.parentMood);
        if (s.hasSeenOnboarding) setHasSeenOnboarding(s.hasSeenOnboarding);
        if (s.hasPendingNotification) setHasPendingNotification(s.hasPendingNotification);
        if (s.pendingMessage) setPendingMessage(s.pendingMessage);
        if (Array.isArray(s.callHistory)) setCallHistory(s.callHistory);
        if (typeof s.reminderEnabled === "boolean") setReminderEnabled(s.reminderEnabled);
        if (typeof s.reminderHour === "number") setReminderHour(s.reminderHour);
        if (typeof s.reminderMinute === "number") setReminderMinute(s.reminderMinute);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback(
    (updates: Record<string, unknown>) => {
      const current = {
        role, childName, childPhotoUri, parentPhone,
        contacts, parentMood, hasSeenOnboarding,
        hasPendingNotification, pendingMessage, callHistory,
        reminderEnabled, reminderHour, reminderMinute,
        ...updates,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    },
    [role, childName, childPhotoUri, parentPhone, contacts, parentMood, hasSeenOnboarding,
      hasPendingNotification, pendingMessage, callHistory, reminderEnabled, reminderHour, reminderMinute]
  );

  const setRole = useCallback((r: "parent" | "child" | null) => { setRoleState(r); persist({ role: r }); }, [persist]);
  const setChildName = useCallback((n: string) => { setChildNameState(n); persist({ childName: n }); }, [persist]);
  const setChildPhotoUri = useCallback((u: string | null) => { setChildPhotoUriState(u); persist({ childPhotoUri: u }); }, [persist]);
  const setParentPhone = useCallback((p: string) => { setParentPhoneState(p); persist({ parentPhone: p }); }, [persist]);
  const setParentMood = useCallback((m: ParentMood) => { setParentMoodState(m); persist({ parentMood: m }); }, [persist]);
  const completeOnboarding = useCallback(() => { setHasSeenOnboarding(true); persist({ hasSeenOnboarding: true }); }, [persist]);

  const addContact = useCallback((c: Omit<ParentContact, "id">) => {
    setContacts((prev) => {
      const next = [...prev, { ...c, id: makeId() }];
      persist({ contacts: next });
      return next;
    });
  }, [persist]);

  const updateContact = useCallback((id: string, updates: Partial<Omit<ParentContact, "id">>) => {
    setContacts((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, ...updates } : c);
      persist({ contacts: next });
      return next;
    });
  }, [persist]);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist({ contacts: next });
      return next;
    });
  }, [persist]);

  const sendReminder = useCallback((message: string) => {
    setHasPendingNotification(true);
    setPendingMessage(message);
    persist({ hasPendingNotification: true, pendingMessage: message });
  }, [persist]);

  const clearNotification = useCallback(() => {
    setHasPendingNotification(false);
    setPendingMessage("");
    persist({ hasPendingNotification: false, pendingMessage: "" });
  }, [persist]);

  const logCall = useCallback((contactName: string, note?: string) => {
    const record: CallRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      contactName,
      note,
    };
    setCallHistory((prev) => {
      const next = [record, ...prev];
      persist({ callHistory: next });
      return next;
    });
  }, [persist]);

  const setReminder = useCallback(async (enabled: boolean, hour: number, minute: number) => {
    setReminderEnabled(enabled);
    setReminderHour(hour);
    setReminderMinute(minute);
    persist({ reminderEnabled: enabled, reminderHour: hour, reminderMinute: minute });
    const firstContactName = contacts[0]?.name ?? "мамой";
    if (enabled) await scheduleDailyReminder(hour, minute, firstContactName);
    else await cancelDailyReminder();
  }, [persist, contacts]);

  const currentStreak = computeStreak(callHistory);

  return (
    <AppContext.Provider value={{
      role, setRole,
      childName, setChildName,
      childPhotoUri, setChildPhotoUri,
      parentPhone, setParentPhone,
      contacts, addContact, updateContact, removeContact,
      parentMood, setParentMood,
      hasSeenOnboarding, completeOnboarding,
      hasPendingNotification, pendingMessage, sendReminder, clearNotification,
      callHistory, logCall, currentStreak,
      reminderEnabled, reminderHour, reminderMinute, setReminder,
      isLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
