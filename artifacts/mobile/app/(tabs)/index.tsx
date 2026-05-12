import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
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

const { width } = Dimensions.get("window");

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
  const scale = React.useRef(new Animated.Value(1)).current;

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
          <Feather
            name={icon as "home"}
            size={32}
            color={isPrimary ? "#fff" : colors.text}
          />
        </View>
        <Text
          style={[
            styles.roleLabel,
            { color: isPrimary ? "#fff" : colors.text, fontFamily: "Nunito_700Bold" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.roleSubtitle,
            {
              color: isPrimary ? "rgba(255,255,255,0.8)" : colors.mutedForeground,
              fontFamily: "Nunito_400Regular",
            },
          ]}
        >
          {subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRole } = useApp();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
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
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 32,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroSection}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            Тёплый звонок
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Будьте ближе к тем, кого любите
          </Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
            Кто вы?
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.buttons}>
          <RoleButton
            label="Я родитель"
            subtitle="Большая кнопка звонка"
            icon="phone-call"
            onPress={handleParent}
            isPrimary={true}
          />
          <RoleButton
            label="Я ребенок"
            subtitle="Напомнить и позвонить маме"
            icon="heart"
            onPress={handleChild}
            isPrimary={false}
          />
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          Приложение для теплых семейных звонков
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroSection: {
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 16,
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
  roleButton: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: "center",
    gap: 10,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  roleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: {
    fontSize: 24,
  },
  roleSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    fontSize: 14,
    textAlign: "center",
  },
});
