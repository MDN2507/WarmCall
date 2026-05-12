import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CallRecord, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function groupByDate(records: CallRecord[]) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const groups: { label: string; items: CallRecord[] }[] = [];
  const map: Record<string, CallRecord[]> = {};

  for (const r of records) {
    const day = r.date.slice(0, 10);
    if (!map[day]) map[day] = [];
    map[day].push(r);
  }

  const days = Object.keys(map).sort((a, b) => b.localeCompare(a));
  for (const day of days) {
    let label = day;
    if (day === today) label = "Сегодня";
    else if (day === yesterday) label = "Вчера";
    else {
      const d = new Date(day);
      label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    }
    groups.push({ label, items: map[day] });
  }
  return groups;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function StreakCard({ streak }: { streak: number }) {
  const colors = useColors();
  const emojis = ["🌱", "🌿", "🌸", "🌺", "🌻", "🔥", "⭐", "🌟", "💫", "🏆"];
  const icon = emojis[Math.min(streak - 1, emojis.length - 1)] ?? "📞";

  return (
    <View style={[styles.streakCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
      <Text style={styles.streakEmoji}>{streak > 0 ? icon : "📞"}</Text>
      <View style={styles.streakText}>
        <Text style={[styles.streakCount, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
          {streak > 0 ? `${streak} ${streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд` : "Начни серию!"}
        </Text>
        <Text style={[styles.streakSub, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          {streak > 0
            ? "Отличная забота о близких"
            : "Позвони сегодня и начни серию звонков"}
        </Text>
      </View>
    </View>
  );
}

function CallItem({ record, isLast }: { record: CallRecord; isLast: boolean }) {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={[
        styles.callItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderBottomWidth: isLast ? 0 : 1,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={[styles.callIcon, { backgroundColor: colors.accent }]}>
        <Feather name="phone-call" size={18} color={colors.text} />
      </View>
      <View style={styles.callInfo}>
        <Text style={[styles.callName, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
          {record.parentName}
        </Text>
        {record.note ? (
          <Text
            style={[styles.callNote, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}
            numberOfLines={1}
          >
            {record.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.callTime, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
        {formatTime(record.date)}
      </Text>
    </Animated.View>
  );
}

function EmptyState() {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(0.9)).current;
  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8 }).start();
  }, []);

  return (
    <Animated.View style={[styles.empty, { transform: [{ scale }] }]}>
      <Text style={styles.emptyEmoji}>📱</Text>
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
        Пока нет звонков
      </Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
        После первого звонка здесь появится история. Позвони маме прямо сейчас!
      </Text>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callHistory, currentStreak } = useApp();

  const groups = groupByDate(callHistory);
  const totalThisWeek = callHistory.filter((r) => {
    const d = new Date(r.date);
    const now = new Date();
    return now.getTime() - d.getTime() < 7 * 86400000;
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
          История звонков
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <StreakCard streak={currentStreak} />

        {callHistory.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary, fontFamily: "Nunito_800ExtraBold" }]}>
                {callHistory.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                всего звонков
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary, fontFamily: "Nunito_800ExtraBold" }]}>
                {totalThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                за эту неделю
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.primary, fontFamily: "Nunito_800ExtraBold" }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                {currentStreak === 1 ? "день" : "дней"} подряд
              </Text>
            </View>
          </View>
        )}

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
                {group.label}
              </Text>
              <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {group.items.map((item, i) => (
                  <CallItem
                    key={item.id}
                    record={item}
                    isLast={i === group.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 22 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },

  streakCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  streakEmoji: { fontSize: 40 },
  streakText: { flex: 1, gap: 4 },
  streakCount: { fontSize: 22 },
  streakSub: { fontSize: 15, lineHeight: 22 },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 30 },
  statLabel: { fontSize: 13, textAlign: "center" },

  group: { gap: 8 },
  groupLabel: { fontSize: 16, marginLeft: 4 },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  callIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  callInfo: { flex: 1, gap: 2 },
  callName: { fontSize: 18 },
  callNote: { fontSize: 14 },
  callTime: { fontSize: 15 },

  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 24 },
  emptySub: { fontSize: 17, textAlign: "center", lineHeight: 26 },
});
