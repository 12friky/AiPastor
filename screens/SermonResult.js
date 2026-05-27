import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import bibleDB from '../src/services/bibleDB';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS_META = {
  'opening scripture': { icon: '📖', color: '#1B4332', bg: '#D8F3DC', border: '#B7E4C7' },
  'introduction': { icon: '🔥', color: '#7B2D00', bg: '#FFF3E0', border: '#FFCC80' },
  'point 1': { icon: '①', color: '#1A237E', bg: '#E8EAF6', border: '#C5CAE9' },
  'point 2': { icon: '②', color: '#1A237E', bg: '#E8EAF6', border: '#C5CAE9' },
  'point 3': { icon: '③', color: '#1A237E', bg: '#E8EAF6', border: '#C5CAE9' },
  'illustration': { icon: '💡', color: '#4A148C', bg: '#F3E5F5', border: '#CE93D8' },
  'climax': { icon: '⚡', color: '#B71C1C', bg: '#FFEBEE', border: '#EF9A9A' },
  'altar call': { icon: '🙏', color: '#004D40', bg: '#E0F2F1', border: '#80CBC4' },
  'closing verse': { icon: '✝️', color: '#1B153F', bg: '#EDE7F6', border: '#B39DDB' },
  "preacher's tip": { icon: '🎙️', color: '#1A237E', bg: '#E3F2FD', border: '#90CAF9' },
};

function getSectionMeta(sectionLabel) {
  const lower = (sectionLabel || '').toLowerCase();
  for (const key of Object.keys(SECTIONS_META)) {
    if (lower.includes(key)) return SECTIONS_META[key];
  }
  return { icon: '📋', color: '#37474F', bg: '#ECEFF1', border: '#CFD8DC' };
}

function normalizeTextValue(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeTextValue(entry))
      .filter((entry) => entry)
      .join('\n');
  }

  if (value && typeof value === 'object') {
    const lines = [];
    for (const [key, entryValue] of Object.entries(value)) {
      const normalized = normalizeTextValue(entryValue);
      if (normalized) {
        if (typeof entryValue === 'string') {
          lines.push(normalized);
        } else {
          lines.push(`${key}: ${normalized}`);
        }
      }
    }
    return lines.join('\n');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function SectionCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getSectionMeta(item.section || '');
  const hasTags = item.tags && item.tags.trim() !== '';
  const isClimax = (item.section || '').toLowerCase().includes('climax');

  return (
    <View style={[styles.card, { borderColor: meta.border }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Text style={styles.iconText}>{meta.icon}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: meta.color }]}>
            {item.section || `Section ${index + 1}`}
          </Text>
          {hasTags && (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>Bible verse</Text>
              </View>
            </View>
          )}
        </View>
        <View style={[styles.chevronBox, { backgroundColor: meta.bg }]}>
          <Text style={[styles.chevron, { color: meta.color }]}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={[styles.bodyDivider, { backgroundColor: meta.border }]} />
          {isClimax && (
            <Text style={styles.climaxLabel}>— The Explosion Moment —</Text>
          )}
          <Text style={[styles.cardText, isClimax && styles.climaxText]}>
            {item.text}
          </Text>
          {hasTags && (
            <View style={[styles.verseBox, { borderColor: meta.border }]}>
              <Text style={[styles.verseLabel, { color: meta.color }]}>Scripture</Text>
              <Text style={[styles.verseTags, { color: meta.color }]}>{item.tags}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function SermonResult({ topic, sections, onBack }) {
  const [isSaving, setIsSaving] = useState(false);
  const normalizedSections = (sections || []).map((item, index) => ({
    section: normalizeTextValue(item?.section) || `Section ${index + 1}`,
    text: normalizeTextValue(item?.text) || '',
    tags: normalizeTextValue(item?.tags) || '',
  }));
  const sermonSections = normalizedSections.length > 0 ? normalizedSections : [
    {
      section: 'Opening Scripture',
      text: 'John 14:16–17 — "And I will ask the Father, and he will give you another advocate to help you and be with you forever — the Spirit of truth."',
      tags: 'John 14:16–17, John 16:13',
    },
    {
      section: 'Introduction (Hook)',
      text: 'Imagine a person who moves to a brand new city — they know no one. Has God ever left any of His children without a companion? Before Jesus left the earth, He made a promise: you will NOT be left alone. That promise is the Holy Spirit.',
      tags: '',
    },
    {
      section: 'Point 1 — A Person, not a power',
      text: 'Many people treat the Spirit like electricity — something you switch on. But Jesus said "He", not "it". The Holy Spirit has a mind, emotions, and a will. You can grieve Him, lie to Him, and fellowship with Him. He is God — the third person of the Trinity.',
      tags: 'John 16:13, Acts 5:3–4, Romans 8:27',
    },
    {
      section: 'Point 2 — The "Another" like Jesus',
      text: 'Jesus used the word Paraclete — "another of the same kind." He is everything Jesus was — teacher, helper, comforter, guide, intercessor — now living inside every believer. Where Jesus walked beside them, the Spirit walks INSIDE us.',
      tags: 'John 14:16, John 14:26, Romans 8:26',
    },
    {
      section: 'Point 3 — With you permanently',
      text: 'In the Old Testament, the Spirit came upon people temporarily — for a task, a season. But Jesus promised "he will be with you forever." This companion does not leave when life gets hard. He is the seal of God\'s ownership on your life.',
      tags: 'John 14:16, Ephesians 1:13–14, Ephesians 4:30',
    },
    {
      section: 'Illustration',
      text: 'A traveler in an unfamiliar country is given a guide who knows every road, every danger, every shortcut — and has promised never to leave their side. That is the Holy Spirit. He was there before the world was formed. He knows every road of your life ahead — and He is walking it with you.',
      tags: '',
    },
    {
      section: 'Climax — The Explosion Moment',
      text: 'You are NEVER truly alone. Not in the hospital room at 3am. Not when the marriage broke. Not when you buried your child. Not when everyone walked away. The companion Jesus sent — He was there. He IS there. And He will NEVER leave you.',
      tags: '',
    },
    {
      section: 'Altar Call / Application',
      text: '1. For the unsaved — Receive Jesus today, and the Father will give you the Holy Spirit.\n\n2. For the believer living like an orphan — Your companion has been there all along. Turn to Him. Begin to speak to Him.\n\n3. For a fresh encounter — Open your heart for a new filling of the Spirit, right here, right now.',
      tags: '',
    },
    {
      section: 'Closing Verse',
      text: '"The grace of the Lord Jesus Christ, and the love of God, and the fellowship of the Holy Spirit be with you all." — 2 Corinthians 13:14',
      tags: '2 Corinthians 13:14',
    },
    {
      section: "Preacher's Tip",
      text: 'Before you close, ask the congregation to be still and simply whisper "Holy Spirit, thank You for being with me." That simple act of acknowledgment can open hearts powerfully. Let the Spirit move — don\'t rush the climax.',
      tags: '',
    },
  ];

  const displayTopic = topic || 'The Holy Spirit: Our Companion';

  const handleSaveSermon = async () => {
    setIsSaving(true);
    try {
      await bibleDB.saveSermon(displayTopic, sermonSections);
      Alert.alert('Saved', 'Sermon saved successfully.');
    } catch (err) {
      console.error('Save sermon error', err);
      Alert.alert('Save Error', 'Unable to save sermon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySermon = async () => {
    const text = sermonSections.map((item) => `${item.section}\n${item.text}`).join('\n\n');
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Sermon copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.topBarTitle}>Sermon</Text>
          <Text style={styles.topBarSub} numberOfLines={1}>{displayTopic}</Text>
        </View>
        <View style={styles.topBarBadge}>
          <Text style={styles.topBarBadgeText}>{sermonSections.length} sections</Text>
        </View>
      </View>

      <View style={styles.heroBanner}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroEmoji}>✝</Text>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.heroLabel}>Today's message</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>{displayTopic}</Text>
          <Text style={styles.heroHint}>Tap any section to read</Text>
        </View>
      </View>

      <View style={styles.heroActions}>
        <TouchableOpacity style={styles.heroActionButton} onPress={handleCopySermon} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={16} color="#534AB7" />
          <Text style={styles.heroActionText}>Copy sermon</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.heroActionButton, styles.heroActionSave]} onPress={handleSaveSermon} activeOpacity={0.8} disabled={isSaving}>
          <Ionicons name="save-outline" size={16} color="#FFFFFF" />
          <Text style={[styles.heroActionText, styles.heroActionSaveText]}>{isSaving ? 'Saving...' : 'Save sermon'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sermonSections.map((item, index) => (
          <SectionCard key={index} item={item} index={index} />
        ))}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Prepared with prayer · Preach with power</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEECF8',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEEDFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#3C3489',
    lineHeight: 24,
  },
  topBarText: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B153F',
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 11,
    color: '#7D7A9A',
    marginTop: 1,
  },
  topBarBadge: {
    backgroundColor: '#EEEDFE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topBarBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#534AB7',
  },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B153F',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  heroLeft: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  heroRight: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  heroHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
  },
  heroActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  heroActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E3EF',
    backgroundColor: '#FFFFFF',
  },
  heroActionSave: {
    backgroundColor: '#534AB7',
    borderColor: '#534AB7',
  },
  heroActionText: {
    color: '#534AB7',
    fontSize: 12,
    fontWeight: '600',
  },
  heroActionSaveText: {
    color: '#FFFFFF',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },

  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E4E3EF',
    overflow: 'hidden',
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 20,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  chevron: {
    fontSize: 11,
    fontWeight: '700',
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  bodyDivider: {
    height: 1,
    marginBottom: 14,
    borderRadius: 1,
  },
  climaxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B71C1C',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 12,
    color: '#2E2A4D',
    lineHeight: 20,
  },
  climaxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B71C1C',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  verseBox: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 0,
    padding: 10,
    backgroundColor: 'transparent',
  },
  verseLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
    opacity: 0.7,
  },
  verseTags: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },

  footer: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#B0AEC8',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});