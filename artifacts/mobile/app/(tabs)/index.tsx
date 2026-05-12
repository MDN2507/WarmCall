import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.52;

function RoleButton({
  label,
  subtitle,
  icon,
  onPress,
  isPrimary,
}: {
  label: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  isPrimary: boolean;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.roleButton,
          {
            backgroundColor: isPrimary ? colors.primary : colors.card,
            borderColor: isPrimary ? colors.primary : colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        <View
          style={[
            styles.roleIconCircle,
            { backgroundColor: isPrimary ? "rgba(255,255,255,0.25)" : colors.accent },
          ]}
        >
          <Feather name={icon as "phone-call"} size={28} color={isPrimary ? "#fff" : colors.text} />
        </View>
        <View style={styles.roleLabelBlock}>
          <Text style={[styles.roleLabel, { color: isPrimary ? "#fff" : colors.text, fontFamily: "Nunito_700Bold" }]}>
            {label}
          </Text>
          <Text style={[styles.roleSubtitle, { color: isPrimary ? "rgba(255,255,255,0.8)" : colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            {subtitle}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={isPrimary ? "rgba(255,255,255,0.7)" : colors.mutedForeground} />
      </Animated.View>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRole } = useApp();

  const heroScale = useRef(new Animated.Value(1.06)).current;
  const panelSlide = useRef(new Animated.Value(40)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(panelSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(panelOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleParent = () => {
    setRole("parent");
    router.push({ pathname: "/(tabs)/setup", params: { role: "parent" } });
  };

  const handleChild = () => {
    setRole("child");
    router.push({ pathname: "/(tabs)/setup", params: { role: "child" } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.heroContainer}>
        <Animated.View style={[styles.heroImageWrapper, { transform: [{ scale: heroScale }] }]}>
          <Image
            source={require("@/assets/images/hero.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Animated.View>

        <LinearGradient
          colors={["transparent", "rgba(255,248,240,0.6)", colors.background]}
          locations={[0.4, 0.72, 1]}
          style={styles.gradient}
        />

        <Animated.View style={[styles.heroTitle, { paddingTop: insets.top + 16, opacity: titleOpacity }]}>
          <View style={[styles.appBadge, { backgroundColor: "rgba(255,248,240,0.88)" }]}>
            <Image source={require("@/assets/images/icon.png")} style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
              Тёплый звонок
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 24,
            opacity: panelOpacity,
            transform: [{ translateY: panelSlide }],
          },
        ]}
      >
        <Text style={[styles.tagline, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
          Будьте ближе{"\n"}к тем, кого любите
        </Text>
        <Text style={[styles.taglineSub, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          Выберите, кто вы
        </Text>

        <View style={styles.buttons}>
          <RoleButton
            label="Я родитель"
            subtitle="Большая кнопка звонка"
            icon="phone-call"
            onPress={handleParent}
            isPrimary={true}
          />
          <RoleButton
            label="Я ребёнок"
            subtitle="Напомнить и позвонить маме"
            icon="heart"
            onPress={handleChild}
            isPrimary={false}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroContainer: {
    height: HERO_HEIGHT,
    overflow: "hidden",
  },
  heroImageWrapper: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.65,
  },
  heroTitle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeIcon: { width: 30, height: 30, borderRadius: 8 },
  badgeText: { fontSize: 18 },

  panel: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    gap: 16,
  },
  tagline: {
    fontSize: 30,
    lineHeight: 38,
  },
  taglineSub: {
    fontSize: 17,
    marginTop: -6,
  },
  buttons: { gap: 12, flex: 1, justifyContent: "center" },

  roleButton: {
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  roleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabelBlock: { flex: 1, gap: 2 },
  roleLabel: { fontSize: 22 },
  roleSubtitle: { fontSize: 14 },
});
