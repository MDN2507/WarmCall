import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const REMINDER_MESSAGES = [
  "Сегодня хорошая погода — как у мамы в саду?",
  "Папа смотрел телепередачу, как у него дела?",
  "Давно не говорили — скучаю по тебе!",
  "Как твои ноги? Не забудь про лекарства!",
  "Что приготовила сегодня на обед?",
  "Как соседи? Расскажи последние новости!",
  "Думаю о тебе — просто хотел/а напомнить о себе",
];

const TOPICS = [
  ["О погоде", "Какая сегодня погода у тебя?"],
  ["О здоровье", "Как самочувствие? Ноги не болят?"],
  ["О готовке", "Что приготовила вкусненькое?"],
  ["О планах", "Что планируешь на выходных?"],
  ["О новостях", "Что нового? Как соседи?"],
  ["О воспоминаниях", "Расскажи о своей молодости"],
  ["О сне", "Как спала? Хорошо отдохнула?"],
  ["О погоде в саду", "Как твой огород?"],
];

function ActionButton({
  icon,
  label,
  subtitle,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.actionBtn,
          { backgroundColor: color, transform: [{ scale }] },
        ]}
      >
        <View style={styles.actionBtnLeft}>
          <View style={[styles.actionIconCircle, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
            <Feather name={icon as "phone"} size={26} color="#fff" />
          </View>
          <View>
            <Text style={[styles.actionLabel, { fontFamily: "Nunito_700Bold" }]}>
              {label}
            </Text>
            <Text style={[styles.actionSubtitle, { fontFamily: "Nunito_400Regular" }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
      </Animated.View>
    </Pressable>
  );
}

function TopicsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [topics] = useState(() => {
    const shuffled = [...TOPICS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            Темы для разговора
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Выбери, о чём спросить сегодня
          </Text>
          <View style={styles.topicsList}>
            {topics.map(([title, desc], i) => (
              <Pressable
                key={i}
                style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onClose}
              >
                <View style={[styles.topicNumber, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.topicNumberText, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={styles.topicTextBlock}>
                  <Text style={[styles.topicTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
                    {title}
                  </Text>
                  <Text style={[styles.topicDesc, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                    {desc}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.closeBtnText, { fontFamily: "Nunito_700Bold" }]}>
              Понятно, спасибо!
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ChildScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { parentName, parentPhone, sendReminder, logCall, currentStreak } = useApp();
  const [topicsVisible, setTopicsVisible] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;

  const getRandomMessage = () =>
    REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

  const handleReminder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const msg = getRandomMessage();
    sendReminder(msg);
    setReminderSent(true);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => {
      setReminderSent(false);
      Animated.timing(checkScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 3000);
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    logCall();
    Linking.openURL(`tel:${parentPhone.replace(/\s/g, "")}`);
    setTimeout(() => {
      router.push("/(tabs)/feedback");
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
          Тёплый звонок
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/setup", params: { edit: "1" } })}
          style={styles.backBtn}
        >
          <Feather name="edit-2" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.parentCard}>
          <View style={[styles.parentAvatarRing, { borderColor: colors.accent }]}>
            <Image
              source={require("@/assets/images/parent-placeholder.png")}
              style={styles.parentAvatar}
            />
          </View>
          <Text style={[styles.parentLabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Связь с
          </Text>
          <Text style={[styles.parentName, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {parentName}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton
            icon="send"
            label="Тёплое напоминание"
            subtitle="Отправить сигнал заботы"
            color={colors.secondary}
            onPress={handleReminder}
          />

          {reminderSent && (
            <Animated.View
              style={[
                styles.sentBanner,
                { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: checkScale }] },
              ]}
            >
              <Feather name="check-circle" size={20} color="#5DAA68" />
              <Text style={[styles.sentText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                Родитель знает, что ты думаешь о нём
              </Text>
            </Animated.View>
          )}

          <ActionButton
            icon="phone-call"
            label="Быстрый звонок"
            subtitle={parentPhone}
            color={colors.primary}
            onPress={handleCall}
          />

          <ActionButton
            icon="message-circle"
            label="Темы для разговора"
            subtitle="3 идеи, о чём поговорить"
            color={colors.accent}
            onPress={() => setTopicsVisible(true)}
          />

          <Pressable
            style={[styles.historyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/history")}
          >
            <Feather name="clock" size={20} color={colors.mutedForeground} />
            <Text style={[styles.historyBtnText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
              История звонков
            </Text>
            {currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.streakBadgeText, { fontFamily: "Nunito_700Bold" }]}>
                  {currentStreak} 🔥
                </Text>
              </View>
            )}
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="sun" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Даже 5 минут разговора делают пожилых людей счастливее на целый день
          </Text>
        </View>
      </ScrollView>

      <TopicsModal visible={topicsVisible} onClose={() => setTopicsVisible(false)} />
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18 },
  content: {
    paddingHorizontal: 20,
    gap: 20,
    paddingTop: 8,
  },
  parentCard: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  parentAvatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    padding: 3,
    marginBottom: 6,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  parentAvatar: {
    width: "100%" as unknown as number,
    height: "100%" as unknown as number,
    borderRadius: 60,
  },
  parentLabel: { fontSize: 18 },
  parentName: { fontSize: 32 },
  actions: { gap: 14 },
  actionBtn: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 20, color: "#fff" },
  actionSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  sentBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sentText: { fontSize: 16, flex: 1 },
  historyBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyBtnText: { fontSize: 18, flex: 1 },
  streakBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakBadgeText: { fontSize: 14, color: "#fff" },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipText: { fontSize: 16, flex: 1, lineHeight: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 28, textAlign: "center" },
  modalSubtitle: { fontSize: 17, textAlign: "center" },
  topicsList: { gap: 12 },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topicNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topicNumberText: { fontSize: 18 },
  topicTextBlock: { flex: 1, gap: 2 },
  topicTitle: { fontSize: 20 },
  topicDesc: { fontSize: 15 },
  closeBtn: {
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: { fontSize: 20, color: "#fff" },
});
