import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  const handleFocus = () => {
    setFocused(true);
    Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Text
        style={[
          styles.fieldLabel,
          { color: focused ? colors.primary : colors.mutedForeground, fontFamily: "Nunito_600SemiBold" },
        ]}
      >
        {label}
      </Text>
      <Animated.View
        style={[styles.inputRow, { backgroundColor: colors.card, borderColor }]}
      >
        <Feather
          name={icon as "user"}
          size={20}
          color={focused ? colors.primary : colors.mutedForeground}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: colors.text, fontFamily: "Nunito_400Regular" }]}
        />
      </Animated.View>
    </View>
  );
}

function PhotoPicker({
  uri,
  onPick,
  label,
  fallbackIcon,
}: {
  uri: string | null;
  onPick: (uri: string) => void;
  label: string;
  fallbackIcon: string;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri);
    }
  };

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.photoPicker}>
      <Text
        style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}
      >
        {label}
      </Text>

      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.photoCircle,
            { borderColor: uri ? colors.primary : colors.border, transform: [{ scale }] },
          ]}
        >
          {uri ? (
            <Image source={{ uri }} style={styles.photoImage} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.accent }]}>
              <Feather name={fallbackIcon as "user"} size={36} color={colors.mutedForeground} />
            </View>
          )}

          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={14} color="#fff" />
          </View>
        </Animated.View>
      </Pressable>

      <Text
        style={[styles.photoHint, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}
      >
        {uri ? "Нажмите, чтобы изменить" : "Нажмите, чтобы выбрать фото"}
      </Text>
    </View>
  );
}

export default function SetupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string; edit?: string }>();
  const isEdit = params.edit === "1";
  const {
    role,
    contacts, addContact, updateContact,
    parentPhone, setParentPhone,
    childName, setChildName,
    childPhotoUri, setChildPhotoUri,
  } = useApp();

  const activeRole = (params.role as "parent" | "child") ?? role;
  const isParent = activeRole === "parent";
  const firstContact = contacts[0];

  const [localContactName, setLocalContactName] = useState(firstContact?.name ?? "Мама");
  const [localChildName, setLocalChildName] = useState(childName);
  const [localPhone, setLocalPhone] = useState(firstContact?.phone ?? parentPhone);
  const [localContactPhoto, setLocalContactPhoto] = useState<string | null>(firstContact?.photoUri ?? null);
  const [localChildPhoto, setLocalChildPhoto] = useState<string | null>(childPhotoUri);

  const handleSave = () => {
    if (isParent) {
      setChildName(localChildName.trim() || "Маша");
      setParentPhone(localPhone.trim() || "+7 900 000 0000");
      setChildPhotoUri(localChildPhoto);
    } else {
      setParentPhone(localPhone.trim() || "+7 900 000 0000");
      setChildName(localChildName.trim() || "Маша");
      if (firstContact) {
        updateContact(firstContact.id, {
          name: localContactName.trim() || "Мама",
          phone: localPhone.trim() || "+7 900 000 0000",
          photoUri: localContactPhoto,
        });
      } else {
        addContact({
          name: localContactName.trim() || "Мама",
          phone: localPhone.trim() || "+7 900 000 0000",
          photoUri: localContactPhoto,
          relation: "Родитель",
        });
      }
    }
    if (isEdit) {
      router.back();
    } else if (isParent) {
      router.replace("/(tabs)/parent");
    } else {
      router.replace("/(tabs)/child");
    }
  };

  const canSave =
    (isParent ? localChildName.trim().length > 0 : localContactName.trim().length > 0) &&
    localPhone.trim().length > 0;

  const btnScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

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
          {isEdit ? "Изменить данные" : "Знакомство"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isParent ? (
          <PhotoPicker
            uri={localChildPhoto}
            onPick={setLocalChildPhoto}
            label="Фото ребёнка"
            fallbackIcon="user"
          />
        ) : (
          <PhotoPicker
            uri={localContactPhoto}
            onPick={setLocalContactPhoto}
            label="Фото родителя"
            fallbackIcon="user"
          />
        )}

        <Text style={[styles.title, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
          {isParent ? "Настройка для родителя" : "Настройка для ребёнка"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          {isParent
            ? "Введите имя вашего ребёнка и его номер телефона"
            : "Введите имя родителя и его номер телефона"}
        </Text>

        <View style={styles.fields}>
          {isParent ? (
            <InputField
              label="Имя ребёнка"
              value={localChildName}
              onChange={setLocalChildName}
              placeholder="Маша"
              icon="user"
            />
          ) : (
            <InputField
              label="Имя родителя"
              value={localContactName}
              onChange={setLocalContactName}
              placeholder="Мама"
              icon="user"
            />
          )}

          <InputField
            label={isParent ? "Номер телефона ребёнка" : "Номер телефона родителя"}
            value={localPhone}
            onChange={setLocalPhone}
            placeholder="+7 900 000 0000"
            keyboardType="phone-pad"
            icon="phone"
          />
        </View>

        <Pressable
          onPress={canSave ? handleSave : undefined}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.muted, transform: [{ scale: btnScale }] },
            ]}
          >
            <Feather name={isEdit ? "check" : "arrow-right"} size={22} color="#fff" />
            <Text style={[styles.saveBtnText, { fontFamily: "Nunito_700Bold" }]}>
              {isEdit ? "Сохранить" : "Готово, начинаем!"}
            </Text>
          </Animated.View>
        </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
    alignItems: "center",
  },
  title: { fontSize: 26, textAlign: "center" },
  subtitle: { fontSize: 17, textAlign: "center", lineHeight: 26 },
  fields: { width: "100%", gap: 16 },
  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 16, marginLeft: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 20, padding: 0 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 36,
    width: "100%",
    shadowColor: "#D4943A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { fontSize: 22, color: "#fff" },

  photoPicker: { alignItems: "center", gap: 10 },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: "visible",
    position: "relative",
  },
  photoImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  photoPlaceholder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  photoHint: { fontSize: 14 },
});
