import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function PulsingButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
        ])
      ).start();
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring2, { toValue: 1.7, duration: 1200, useNativeDriver: true }),
              Animated.timing(ring2Opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, 400);
    };
    pulse();
  }, []);

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.pulseWrapper}>
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: ring2 }],
            opacity: ring2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: ring1 }],
            opacity: ring1Opacity,
          },
        ]}
      />
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.callButton,
            { backgroundColor: colors.primary, transform: [{ scale: btnScale }] },
          ]}
        >
          <Feather name="phone-call" size={52} color="#fff" />
          <Text style={[styles.callButtonText, { fontFamily: "Nunito_700Bold" }]}>
            Позвонить
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function ParentScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { childName, parentPhone, hasPendingNotification, pendingMessage, clearNotification } =
    useApp();

  const bgAnim = useRef(new Animated.Value(hasPendingNotification ? 1 : 0)).current;
  const notifScale = useRef(new Animated.Value(hasPendingNotification ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgAnim, {
        toValue: hasPendingNotification ? 1 : 0,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(notifScale, {
        toValue: hasPendingNotification ? 1 : 0,
        useNativeDriver: true,
      }),
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

      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {hasPendingNotification && (
          <Animated.View
            style={[
              styles.notifBanner,
              {
                backgroundColor: colors.golden ?? "#FFD700",
                transform: [{ scale: notifScale }],
              },
            ]}
          >
            <Text style={[styles.notifText, { fontFamily: "Nunito_700Bold" }]}>
              Дети ждут тебя
            </Text>
            {pendingMessage ? (
              <Text style={[styles.notifMessage, { fontFamily: "Nunito_400Regular" }]}>
                {pendingMessage}
              </Text>
            ) : null}
          </Animated.View>
        )}

        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
            <Image
              source={require("@/assets/images/child-placeholder.png")}
              style={styles.avatar}
            />
          </View>
          <Text style={[styles.waitingText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Жду тебя,
          </Text>
          <Text style={[styles.childName, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {childName}
          </Text>
        </View>

        <PulsingButton onPress={handleCall} />
      </View>
    </Animated.View>
  );
}

const CALL_BTN_SIZE = 180;
const RING_SIZE = CALL_BTN_SIZE;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  notifBanner: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 6,
    shadowColor: "#D4A800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  notifText: {
    fontSize: 22,
    color: "#4A3B00",
  },
  notifMessage: {
    fontSize: 16,
    color: "#4A3B00",
    textAlign: "center",
  },
  avatarSection: {
    alignItems: "center",
    gap: 10,
  },
  avatarRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
    padding: 4,
    marginBottom: 8,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: "100%" as unknown as number,
    height: "100%" as unknown as number,
    borderRadius: 95,
  },
  waitingText: {
    fontSize: 22,
  },
  childName: {
    fontSize: 38,
  },
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
  callButtonText: {
    fontSize: 22,
    color: "#fff",
  },
});
