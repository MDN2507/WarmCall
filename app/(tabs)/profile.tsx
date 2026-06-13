import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type ParentContact } from "../context/AppContext";
import { useColors } from "../hooks/useColors";

// ────────────────────────── Helpers ──────────────────────────

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
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.primary] });

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
          onFocus={() => { setFocused(true); Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false }).start(); }}
          onBlur={() => { setFocused(false); Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false }).start(); }}
          style={[styles.input, { color: colors.text, fontFamily: "Nunito_400Regular" }]}
        />
      </Animated.View>
    </View>
  );
}

function AvatarPicker({
  uri, onPick, label, sublabel, size,
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) onPick(result.assets[0].uri);
  };

  return (
    <Pressable onPress={handlePress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={styles.avatarPickerWrapper}>
      <Animated.View style={[styles.avatarOuter, { width: s, height: s, borderRadius: s / 2, borderColor: uri ? colors.primary : colors.border, transform: [{ scale }] }]}>
        {uri
          ? <Image source={{ uri }} style={[styles.avatarImg, { width: s - 6, height: s - 6, borderRadius: (s - 6) / 2 }]} />
          : <View style={[styles.avatarPlaceholder, { width: s - 6, height: s - 6, borderRadius: (s - 6) / 2, backgroundColor: colors.accent }]}>
              <Feather name="user" size={s * 0.32} color={colors.mutedForeground} />
            </View>
        }
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
          <Feather name="camera" size={13} color="#fff" />
        </View>
      </Animated.View>
      <Text style={[styles.avatarLabel, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>{label}</Text>
      <Text style={[styles.avatarSublabel, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>{sublabel}</Text>
    </Pressable>
  );
}

// ────────────────────────── Contact Row ──────────────────────────

function ContactRow({
  contact,
  onEdit,
  onDelete,
}: {
  contact: ParentContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.contactRow, { borderColor: colors.border }]}>
      <View style={[styles.contactRowAvatar, { backgroundColor: colors.accent }]}>
        {contact.photoUri
          ? <Image source={{ uri: contact.photoUri }} style={styles.contactRowAvatarImg} />
          : <Feather name="user" size={20} color={colors.mutedForeground} />
        }
      </View>
      <View style={styles.contactRowInfo}>
        <Text style={[styles.contactRowName, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>{contact.name}</Text>
        <Text style={[styles.contactRowSub, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
          {contact.relation} · {contact.phone}
        </Text>
      </View>
      <Pressable onPress={onEdit} style={[styles.contactRowBtn, { backgroundColor: colors.background }]}>
        <Feather name="edit-2" size={16} color={colors.primary} />
      </Pressable>
      <Pressable onPress={onDelete} style={[styles.contactRowBtn, { backgroundColor: colors.background }]}>
        <Feather name="trash-2" size={16} color="#E07070" />
      </Pressable>
    </View>
  );
}

// ────────────────────────── Contact Edit Modal ──────────────────────────

function ContactEditModal({
  visible,
  contact,
  onClose,
  onSave,
}: {
  visible: boolean;
  contact: Partial<ParentContact> | null;
  onClose: () => void;
  onSave: (data: Omit<ParentContact, "id">) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [relation, setRelation] = useState(contact?.relation ?? "Родитель");
  const [photoUri, setPhotoUri] = useState<string | null>(contact?.photoUri ?? null);

  React.useEffect(() => {
    if (visible) {
      setName(contact?.name ?? "");
      setPhone(contact?.phone ?? "");
      setRelation(contact?.relation ?? "Родитель");
      setPhotoUri(contact?.photoUri ?? null);
    }
  }, [visible, contact]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled && r.assets[0]) setPhotoUri(r.assets[0].uri);
  };

  const canSave = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {contact?.id ? "Редактировать контакт" : "Новый контакт"}
          </Text>
          <Pressable onPress={pickPhoto} style={styles.modalPhotoWrap}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={styles.modalPhoto} />
              : <View style={[styles.modalPhotoPlaceholder, { backgroundColor: colors.accent }]}>
                  <Feather name="camera" size={28} color={colors.mutedForeground} />
                </View>
            }
            <Text style={[styles.modalPhotoHint, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              {photoUri ? "Изменить фото" : "Добавить фото"}
            </Text>
          </Pressable>
          {[
            { label: "Имя", val: name, set: setName, ph: "Мама", icon: "user", kb: "default" as const },
            { label: "Кем приходится", val: relation, set: setRelation, ph: "Родитель", icon: "heart", kb: "default" as const },
            { label: "Телефон", val: phone, set: setPhone, ph: "+7 900 000 0000", icon: "phone", kb: "phone-pad" as const },
          ].map((f) => (
            <View key={f.label} style={styles.modalField}>
              <Text style={[styles.modalFieldLabel, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>{f.label}</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={f.icon as "user"} size={18} color={colors.mutedForeground} />
                <TextInput value={f.val} onChangeText={f.set} placeholder={f.ph}
                  placeholderTextColor={colors.mutedForeground} keyboardType={f.kb}
                  style={[styles.modalInputText, { color: colors.text, fontFamily: "Nunito_400Regular" }]} />
              </View>
            </View>
          ))}
          <Pressable
            style={[styles.modalSaveBtn, { backgroundColor: canSave ? colors.primary : colors.muted }]}
            onPress={canSave ? () => onSave({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || "Родитель", photoUri }) : undefined}>
            <Feather name="check" size={20} color="#fff" />
            <Text style={[styles.modalSaveBtnText, { fontFamily: "Nunito_700Bold" }]}>Сохранить</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────── Main Screen ──────────────────────────

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    role, setRole,
    contacts, addContact, updateContact, removeContact,
    parentPhone, setParentPhone,
    childName, setChildName,
    childPhotoUri, setChildPhotoUri,
    callHistory, currentStreak,
  } = useApp();

  const [localChildName, setLocalChildName] = useState(childName);
  const [localPhone, setLocalPhone] = useState(parentPhone);
  const [localChildPhoto, setLocalChildPhoto] = useState<string | null>(childPhotoUri);
  const [saved, setSaved] = useState(false);
  const savedScale = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const [contactModal, setContactModal] = useState<{ visible: boolean; contact: Partial<ParentContact> | null }>({ visible: false, contact: null });

  const callCount = callHistory.length;

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChildName(localChildName.trim() || "Маша");
    setParentPhone(localPhone.trim() || "+7 900 000 0000");
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
    router.replace("/");
  };

  const canSave = localChildName.trim().length > 0;

  const openAddContact = () => setContactModal({ visible: true, contact: null });
  const openEditContact = (c: ParentContact) => setContactModal({ visible: true, contact: c });
  const closeContactModal = () => setContactModal({ visible: false, contact: null });

  const handleSaveContact = (data: Omit<ParentContact, "id">) => {
    if (contactModal.contact?.id) {
      updateContact(contactModal.contact.id, data);
    } else {
      addContact(data);
    }
    closeContactModal();
  };

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

        {/* My info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>Мои данные</Text>
          <View style={styles.myInfoRow}>
            <AvatarPicker
              uri={localChildPhoto}
              onPick={setLocalChildPhoto}
              label={localChildName || "Я"}
              sublabel="Моё фото"
              size={96}
            />
            <View style={styles.myInfoFields}>
              <InputField
                label="Моё имя"
                value={localChildName}
                onChange={setLocalChildName}
                placeholder="Маша"
                icon="user"
              />
              {role === "parent" && (
                <InputField
                  label="Телефон ребёнка"
                  value={localPhone}
                  onChange={setLocalPhone}
                  placeholder="+7 900 000 0000"
                  keyboardType="phone-pad"
                  icon="phone"
                />
              )}
            </View>
          </View>
        </View>

        {/* Contacts section (only for child mode) */}
        {role === "child" && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
              Мои близкие
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              Родственники, которым хочу звонить
            </Text>
            {contacts.length === 0 && (
              <View style={[styles.emptyContacts, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.emptyContactsText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                  Пока никого нет. Добавь первого родственника!
                </Text>
              </View>
            )}
            {contacts.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                onEdit={() => openEditContact(c)}
                onDelete={() => removeContact(c.id)}
              />
            ))}
            <Pressable
              style={[styles.addContactBtn, { backgroundColor: colors.background, borderColor: colors.accent }]}
              onPress={openAddContact}
            >
              <Feather name="user-plus" size={18} color={colors.primary} />
              <Text style={[styles.addContactText, { color: colors.primary, fontFamily: "Nunito_700Bold" }]}>
                Добавить родственника
              </Text>
            </Pressable>
          </View>
        )}

        {/* Save button */}
        <Pressable
          onPress={canSave ? handleSave : undefined}
          onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
        >
          <Animated.View style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.muted, transform: [{ scale: btnScale }] }]}>
            <Feather name="check" size={22} color="#fff" />
            <Text style={[styles.saveBtnText, { fontFamily: "Nunito_700Bold" }]}>Сохранить</Text>
          </Animated.View>
        </Pressable>

        {saved && (
          <Animated.View style={[styles.savedBadge, { backgroundColor: colors.accent, transform: [{ scale: savedScale }] }]}>
            <Feather name="check-circle" size={18} color={colors.text} />
            <Text style={[styles.savedText, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>Сохранено!</Text>
          </Animated.View>
        )}

        {/* Switch role */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>Сменить роль</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Сейчас вы в режиме «{role === "parent" ? "Родитель" : "Ребёнок"}». Хотите переключиться?
          </Text>
          <Pressable style={[styles.switchRoleBtn, { borderColor: colors.border }]} onPress={handleSwitchRole}>
            <Feather name="refresh-cw" size={18} color={colors.text} />
            <Text style={[styles.switchRoleText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
              Выбрать роль заново
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ContactEditModal
        visible={contactModal.visible}
        contact={contactModal.contact}
        onClose={closeContactModal}
        onSave={handleSaveContact}
      />
    </KeyboardAvoidingView>
  );
}

// ────────────────────────── Styles ──────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },

  statsBanner: { borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 18, paddingHorizontal: 12 },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statNum: { fontSize: 28, color: "#fff" },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  statDivider: { width: 1, height: 40, marginHorizontal: 4 },

  section: { borderRadius: 20, borderWidth: 1.5, padding: 20, gap: 14 },
  sectionTitle: { fontSize: 20 },
  sectionSubtitle: { fontSize: 15, marginTop: -6, lineHeight: 21 },

  myInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  myInfoFields: { flex: 1, gap: 10 },

  avatarPickerWrapper: { alignItems: "center", gap: 6 },
  avatarOuter: { borderWidth: 2.5, alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible" },
  avatarImg: {},
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  avatarLabel: { fontSize: 14, textAlign: "center", maxWidth: 90 },
  avatarSublabel: { fontSize: 12, textAlign: "center" },

  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 14, marginLeft: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 17, padding: 0 },

  emptyContacts: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", padding: 16, alignItems: "center" },
  emptyContactsText: { fontSize: 15, textAlign: "center", lineHeight: 22 },

  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, paddingBottom: 12 },
  contactRowAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  contactRowAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  contactRowInfo: { flex: 1, gap: 2 },
  contactRowName: { fontSize: 17 },
  contactRowSub: { fontSize: 13 },
  contactRowBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  addContactBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", paddingHorizontal: 14, paddingVertical: 12 },
  addContactText: { fontSize: 16 },

  saveBtn: { borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, paddingHorizontal: 24, shadowColor: "#D4943A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  saveBtnText: { fontSize: 20, color: "#fff" },
  savedBadge: { borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14 },
  savedText: { fontSize: 17 },

  switchRoleBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12 },
  switchRoleText: { fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 24, textAlign: "center" },
  modalPhotoWrap: { alignItems: "center", gap: 8 },
  modalPhoto: { width: 90, height: 90, borderRadius: 45 },
  modalPhotoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  modalPhotoHint: { fontSize: 14 },
  modalField: { gap: 4 },
  modalFieldLabel: { fontSize: 14, marginLeft: 2 },
  modalInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  modalInputText: { flex: 1, fontSize: 17, padding: 0 },
  modalSaveBtn: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveBtnText: { fontSize: 18, color: "#fff" },
});
