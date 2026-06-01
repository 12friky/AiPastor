import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../src/services/bibleDB';

// ─── Friendly error messages ──────────────────────────────────────────────────
function getFriendlyError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('no internet')
  ) {
    return {
      icon: '📶',
      title: 'No internet connection',
      body: 'It looks like you are offline. Please check your Wi-Fi or mobile data and try again.',
    };
  }
  if (
    msg.includes('gemini') ||
    msg.includes('api key') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('503') ||
    msg.includes('500')
  ) {
    return {
      icon: '🤖',
      title: 'AI is taking a break',
      body: 'Our AI assistant is temporarily unavailable. Please wait a moment and try again.',
    };
  }
  return {
    icon: '⚠️',
    title: 'Something went wrong',
    body: 'We could not load this right now. Please try again.',
  };
}

// ─── Inline error banner used inside cards ────────────────────────────────────
function ErrorBanner({ err, onRetry }) {
  const info = getFriendlyError(err);
  return (
    <View style={errorStyles.banner}>
      <Text style={errorStyles.bannerIcon}>{info.icon}</Text>
      <View style={errorStyles.bannerText}>
        <Text style={errorStyles.bannerTitle}>{info.title}</Text>
        <Text style={errorStyles.bannerBody}>{info.body}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity style={errorStyles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={errorStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDCD',
    padding: 12,
    gap: 10,
  },
  bannerIcon: { fontSize: 22, marginTop: 2 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#B91C1C', marginBottom: 3 },
  bannerBody: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },
  retryBtn: {
    backgroundColor: '#B91C1C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});


export default function Home({ onOpenTools, onUpgradePress }) {
  const [verseOfTheDay, setVerseOfTheDay] = useState(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [verseError, setVerseError] = useState(null);

  const loadVerseOfTheDay = async () => {
    try {
      setVerseLoading(true);
      setVerseError(null);
      const verse = await bibleDB.getVerseOfTheDay();
      setVerseOfTheDay(verse);
    } catch (error) {
      setVerseError(error);
    } finally {
      setVerseLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setVerseLoading(true);
        setVerseError(null);
        const verse = await bibleDB.getVerseOfTheDay();
        if (isMounted) setVerseOfTheDay(verse);
      } catch (error) {
        if (isMounted) setVerseError(error);
      } finally {
        if (isMounted) setVerseLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, []);

  const onToolPress = (tool) => {
    if (onOpenTools) {
      onOpenTools(tool);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.cardLight}>
        <Text style={styles.cardLabel}>VERSE OF THE DAY</Text>
        {verseLoading ? (
          <View style={styles.verseLoadingRow}>
            <ActivityIndicator size="small" color="#534AB7" />
            <Text style={styles.verseLoadingText}>Loading verse...</Text>
          </View>
        ) : verseError ? (
          <ErrorBanner err={verseError} onRetry={loadVerseOfTheDay} />
        ) : verseOfTheDay ? (
          <>
            <Text style={styles.cardTitle}>"{verseOfTheDay.text}"</Text>
            <Text style={styles.cardSubtitle}>{verseOfTheDay.book_name} {verseOfTheDay.chapter}:{verseOfTheDay.verse}</Text>
          </>
        ) : (
          <Text style={styles.cardTitle}>Daily verse will appear here.</Text>
        )}
      </View>

      <View style={styles.cardFeature}>
        <Text style={styles.featureLabel}>MAIN FEATURE</Text>
        <Text style={styles.featureTitle}>Sermon builder</Text>
        <Text style={styles.featureSubtitle}>Type a topic — AI builds your full sermon</Text>
        <TouchableOpacity style={styles.featureButton} activeOpacity={0.8}>
          <Text style={styles.featureButtonText}>New sermon</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick tools</Text>
      </View>

      <View style={styles.toolsGrid}>
        {[
          { key: 'prayer', label: 'Prayer gen', icon: 'square-outline' },
          { key: 'social', label: 'Social writer', icon: 'chatbubble-outline' },
          { key: 'announcement', label: 'Announcement', icon: 'megaphone-outline' },
          { key: 'bulletin', label: 'Bulletin writer', icon: 'document-text-outline' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.toolCard}
            activeOpacity={0.7}
            onPress={() => onToolPress(item.key)}
          >
            <Ionicons name={item.icon} size={18} color="#534AB7" />
            <Text style={styles.toolLabel}>{item.label}</Text>
            <Text style={styles.toolSub}>Write & share</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderTopGap}>
        <Text style={styles.sectionTitle}>Recent sermons</Text>
      </View>

      <View style={styles.recentCard}>
        <View style={styles.recentRow}>
          <View style={styles.dot} />
          <Text style={styles.recentTitle}>Love and peace in troubled times</Text>
        </View>
        <Text style={styles.recentMeta}>May 18 · 30 min</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },

  cardLight: {
    backgroundColor: '#F9F9FF',
    borderColor: '#D8DBFF',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  cardLabel: {
    color: '#6F6AC7',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#1B153F',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#5F5D7B',
    fontSize: 10,
    fontWeight: '600',
  },
  verseLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verseLoadingText: {
    color: '#5F5D7B',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardFeature: {
    backgroundColor: '#EEF0FF',
    borderColor: '#D4D9FF',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  featureLabel: {
    color: '#6F6AC7',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },
  featureTitle: {
    color: '#1B153F',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureSubtitle: {
    color: '#5F5D7B',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  featureButton: {
    backgroundColor: '#E7E6FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  featureButtonText: {
    color: '#1B153F',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderTopGap: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#1B153F',
    fontSize: 13,
    fontWeight: '700',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#FBFBFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    minHeight: 86,
    justifyContent: 'space-between',
  },
  toolLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#1B153F',
  },
  toolSub: {
    color: '#7D7A9A',
    fontSize: 10,
    marginTop: 4,
  },
  recentCard: {
    backgroundColor: '#F5F6FF',
    borderRadius: 20,
    padding: 14,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6E63E7',
    marginRight: 10,
  },
  recentTitle: {
    color: '#1B153F',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  recentMeta: {
    color: '#7D7A9A',
    fontSize: 10,
  },
});
