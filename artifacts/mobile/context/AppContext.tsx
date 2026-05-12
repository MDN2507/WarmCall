import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CallRecord {
  id: string;
  date: string;
  parentName: string;
  note?: string;
}

interface AppContextType {
  role: "parent" | "child" | null;
  setRole: (role: "parent" | "child" | null) => void;
  parentName: string;
  setParentName: (name: string) => void;
  parentPhone: string;
  setParentPhone: (phone: string) => void;
  childName: string;
  setChildName: (name: string) => void;
  hasPendingNotification: boolean;
  pendingMessage: string;
  sendReminder: (message: string) => void;
  clearNotification: () => void;
  callHistory: CallRecord[];
  logCall: (note?: string) => void;
  currentStreak: number;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "warm_call_state";

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
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<"parent" | "child" | null>(null);
  const [parentName, setParentNameState] = useState("Мама");
  const [parentPhone, setParentPhoneState] = useState("+7 900 000 0000");
  const [childName, setChildNameState] = useState("Маша");
  const [hasPendingNotification, setHasPendingNotification] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.role) setRoleState(saved.role);
          if (saved.parentName) setParentNameState(saved.parentName);
          if (saved.parentPhone) setParentPhoneState(saved.parentPhone);
          if (saved.childName) setChildNameState(saved.childName);
          if (saved.hasPendingNotification)
            setHasPendingNotification(saved.hasPendingNotification);
          if (saved.pendingMessage) setPendingMessage(saved.pendingMessage);
          if (Array.isArray(saved.callHistory)) setCallHistory(saved.callHistory);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback(
    (updates: Record<string, unknown>) => {
      const current = {
        role,
        parentName,
        parentPhone,
        childName,
        hasPendingNotification,
        pendingMessage,
        callHistory,
        ...updates,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    },
    [role, parentName, parentPhone, childName, hasPendingNotification, pendingMessage, callHistory]
  );

  const setRole = useCallback(
    (r: "parent" | "child" | null) => { setRoleState(r); persist({ role: r }); },
    [persist]
  );
  const setParentName = useCallback(
    (n: string) => { setParentNameState(n); persist({ parentName: n }); },
    [persist]
  );
  const setParentPhone = useCallback(
    (p: string) => { setParentPhoneState(p); persist({ parentPhone: p }); },
    [persist]
  );
  const setChildName = useCallback(
    (n: string) => { setChildNameState(n); persist({ childName: n }); },
    [persist]
  );
  const sendReminder = useCallback(
    (message: string) => {
      setHasPendingNotification(true);
      setPendingMessage(message);
      persist({ hasPendingNotification: true, pendingMessage: message });
    },
    [persist]
  );
  const clearNotification = useCallback(() => {
    setHasPendingNotification(false);
    setPendingMessage("");
    persist({ hasPendingNotification: false, pendingMessage: "" });
  }, [persist]);

  const logCall = useCallback(
    (note?: string) => {
      const record: CallRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        parentName,
        note,
      };
      const next = [record, ...callHistory];
      setCallHistory(next);
      persist({ callHistory: next });
    },
    [callHistory, parentName, persist]
  );

  const currentStreak = computeStreak(callHistory);

  return (
    <AppContext.Provider
      value={{
        role, setRole,
        parentName, setParentName,
        parentPhone, setParentPhone,
        childName, setChildName,
        hasPendingNotification, pendingMessage,
        sendReminder, clearNotification,
        callHistory, logCall, currentStreak,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
