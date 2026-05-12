import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type ParentMood } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const MOODS: { id: ParentMood; emoji: string; label: string }[] = [
  { id: "happy", emoji: "😊", label: "Хорошо" },
  { id: "okay", emoji: "😐", label: "Так себе" },
  { id: "miss", emoji: "🥺", label: "Скучаю" },
];

function getGreeting(): { text: string; icon: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Доброе утро", icon: "☀️" };
  if (h >= 12 && h < 18) return { text: "Добрый день", icon: "🌤️" };
  if (h >= 18 && h < 23) return { text: "Добрый вечер", icon: "🌙" };
  return { text: "Не спишь?", icon: "⭐" };
}

function formatLastCall(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayStr = d.toISOString().slice(0, 10);

  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (dayStr === todayStr) return `Сегодня в ${time}`;
  if (dayStr === yestStr) return `Вчера в ${time}`;
  const days = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (days < 7) return `${days} дня назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function PulsingButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring1, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(ring2, { toValue: 1.7, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }, 400);
  }, []);

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.pulseWrapper}>
      <Animated.View style={[styles.ring, { backgroundColor: colors.primary, transform: [{ scale: ring2 }], opacity: ring2Opacity }]} />
      <Animated.View style={[styles.ring, { backgroundColor: colors.primary, transform: [{ scale: ring1 }], opacity: ring1Opacity }]} />
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.callButton, { backgroundColor: colors.primary, transform: [{ scale: btnScale }] }]}>
          <Feather name="phone-call" size={52} color="#fff" />
          <Text style={[styles.callButtonText, { fontFamily: "Nunito_700Bold" }]}>Позвонить</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function ParentScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    childName, parentPhone, parentName,
    hasPendingNotification, pendingMessage, clearNotification,
    childPhotoUri, callHistory, currentStreak,
    parentMood, setParentMood,
  } = useApp();

  const greeting = getGreeting();
  const lastCall = callHistory.length > 0 ? callHistory[0] : null;
  const [moodSaved, setMoodSaved] = useState(false);
  const moodSavedScale = useRef(new Animated.Value(0)).current;

  const bgAnim = useRef(new Animated.Value(hasPendingNotification ? 1 : 0)).current;
  const notifScale = useRef(new Animated.Value(hasPendingNotification ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgAnim, { toValue: hasPendingNotification ? 1 : 0, duration: 800, useNativeDriver: false }),
      Animated.spring(notifScale, { toValue: hasPendingNotification ? 1 : 0, useNativeDriver: true }),
    ]).start();
  }, [hasPendingNotification]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.goldenLight ?? "#FFFACC"],
  });

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${parentPhone.replace(/\s/g, "")}`);
    clearNotification();
  };

  const handleMood = (mood: ParentMood) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setParentMood(mood);
    setMoodSaved(true);
    Animated.spring(moodSavedScale, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => {
      setMoodSaved(false);
      Animated.timing(moodSavedScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 2500);
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
          Режим родителя
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/setup", params: { edit: "1" } })}
          style={styles.backBtn}
        >
          <Feather name="edit-2" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={[styles.greetingCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Text style={styles.greetingEmoji}>{greeting.icon}</Text>
          <View>
            <Text style={[styles.greetingText, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
              {greeting.text}, {parentName}!
            </Text>
            <Text style={[styles.greetingDate, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </View>
        </View>

        {/* Notification banner */}
        {hasPendingNotification && (
          <Animated.View style={[styles.notifBanner, { backgroundColor: colors.golden ?? "#FFD700", transform: [{ scale: notifScale }] }]}>
            <Text style={[styles.notifText, { fontFamily: "Nunito_700Bold" }]}>💛 Дети ждут тебя!</Text>
            {pendingMessage ? (
              <Text style={[styles.notifMessage, { fontFamily: "Nunito_400Regular" }]}>{pendingMessage}</Text>
            ) : null}
          </Animated.View>
        )}

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
            <Image
              source={childPhotoUri ? { uri: childPhotoUri } : require("@/assets/images/child-placeholder.png")}
              style={styles.avatar}
            />
          </View>
          <Text style={[styles.waitingText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Жду тебя,
          </Text>
          <Text style={[styles.childName, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {childName}
          </Text>

          {/* Last call + streak */}
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="clock" size={15} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
                {lastCall ? formatLastCall(lastCall.date) : "Ещё не звонили"}
              </Text>
            </View>
            {currentStreak > 0 && (
              <View style={[styles.statChip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[styles.statText, { color: "#fff", fontFamily: "Nunito_700Bold" }]}>
                  {currentStreak} {currentStreak === 1 ? "день" : "дня"} подряд 🔥
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Call button */}
        <PulsingButton onPress={handleCall} />

        {/* Mood section */}
        <View style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.moodTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Как ты сейчас?
          </Text>
          <Text style={[styles.moodSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            {childName} увидит твоё настроение
          </Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const active = parentMood === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => handleMood(m.id)}
                  style={[
                    styles.moodBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: active ? "#fff" : colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {moodSaved && (
            <Animated.View style={[styles.moodSavedBadge, { backgroundColor: colors.accent, transform: [{ scale: moodSavedScale }] }]}>
              <Feather name="check" size={16} color={colors.text} />
              <Text style={[styles.moodSavedText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                {childName} теперь знает ❤️
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Нажми «Позвонить» — {childName} возьмёт трубку и услышит твой голос
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const CALL_BTN_SIZE = 170;
const RING_SIZE = CALL_BTN_SIZE;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
    alignItems: "center",
  },

  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
  },
  greetingEmoji: { fontSize: 34 },
  greetingText: { fontSize: 20 },
  greetingDate: { fontSize: 14, marginTop: 2 },

  notifBanner: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 6,
    width: "100%",
    shadowColor: "#D4A800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  notifText: { fontSize: 22, color: "#4A3B00" },
  notifMessage: { fontSize: 16, color: "#4A3B00", textAlign: "center" },

  avatarSection: { alignItems: "center", gap: 8, width: "100%" },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    padding: 4,
    marginBottom: 4,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: "100%" as unknown as number,
    height: "100%" as unknown as number,
    borderRadius: 75,
  },
  waitingText: { fontSize: 20 },
  childName: { fontSize: 36 },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 4 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statText: { fontSize: 14 },

  pulseWrapper: {
    width: CALL_BTN_SIZE + 80,
    height: CALL_BTN_SIZE + 80,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
  },
  callButton: {
    width: CALL_BTN_SIZE,
    height: CALL_BTN_SIZE,
    borderRadius: CALL_BTN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  callButtonText: { fontSize: 22, color: "#fff" },

  moodCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  moodTitle: { fontSize: 22, textAlign: "center" },
  moodSubtitle: { fontSize: 15, textAlign: "center", marginTop: -4 },
  moodRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  moodBtn: {
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  moodEmoji: { fontSize: 30 },
  moodLabel: { fontSize: 14 },
  moodSavedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moodSavedText: { fontSize: 15 },

  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },
  tipEmoji: { fontSize: 20 },
  tipText: { fontSize: 15, flex: 1, lineHeight: 22 },
});
