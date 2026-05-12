import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function InputField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  icon: string;
}) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: focused ? colors.primary : colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
        {label}
      </Text>
      <Animated.View style={[styles.inputRow, { backgroundColor: colors.card, borderColor }]}>
        <Feather name={icon as "user"} size={20} color={focused ? colors.primary : colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
          onFocus={() => {
            setFocused(true);
            Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false }).start();
          }}
          onBlur={() => {
            setFocused(false);
            Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false }).start();
          }}
          style={[styles.input, { color: colors.text, fontFamily: "Nunito_400Regular" }]}
        />
      </Animated.View>
    </View>
  );
}

function AvatarPicker({
  uri,
  onPick,
  label,
  sublabel,
  size,
}: {
  uri: string | null;
  onPick: (uri: string) => void;
  label: string;
  sublabel: string;
  size?: number;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const s = size ?? 100;

  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) onPick(result.assets[0].uri);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={styles.avatarPickerWrapper}
    >
      <Animated.View style={[styles.avatarOuter, { width: s, height: s, borderRadius: s / 2, borderColor: uri ? colors.primary : colors.border, transform: [{ scale }] }]}>
        {uri ? (
          <Image source={{ uri }} style={[styles.avatarImg, { width: s - 6, height: s - 6, borderRadius: (s - 6) / 2 }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: s - 6, height: s - 6, borderRadius: (s - 6) / 2, backgroundColor: colors.accent }]}>
            <Feather name="user" size={s * 0.32} color={colors.mutedForeground} />
          </View>
        )}
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
          <Feather name="camera" size={13} color="#fff" />
        </View>
      </Animated.View>
      <Text style={[styles.avatarLabel, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>{label}</Text>
      <Text style={[styles.avatarSublabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>{sublabel}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    role, setRole,
    parentName, setParentName,
    parentPhone, setParentPhone,
    childName, setChildName,
    parentPhotoUri, setParentPhotoUri,
    childPhotoUri, setChildPhotoUri,
    callHistory, currentStreak,
  } = useApp();

  const [localParentName, setLocalParentName] = useState(parentName);
  const [localChildName, setLocalChildName] = useState(childName);
  const [localPhone, setLocalPhone] = useState(parentPhone);
  const [localParentPhoto, setLocalParentPhoto] = useState<string | null>(parentPhotoUri);
  const [localChildPhoto, setLocalChildPhoto] = useState<string | null>(childPhotoUri);
  const [saved, setSaved] = useState(false);
  const savedScale = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const callCount = callHistory.length;

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setParentName(localParentName.trim() || "Мама");
    setChildName(localChildName.trim() || "Маша");
    setParentPhone(localPhone.trim() || "+7 900 000 0000");
    setParentPhotoUri(localParentPhoto);
    setChildPhotoUri(localChildPhoto);
    setSaved(true);
    Animated.spring(savedScale, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => {
      setSaved(false);
      Animated.timing(savedScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      router.back();
    }, 1200);
  };

  const handleSwitchRole = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRole(null);
    router.replace("/(tabs)/");
  };

  const canSave = localParentName.trim().length > 0 && localChildName.trim().length > 0 && localPhone.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
          Мой профиль
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats banner */}
        <View style={[styles.statsBanner, { backgroundColor: colors.primary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { fontFamily: "Nunito_800ExtraBold" }]}>{callCount}</Text>
            <Text style={[styles.statLabel, { fontFamily: "Nunito_400Regular" }]}>звонков</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { fontFamily: "Nunito_800ExtraBold" }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { fontFamily: "Nunito_400Regular" }]}>дней подряд 🔥</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { fontFamily: "Nunito_800ExtraBold" }]}>
              {role === "parent" ? "👴" : "👧"}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: "Nunito_400Regular" }]}>
              {role === "parent" ? "Родитель" : "Ребёнок"}
            </Text>
          </View>
        </View>

        {/* Photos side by side */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Фотографии
          </Text>
          <View style={styles.photosRow}>
            <AvatarPicker
              uri={localParentPhoto}
              onPick={setLocalParentPhoto}
              label={localParentName || "Родитель"}
              sublabel="Фото родителя"
              size={96}
            />
            <View style={[styles.photosDivider, { backgroundColor: colors.border }]} />
            <AvatarPicker
              uri={localChildPhoto}
              onPick={setLocalChildPhoto}
              label={localChildName || "Ребёнок"}
              sublabel="Фото ребёнка"
              size={96}
            />
          </View>
        </View>

        {/* Contact info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Контакты
          </Text>
          <InputField
            label="Имя родителя"
            value={localParentName}
            onChange={setLocalParentName}
            placeholder="Мама"
            icon="user"
          />
          <InputField
            label="Имя ребёнка"
            value={localChildName}
            onChange={setLocalChildName}
            placeholder="Маша"
            icon="users"
          />
          <InputField
            label="Номер телефона для звонков"
            value={localPhone}
            onChange={setLocalPhone}
            placeholder="+7 900 000 0000"
            keyboardType="phone-pad"
            icon="phone"
          />
        </View>

        {/* Save button */}
        <Pressable
          onPress={canSave ? handleSave : undefined}
          onPressIn={() => canSave && Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
          style={{ width: "100%" }}
        >
          <Animated.View
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.muted, transform: [{ scale: btnScale }] },
            ]}
          >
            <Feather name="check" size={22} color="#fff" />
            <Text style={[styles.saveBtnText, { fontFamily: "Nunito_700Bold" }]}>
              Сохранить изменения
            </Text>
          </Animated.View>
        </Pressable>

        {saved && (
          <Animated.View
            style={[styles.savedBadge, { backgroundColor: colors.accent, transform: [{ scale: savedScale }] }]}
          >
            <Feather name="check-circle" size={20} color={colors.text} />
            <Text style={[styles.savedText, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
              Сохранено!
            </Text>
          </Animated.View>
        )}

        {/* Switch role */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Режим приложения
          </Text>
          <View style={styles.roleRow}>
            <View style={[styles.roleActive, { backgroundColor: colors.accent }]}>
              <Text style={styles.roleActiveEmoji}>{role === "parent" ? "👴" : "👧"}</Text>
              <Text style={[styles.roleActiveText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                {role === "parent" ? "Режим родителя" : "Режим ребёнка"}
              </Text>
            </View>
            <Pressable
              style={[styles.switchRoleBtn, { borderColor: colors.border }]}
              onPress={handleSwitchRole}
            >
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
              <Text style={[styles.switchRoleText, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>
                Сменить роль
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.switchRoleNote, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            При смене роли данные не удаляются
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20 },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
    alignItems: "center",
  },

  statsBanner: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 28, color: "#fff" },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  statDivider: { width: 1, height: 40 },

  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    width: "100%",
  },
  sectionTitle: { fontSize: 18 },

  photosRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
  },
  photosDivider: { width: 1, alignSelf: "stretch", marginVertical: 8 },

  avatarPickerWrapper: { alignItems: "center", gap: 8, flex: 1 },
  avatarOuter: {
    borderWidth: 3,
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarImg: {},
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarLabel: { fontSize: 16, textAlign: "center" },
  avatarSublabel: { fontSize: 12, textAlign: "center" },

  fieldWrapper: { gap: 6, width: "100%" },
  fieldLabel: { fontSize: 15, marginLeft: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 18, padding: 0 },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 18,
    paddingVertical: 18,
    width: "100%",
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { fontSize: 20, color: "#fff" },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  savedText: { fontSize: 17 },

  roleRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  roleActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  roleActiveEmoji: { fontSize: 22 },
  roleActiveText: { fontSize: 16 },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchRoleText: { fontSize: 15 },
  switchRoleNote: { fontSize: 13, textAlign: "center" },
});
