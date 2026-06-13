import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type ParentContact, type ParentMood } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatReminderTime } from "@/utils/notifications";

const MOOD_MAP: Record<NonNullable<ParentMood>, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Хорошо", color: "#5DAA68" },
  okay: { emoji: "😐", label: "Так себе", color: "#D4943A" },
  miss: { emoji: "🥺", label: "Скучает", color: "#E07070" },
};

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

const REMINDER_MESSAGES = [
  "Сегодня хорошая погода — как у мамы в саду?",
  "Давно не говорили — скучаю по тебе!",
  "Думаю о тебе — просто хотел/а напомнить о себе",
  "Как твои ноги? Не забудь про лекарства!",
  "Что приготовила сегодня на обед?",
];

const TIME_PRESETS = [
  { label: "9:00", hour: 9, minute: 0 },
  { label: "12:00", hour: 12, minute: 0 },
  { label: "17:00", hour: 17, minute: 0 },
  { label: "19:00", hour: 19, minute: 0 },
  { label: "21:00", hour: 21, minute: 0 },
];

// ────────────────────────── Contact Card ──────────────────────────

function ContactCard({
  contact,
  mood,
  onCall,
  onSendReminder,
  onTopics,
  onEdit,
}: {
  contact: ParentContact;
  mood: ParentMood;
  onCall: () => void;
  onSendReminder: () => void;
  onTopics: () => void;
  onEdit: () => void;
}) {
  const colors = useColors();
  const callScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(callScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(callScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row: avatar + info + call button */}
      <View style={styles.contactTopRow}>
        <Pressable onPress={onEdit} style={styles.contactAvatarWrap}>
          <View style={[styles.contactAvatarRing, { borderColor: colors.accent }]}>
            {contact.photoUri ? (
              <Image source={{ uri: contact.photoUri }} style={styles.contactAvatar} />
            ) : (
              <View style={[styles.contactAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Feather name="user" size={28} color={colors.mutedForeground} />
              </View>
            )}
          </View>
          <View style={[styles.editBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="edit-2" size={11} color={colors.mutedForeground} />
          </View>
        </Pressable>

        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {contact.name}
          </Text>
          <Text style={[styles.contactRelation, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            {contact.relation}
          </Text>
          <Text style={[styles.contactPhone, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            {contact.phone}
          </Text>
          {mood && MOOD_MAP[mood] && (
            <View style={[styles.moodChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.moodChipEmoji}>{MOOD_MAP[mood].emoji}</Text>
              <Text style={[styles.moodChipText, { color: MOOD_MAP[mood].color, fontFamily: "Nunito_600SemiBold" }]}>
                {MOOD_MAP[mood].label}
              </Text>
            </View>
          )}
        </View>

        <Pressable onPress={onCall} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View style={[styles.callBtn, { backgroundColor: colors.primary, transform: [{ scale: callScale }] }]}>
            <Feather name="phone-call" size={26} color="#fff" />
            <Text style={[styles.callBtnText, { fontFamily: "Nunito_700Bold" }]}>Позвонить</Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Bottom row: secondary actions */}
      <View style={[styles.contactActions, { borderTopColor: colors.border }]}>
        <Pressable style={styles.contactAction} onPress={onSendReminder}>
          <Feather name="send" size={16} color={colors.primary} />
          <Text style={[styles.contactActionText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
            Напоминание
          </Text>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
        <Pressable style={styles.contactAction} onPress={onTopics}>
          <Feather name="message-circle" size={16} color={colors.primary} />
          <Text style={[styles.contactActionText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
            Темы
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ────────────────────────── Add/Edit Contact Modal ──────────────────────────

function ContactModal({
  visible,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  initial: Partial<ParentContact> | null;
  onClose: () => void;
  onSave: (data: Omit<ParentContact, "id">) => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "Родитель");
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
      setRelation(initial?.relation ?? "Родитель");
      setPhotoUri(initial?.photoUri ?? null);
    }
  }, [visible, initial]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const canSave = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            {initial?.id ? "Редактировать" : "Новый родственник"}
          </Text>

          {/* Photo picker */}
          <Pressable onPress={handlePickPhoto} style={styles.modalPhotoWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.modalPhoto} />
            ) : (
              <View style={[styles.modalPhotoPlaceholder, { backgroundColor: colors.accent }]}>
                <Feather name="camera" size={28} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={[styles.modalPhotoHint, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              {photoUri ? "Изменить фото" : "Добавить фото"}
            </Text>
          </Pressable>

          {/* Fields */}
          {[
            { label: "Имя", value: name, onChange: setName, placeholder: "Мама", icon: "user", kb: "default" as const },
            { label: "Как называть", value: relation, onChange: setRelation, placeholder: "Родитель", icon: "heart", kb: "default" as const },
            { label: "Номер телефона", value: phone, onChange: setPhone, placeholder: "+7 900 000 0000", icon: "phone", kb: "phone-pad" as const },
          ].map((f) => (
            <View key={f.label} style={styles.modalField}>
              <Text style={[styles.modalFieldLabel, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>{f.label}</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={f.icon as "user"} size={18} color={colors.mutedForeground} />
                <TextInput
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={f.kb}
                  style={[styles.modalInputText, { color: colors.text, fontFamily: "Nunito_400Regular" }]}
                />
              </View>
            </View>
          ))}

          <Pressable
            style={[styles.modalSaveBtn, { backgroundColor: canSave ? colors.primary : colors.muted }]}
            onPress={canSave ? () => onSave({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || "Родитель", photoUri }) : undefined}
          >
            <Feather name="check" size={20} color="#fff" />
            <Text style={[styles.modalSaveBtnText, { fontFamily: "Nunito_700Bold" }]}>Сохранить</Text>
          </Pressable>

          {onDelete && (
            <Pressable style={[styles.modalDeleteBtn, { borderColor: "#E07070" }]} onPress={onDelete}>
              <Feather name="trash-2" size={18} color="#E07070" />
              <Text style={[styles.modalDeleteText, { fontFamily: "Nunito_600SemiBold" }]}>Удалить контакт</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────── Topics Modal ──────────────────────────

function TopicsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [topics] = useState(() => [...TOPICS].sort(() => Math.random() - 0.5).slice(0, 3));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>Темы для разговора</Text>
          <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>Выбери, о чём спросить сегодня</Text>
          <View style={styles.topicsList}>
            {topics.map(([title, desc], i) => (
              <Pressable key={i} style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onClose}>
                <View style={[styles.topicNumber, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.topicNumberText, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>{i + 1}</Text>
                </View>
                <View style={styles.topicTextBlock}>
                  <Text style={[styles.topicTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>{title}</Text>
                  <Text style={[styles.topicDesc, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>{desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={[styles.modalSaveBtnText, { fontFamily: "Nunito_700Bold" }]}>Понятно, спасибо!</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────── Reminder Modal ──────────────────────────

function ReminderModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reminderEnabled, reminderHour, reminderMinute, setReminder, contacts } = useApp();
  const [localEnabled, setLocalEnabled] = useState(reminderEnabled);
  const [localHour, setLocalHour] = useState(reminderHour);
  const [localMinute, setLocalMinute] = useState(reminderMinute);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) { setLocalEnabled(reminderEnabled); setLocalHour(reminderHour); setLocalMinute(reminderMinute); }
  }, [visible, reminderEnabled, reminderHour, reminderMinute]);

  const handleSave = async () => {
    setSaving(true);
    await setReminder(localEnabled, localHour, localMinute);
    setSaving(false);
    onClose();
  };

  const isWeb = Platform.OS === "web";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>Напоминание о звонке</Text>

          {isWeb ? (
            <View style={[styles.webNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.webNoticeEmoji}>📱</Text>
              <Text style={[styles.webNoticeText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                Push-уведомления работают только в мобильном приложении
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.reminderToggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={styles.reminderToggleLeft}>
                  <Text style={styles.reminderToggleEmoji}>🔔</Text>
                  <View>
                    <Text style={[styles.reminderToggleTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>Ежедневное напоминание</Text>
                    <Text style={[styles.reminderToggleSub, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
                      {localEnabled ? `Каждый день в ${formatReminderTime(localHour, localMinute)}` : "Выключено"}
                    </Text>
                  </View>
                </View>
                <Switch value={localEnabled} onValueChange={setLocalEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
              </View>
              {localEnabled && (
                <>
                  <Text style={[styles.timeLabel, { color: colors.mutedForeground, fontFamily: "Nunito_600SemiBold" }]}>Выбери время</Text>
                  <View style={styles.timePresets}>
                    {TIME_PRESETS.map((p) => {
                      const active = p.hour === localHour && p.minute === localMinute;
                      return (
                        <Pressable key={p.label} onPress={() => { setLocalHour(p.hour); setLocalMinute(p.minute); }}
                          style={[styles.timeChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}>
                          <Text style={[styles.timeChipText, { color: active ? "#fff" : colors.text, fontFamily: "Nunito_700Bold" }]}>{p.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={[styles.reminderPreview, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                    <Text style={styles.reminderPreviewEmoji}>💛</Text>
                    <Text style={[styles.reminderPreviewText, { color: colors.text, fontFamily: "Nunito_400Regular" }]}>
                      «Ты сегодня ещё не позвонил {contacts[0]?.name ?? "маме"}. Она будет рада услышать тебя!»
                    </Text>
                  </View>
                </>
              )}
            </>
          )}

          <Pressable style={[styles.modalSaveBtn, { backgroundColor: isWeb ? colors.border : colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={isWeb ? onClose : handleSave} disabled={saving}>
            <Feather name={isWeb ? "x" : "check"} size={20} color="#fff" />
            <Text style={[styles.modalSaveBtnText, { fontFamily: "Nunito_700Bold" }]}>
              {isWeb ? "Закрыть" : saving ? "Сохраняю…" : "Сохранить"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────── Main Screen ──────────────────────────

export default function ChildScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    contacts, addContact, updateContact, removeContact,
    childName, sendReminder, logCall, currentStreak,
    parentMood, reminderEnabled, reminderHour, reminderMinute,
  } = useApp();

  const [topicsVisible, setTopicsVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [contactModal, setContactModal] = useState<{ visible: boolean; contact: Partial<ParentContact> | null }>({ visible: false, contact: null });
  const [reminderSentFor, setReminderSentFor] = useState<string | null>(null);
  const checkScale = useRef(new Animated.Value(0)).current;

  // Warm chime on mount
  useEffect(() => {
    let sound: Audio.Sound | null = null;

    const playChimeWeb = () => {
      try {
        const AudioContextClass =
          (typeof window !== "undefined" &&
            (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)) ||
          null;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        // Gentle descending: G5 → E5 → C5
        const notes = [783.99, 659.25, 523.25];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          const t = ctx.currentTime + i * 0.1;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
          osc.start(t);
          osc.stop(t + 1.4);
        });
      } catch (_) {}
    };

    const playChimeNative = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
        const { sound: s } = await Audio.Sound.createAsync(
          require("@/assets/sounds/chime-child.wav"),
          { volume: 0.55, shouldPlay: true }
        );
        sound = s;
      } catch (_) {}
    };

    if (Platform.OS === "web") {
      playChimeWeb();
    } else {
      playChimeNative();
    }

    return () => {
      sound?.stopAsync().finally(() => sound?.unloadAsync());
    };
  }, []);

  const handleCall = (contact: ParentContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    logCall(contact.name);
    Linking.openURL(`tel:${contact.phone.replace(/\s/g, "")}`);
    setTimeout(() => router.push("/(tabs)/feedback"), 1000);
  };

  const handleSendReminder = (contact: ParentContact) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
    sendReminder(msg);
    setReminderSentFor(contact.id);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => {
      setReminderSentFor(null);
      Animated.timing(checkScale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 3000);
  };

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

  const handleDeleteContact = () => {
    if (contactModal.contact?.id) {
      removeContact(contactModal.contact.id);
    }
    closeContactModal();
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          `💛 Привет! Это ${childName}.\n\n` +
          `Я хочу звонить тебе чаще — установи приложение «Тёплый звонок»!\n\n` +
          `📱 Android: https://play.google.com/store\n🍎 iPhone: https://apps.apple.com\n\n` +
          `Выбери «Я родитель» и жди моего звонка. Люблю тебя! ❤️`,
        title: "Тёплый звонок",
      });
    } catch (_) {}
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
        <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.backBtn}>
          <Feather name="edit-2" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Contacts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Nunito_800ExtraBold" }]}>
            Позвони близким
          </Text>
          {currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.streakText, { fontFamily: "Nunito_700Bold" }]}>{currentStreak} 🔥</Text>
            </View>
          )}
        </View>

        {contacts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>👵</Text>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
              Добавь первого родственника
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
              Нажми «+» чтобы добавить маму, папу или бабушку
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id}>
              <ContactCard
                contact={contact}
                mood={parentMood}
                onCall={() => handleCall(contact)}
                onSendReminder={() => handleSendReminder(contact)}
                onTopics={() => setTopicsVisible(true)}
                onEdit={() => openEditContact(contact)}
              />
              {reminderSentFor === contact.id && (
                <Animated.View style={[styles.sentBanner, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: checkScale }] }]}>
                  <Feather name="check-circle" size={20} color="#5DAA68" />
                  <Text style={[styles.sentText, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>
                    {contact.name} знает, что ты думаешь о ней
                  </Text>
                </Animated.View>
              )}
            </View>
          ))
        )}

        {/* Add contact button */}
        <Pressable
          style={[styles.addContactBtn, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={openAddContact}
        >
          <View style={[styles.addContactIcon, { backgroundColor: colors.accent }]}>
            <Feather name="user-plus" size={20} color={colors.text} />
          </View>
          <Text style={[styles.addContactText, { color: colors.text, fontFamily: "Nunito_700Bold" }]}>
            Добавить родственника
          </Text>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>

        {/* Utility row */}
        <View style={styles.utilRow}>
          <Pressable
            style={[styles.utilBtn, { backgroundColor: reminderEnabled ? colors.primary : colors.card, borderColor: reminderEnabled ? colors.primary : colors.border }]}
            onPress={() => setReminderVisible(true)}
          >
            <Text style={styles.utilEmoji}>{reminderEnabled ? "🔔" : "🔕"}</Text>
            <Text style={[styles.utilLabel, { color: reminderEnabled ? "#fff" : colors.text, fontFamily: "Nunito_600SemiBold" }]}>
              {reminderEnabled ? formatReminderTime(reminderHour, reminderMinute) : "Напоминание"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.utilBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/history")}
          >
            <Text style={styles.utilEmoji}>📋</Text>
            <Text style={[styles.utilLabel, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>История</Text>
          </Pressable>

          <Pressable
            style={[styles.utilBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShareApp}
          >
            <Text style={styles.utilEmoji}>💌</Text>
            <Text style={[styles.utilLabel, { color: colors.text, fontFamily: "Nunito_600SemiBold" }]}>Пригласить</Text>
          </Pressable>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="sun" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Nunito_400Regular" }]}>
            Даже 5 минут разговора делают пожилых людей счастливее на целый день
          </Text>
        </View>
      </ScrollView>

      <TopicsModal visible={topicsVisible} onClose={() => setTopicsVisible(false)} />
      <ReminderModal visible={reminderVisible} onClose={() => setReminderVisible(false)} />
      <ContactModal
        visible={contactModal.visible}
        initial={contactModal.contact}
        onClose={closeContactModal}
        onSave={handleSaveContact}
        onDelete={contactModal.contact?.id ? handleDeleteContact : undefined}
      />
    </View>
  );
}

// ────────────────────────── Styles ──────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  content: { paddingHorizontal: 20, gap: 14, paddingTop: 8 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 26 },
  streakBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  streakText: { fontSize: 16, color: "#fff" },

  emptyCard: { borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", padding: 32, alignItems: "center", gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, textAlign: "center" },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },

  contactCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden" },
  contactTopRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  contactAvatarWrap: { position: "relative" },
  contactAvatarRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, padding: 2 },
  contactAvatar: { width: 62, height: 62, borderRadius: 31 },
  contactAvatarPlaceholder: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
  editBadge: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontSize: 20 },
  contactRelation: { fontSize: 14 },
  contactPhone: { fontSize: 13 },
  moodChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 },
  moodChipEmoji: { fontSize: 14 },
  moodChipText: { fontSize: 13 },
  callBtn: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center", gap: 4, minWidth: 88, shadowColor: "#D4943A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  callBtnText: { fontSize: 14, color: "#fff" },
  contactActions: { flexDirection: "row", borderTopWidth: 1 },
  contactAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  contactActionText: { fontSize: 15 },
  actionDivider: { width: 1, alignSelf: "stretch", marginVertical: 10 },
  sentBanner: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: -4 },
  sentText: { fontSize: 15, flex: 1 },

  addContactBtn: { borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  addContactIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  addContactText: { fontSize: 17, flex: 1 },

  utilRow: { flexDirection: "row", gap: 10 },
  utilBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, alignItems: "center", gap: 4 },
  utilEmoji: { fontSize: 24 },
  utilLabel: { fontSize: 13, textAlign: "center" },

  tipCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipText: { fontSize: 15, flex: 1, lineHeight: 22 },

  // Modals shared
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 26, textAlign: "center" },
  modalSubtitle: { fontSize: 16, textAlign: "center", marginTop: -8 },
  modalSaveBtn: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveBtnText: { fontSize: 18, color: "#fff" },
  modalDeleteBtn: { borderRadius: 14, borderWidth: 1.5, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalDeleteText: { fontSize: 16, color: "#E07070" },
  modalPhotoWrap: { alignItems: "center", gap: 8 },
  modalPhoto: { width: 90, height: 90, borderRadius: 45 },
  modalPhotoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  modalPhotoHint: { fontSize: 14 },
  modalField: { gap: 6 },
  modalFieldLabel: { fontSize: 14, marginLeft: 2 },
  modalInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  modalInputText: { flex: 1, fontSize: 17, padding: 0 },

  // Topics
  topicsList: { gap: 10 },
  topicCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  topicNumber: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  topicNumberText: { fontSize: 17 },
  topicTextBlock: { flex: 1, gap: 2 },
  topicTitle: { fontSize: 18 },
  topicDesc: { fontSize: 14 },

  // Reminder
  reminderToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, borderWidth: 1, padding: 14 },
  reminderToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  reminderToggleEmoji: { fontSize: 26 },
  reminderToggleTitle: { fontSize: 16 },
  reminderToggleSub: { fontSize: 13, marginTop: 2 },
  timeLabel: { fontSize: 14, alignSelf: "flex-start" },
  timePresets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 9, alignItems: "center" },
  timeChipText: { fontSize: 16 },
  reminderPreview: { borderRadius: 14, borderWidth: 1.5, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reminderPreviewEmoji: { fontSize: 20 },
  reminderPreviewText: { fontSize: 14, flex: 1, lineHeight: 20, fontStyle: "italic" },
  webNotice: { borderRadius: 14, borderWidth: 1, padding: 18, alignItems: "center", gap: 10 },
  webNoticeEmoji: { fontSize: 36 },
  webNoticeText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
