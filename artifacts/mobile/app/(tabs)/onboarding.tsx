import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "warmth",
    title: "Звонок,\nкоторый согревает",
    subtitle:
      "Помогаем детям чаще звонить пожилым родителям — просто, без стресса и с любовью",
    type: "hero",
    emoji: null,
    bg: null,
    accent: "#FFB347",
  },
  {
    id: "topics",
    title: "Никаких\nнеловких пауз",
    subtitle:
      "Мы подскажем темы для разговора — о погоде, здоровье, готовке и воспоминаниях",
    type: "card",
    emoji: "💬",
    bg: ["#FFF8F0", "#FFE8C8"] as [string, string],
    accent: "#FAD0A1",
    features: ["О погоде в саду", "О здоровье", "О воспоминаниях"],
  },
  {
    id: "impact",
    title: "5 минут —\nи мама счастлива",
    subtitle:
      "Даже короткий разговор делает пожилых людей счастливее на весь день. Начните прямо сейчас",
    type: "card",
    emoji: "❤️",
    bg: ["#FFF8F0", "#FFDDB8"] as [string, string],
    accent: "#FFB347",
    features: ["Один звонок меняет день", "Напомним, когда пора", "Фиксируем каждый звонок"],
  },
];

function Dot({ active }: { active: boolean }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(active ? 1 : 0.5)).current;
  const width = useRef(new Animated.Value(active ? 24 : 8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: active ? 1 : 0.5, useNativeDriver: false }),
      Animated.spring(width, { toValue: active ? 24 : 8, useNativeDriver: false }),
    ]).start();
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          backgroundColor: active ? colors.primary : colors.border,
        },
      ]}
    />
  );
}

function HeroSlide({ slide }: { slide: typeof SLIDES[0] }) {
  const colors = useColors();
  return (
    <View style={styles.slide}>
      <View style={styles.heroImageContainer}>
        <Image
          source={require("@/assets/images/hero.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255,248,240,0.7)", colors.background]}
          locations={[0.35, 0.65, 1]}
          style={styles.heroGradient}
        />
      </View>
      <View style={styles.slideTextSection}>
        <Text style={[styles.slideTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
          {slide.title}
        </Text>
        <Text style={[styles.slideSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          {slide.subtitle}
        </Text>
      </View>
    </View>
  );
}

function CardSlide({ slide }: { slide: typeof SLIDES[0] }) {
  const colors = useColors();
  const features = (slide as { features?: string[] }).features ?? [];

  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={slide.bg as [string, string]}
        style={styles.cardIllustration}
      >
        <Text style={styles.slideEmoji}>{slide.emoji}</Text>

        <View style={styles.featureList}>
          {features.map((f, i) => (
            <Animated.View
              key={i}
              style={[styles.featureChip, { backgroundColor: "rgba(255,255,255,0.75)" }]}
            >
              <Feather name="check" size={16} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                {f}
              </Text>
            </Animated.View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.slideTextSection}>
        <Text style={[styles.slideTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
          {slide.title}
        </Text>
        <Text style={[styles.slideSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          {slide.subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      completeOnboarding();
      router.replace("/(tabs)/");
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)/");
  };

  const isLast = activeIndex === SLIDES.length - 1;

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 60 }} />
        <View style={styles.dots}>
          {SLIDES.map((_, i) => <Dot key={i} active={i === activeIndex} />)}
        </View>
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
            Пропустить
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {SLIDES.map((slide) =>
          slide.type === "hero" ? (
            <HeroSlide key={slide.id} slide={slide} />
          ) : (
            <CardSlide key={slide.id} slide={slide} />
          )
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={handleNext} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View
            style={[
              styles.nextBtn,
              { backgroundColor: colors.primary, transform: [{ scale: btnScale }] },
            ]}
          >
            <Text style={[styles.nextBtnText, { fontFamily: "Nunito_700Bold" }]}>
              {isLast ? "Начать" : "Далее"}
            </Text>
            <Feather name={isLast ? "heart" : "arrow-right"} size={22} color="#fff" />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const ILLUSTRATION_HEIGHT = height * 0.48;

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skipBtn: { paddingHorizontal: 4, paddingVertical: 8, width: 60, alignItems: "flex-end" },
  skipText: { fontSize: 16 },

  scrollView: { flex: 1 },
  scrollContent: {},

  slide: { width, flex: 1 },

  heroImageContainer: {
    height: ILLUSTRATION_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ILLUSTRATION_HEIGHT * 0.6,
  },

  cardIllustration: {
    height: ILLUSTRATION_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  slideEmoji: { fontSize: 90 },
  featureList: { gap: 10, width: "100%" },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
  },
  featureText: { fontSize: 17 },

  slideTextSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 10,
    justifyContent: "center",
  },
  slideTitle: {
    fontSize: 32,
    lineHeight: 40,
  },
  slideSubtitle: {
    fontSize: 17,
    lineHeight: 26,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  nextBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: { fontSize: 20, color: "#fff" },
});
