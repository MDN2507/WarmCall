import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function HeartBurst() {
  const colors = useColors();
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    scale: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    delay: i * 80,
    angle: (i / 6) * 360,
  }));

  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const bigHeartOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(bigHeartScale, {
        toValue: 1,
        damping: 6,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bigHeartOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
    ]).start();

    hearts.forEach(({ scale, opacity, translateY, translateX, delay, angle }) => {
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad) * 70;
      const dy = Math.sin(rad) * 70;
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: dx, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: dy - 20, duration: 600, useNativeDriver: true }),
        ]).start(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        });
      }, delay);
    });
  }, []);

  return (
    <View style={styles.heartBurstContainer}>
      {hearts.map((h, i) => (
        <Animated.View
          key={i}
          style={[
            styles.floatingHeart,
            {
              opacity: h.opacity,
              transform: [
                { scale: h.scale },
                { translateX: h.translateX },
                { translateY: h.translateY },
              ],
            },
          ]}
        >
          <Feather name="heart" size={20} color={colors.primary} />
        </Animated.View>
      ))}
      <Animated.View
        style={[
          styles.bigHeart,
          {
            transform: [{ scale: bigHeartScale }],
          },
        ]}
      >
        <Feather name="heart" size={120} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

export default function FeedbackScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }, 400);
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32, paddingTop: insets.top + 24 }]}
    >
      <View style={styles.content}>
        <HeartBurst />

        <Animated.View
          style={[
            styles.textBlock,
            { opacity: textOpacity, transform: [{ translateY: textTranslate }] },
          ]}
        >
          <Text style={[styles.headline, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            Отлично!
          </Text>
          <Text style={[styles.subline, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Ты сделал доброе дело
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Твой звонок сделал маму или папу{"\n"}значительно счастливее сегодня
          </Text>
        </Animated.View>

        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="award" size={28} color={colors.primary} />
          <View>
            <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              Продолжай звонить!
            </Text>
            <Text style={[styles.streakValue, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
              Регулярные звонки = счастливая семья
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/")}
        >
          <Text style={[styles.doneBtnText, { fontFamily: "Nunito_700Bold" }]}>
            На главную
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 28,
  },
  heartBurstContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingHeart: {
    position: "absolute",
  },
  bigHeart: {
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  headline: {
    fontSize: 48,
  },
  subline: {
    fontSize: 28,
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 28,
    marginTop: 4,
  },
  streakCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  streakLabel: { fontSize: 15 },
  streakValue: { fontSize: 17, marginTop: 2 },
  doneBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
    width: "100%",
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: { fontSize: 22, color: "#fff" },
});
