import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../apiService';
import { Ionicons } from '@expo/vector-icons';
import SermonResult from './SermonResult';
import { useTokens } from '../src/contexts/TokenContext';

// ─── Friendly error classifier ────────────────────────────────────────────────
function getFriendlyError(err) {
  const msg = (err?.message || String(err || '')).toLowerCase();
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
      body: "It looks like you're offline. Please check your Wi-Fi or mobile data and try again.",
    };
  }
  if (msg.includes('not authorized') || msg.includes('401') || msg.includes('invalid token')) {
    return {
      icon: '🔑',
      title: 'Session expired',
      body: 'Please log out and log back in, then try again.',
    };
  }
  if (
    msg.includes('gemini') ||
    msg.includes('api key') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('busy') ||
    msg.includes('overloaded')
  ) {
    return {
      icon: '🤖',
      title: 'AI is taking a break',
      body: 'The AI assistant is busy right now. Please wait a moment and try again.',
    };
  }
  return {
    icon: '⚠️',
    title: 'Something went wrong',
    body: 'We could not build your sermon right now. Please try again.',
  };
}

function ErrorCard({ err, onRetry }) {
  const info = getFriendlyError(err);
  return (
    <View style={errorStyles.card}>
      <Text style={errorStyles.icon}>{info.icon}</Text>
      <Text style={errorStyles.title}>{info.title}</Text>
      <Text style={errorStyles.body}>{info.body}</Text>
      {onRetry && (
        <TouchableOpacity style={errorStyles.btn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={errorStyles.btnText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF4F4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECDCD',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '700', color: '#B91C1C', marginBottom: 6, textAlign: 'center' },
  body: { fontSize: 13, color: '#7F1D1D', lineHeight: 19, textAlign: 'center', marginBottom: 14 },
  btn: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default function Sermon({ onTokensExpired }) {
  const [topic, setTopic] = useState('Love and peace');
  const [selectedAudience, setSelectedAudience] = useState('Congregation');
  const [selectedLength, setSelectedLength] = useState('5-8 minutes');
  const [selectedTone, setSelectedTone] = useState('Encouraging');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSermon, setGeneratedSermon] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [cachedSermon, setCachedSermon] = useState(null);
  const [generateError, setGenerateError] = useState(null);
  const { isExpired, refreshTokenStatus } = useTokens();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('cached_sermon');
        if (stored) {
          setCachedSermon(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Load cached sermon failed', error);
      }
    })();
  }, []);

  const audiences = ['Congregation', 'Youth group', 'Parents', 'Leaders'];
  const lengths = ['5-8 minutes', '10-12 minutes', '15-20 minutes'];
  const tones = ['Encouraging', 'Convicting', 'Teaching', 'Evangelistic'];

  const expectedSections = [
    'SERMON TITLE',
    'FOCUS / THEME',
    'OPENING SCRIPTURE',
    'INTRODUCTION',
    'Point 1',
    'Point 2',
    'Point 3',
    'Point 4',
    'ILLUSTRATION',
    'CLIMAX',
    'ALTAR CALL / APPLICATION',
    'CLOSING VERSE',
    'PRAYER POINTS',
    'PREACHING TIPS',
  ];

  const normalizeSermonText = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/\r\n/g, '\n')      // normalise line endings
        .replace(/[\t\u00a0]+/g, ' ') // tabs/nbsp → space
        .replace(/\n{3,}/g, '\n\n')   // max 2 consecutive newlines
        .trim();
      // NOTE: do NOT collapse \s+ to ' ' — that destroys paragraph breaks
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => normalizeSermonText(entry))
        .filter(Boolean)
        .join('\n');
    }

    if (value && typeof value === 'object') {
      const lines = [];
      for (const [key, entryValue] of Object.entries(value)) {
        const normalized = normalizeSermonText(entryValue);
        if (!normalized) continue;
        if (typeof entryValue === 'string' || typeof entryValue === 'number' || typeof entryValue === 'boolean') {
          lines.push(normalized);
        } else {
          lines.push(`${key}: ${normalized}`);
        }
      }
      return lines.join('\n');
    }

    return String(value ?? '').replace(/\r\n/g, '\n').trim();
  };

  const normalizeSectionTitle = (value) => normalizeSermonText(value)
    .replace(/\s+/g, ' ')
    .replace(/^\*+|\*+$/g, '')
    .trim();

  const parseSermonResponse = (responseText) => {
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const tryParseJson = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.every((item) => item.section || item.text)) {
          return parsed.map((item) => ({
            section: normalizeSectionTitle(normalizeSermonText(item.section || 'SECTION')),
            text: normalizeSermonText(item.text || ''),
          }));
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    let parsed = tryParseJson(cleaned);
    if (!parsed) {
      const jsonMatch = cleaned.match(/(\[\s*\{[\s\S]*\}\s*\])/m);
      if (jsonMatch) {
        parsed = tryParseJson(jsonMatch[1]);
      }
    }

    if (parsed) {
      return parsed;
    }

    const sections = [];
    const pattern = new RegExp(
      `(${expectedSections.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\\$&')).join('|')})(?:\s*:?\s*)`,
      'g'
    );

    const parts = cleaned.split(pattern).map((part) => part.trim()).filter((part) => part !== '');
    for (let i = 0; i < parts.length; i += 2) {
      const section = normalizeSectionTitle(parts[i]);
      const text = normalizeSermonText(parts[i + 1] || '');
      if (section && text) {
        sections.push({ section, text });
      }
    }

    if (sections.length > 0) {
      return sections;
    }

    return [
      {
        section: 'SERMON',
        text: cleaned,
      },
    ];
  };

  const storeCachedSermon = async (sermonData) => {
    try {
      const payload = {
        topic,
        selectedAudience,
        selectedLength,
        selectedTone,
        sermon: sermonData,
        cachedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('cached_sermon', JSON.stringify(payload));
      setCachedSermon(payload);
    } catch (error) {
      console.warn('Cache sermon failed', error);
    }
  };

  const handleGenerate = async () => {
    // ── Token guard ──────────────────────────────────────────────────────
    if (isExpired) {
      if (onTokensExpired) onTokensExpired();
      return;
    }

    if (!topic.trim()) {
      setGenerateError({ message: 'Please enter a sermon topic before building.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedSermon(null);
    setShowResult(false);
    setGenerateError(null);

    const prompt = `You are a sermon writing assistant. Generate a complete sermon as a JSON array. Do not write anything outside the JSON array. No markdown. No explanation. No code fences. Just the raw JSON array.

Topic: "${topic}"
Audience: ${selectedAudience}
Tone: ${selectedTone}
Length: ${selectedLength}
Voice: Warm, bold, African Pentecostal preaching style. Passionate, scripture-backed, congregation-focused.

Return ONLY a valid JSON array with exactly these 14 objects in this exact order. Each object has a "section" key and a "text" key:

[
  { "section": "SERMON TITLE", "text": "..." },
  { "section": "FOCUS / THEME", "text": "..." },
  { "section": "OPENING SCRIPTURE", "text": "Full Bible verse with reference and translation" },
  { "section": "INTRODUCTION", "text": "Engaging Spirit-filled opening. Use phrases like Hallelujah, Can I get an Amen" },
  { "section": "Point 1", "text": "First main point with scripture references" },
  { "section": "Point 2", "text": "Second main point with scripture references" },
  { "section": "Point 3", "text": "Third main point with scripture references" },
  { "section": "Point 4", "text": "Fourth main point with scripture references" },
  { "section": "ILLUSTRATION", "text": "A powerful real-life story or example" },
  { "section": "CLIMAX", "text": "The explosive high point of the sermon. Bold and fire-filled." },
  { "section": "ALTAR CALL / APPLICATION", "text": "Call to action and prayer of salvation" },
  { "section": "CLOSING VERSE", "text": "A closing scripture with full quote and reference" },
  { "section": "PRAYER POINTS", "text": "At least 4 specific pastoral prayer points tied to the sermon theme" },
  { "section": "PREACHING TIPS", "text": "Practical delivery tips for the preacher" }
]

STRICT RULES:
- Output ONLY the JSON array above. Nothing before it. Nothing after it.
- Do NOT wrap in markdown code fences.
- Do NOT add extra sections or keys.
- Every "section" value must match exactly one of the 14 titles listed above.
- Every "text" value must be a plain string (no nested objects or arrays).
`;

    try {
      const storedToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/gemin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        body: JSON.stringify({ message: prompt, feature: 'GENERATE_SERMON' }),
      });

      const data = await response.json();

      if (data.error === 'OUT_OF_TOKENS') {
        if (onTokensExpired) onTokensExpired();
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate sermon');
      }

      let aiText = data.response || '';
      aiText = aiText.replace(/^```json/mi, '').replace(/```$/m, '').trim();
      const parsedSermon = parseSermonResponse(aiText);
      setGeneratedSermon(parsedSermon);
      await storeCachedSermon(parsedSermon);
      await refreshTokenStatus();
      setShowResult(true);
    } catch (error) {
      setGenerateError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPrevious = () => {
    if (!cachedSermon?.sermon) {
      Alert.alert('No cached sermon', 'Generate a sermon first to save a previous version.');
      return;
    }
    setGeneratedSermon(cachedSermon.sermon);
    setShowResult(true);
  };

  const handleGenerateNew = async () => {
    await AsyncStorage.removeItem('cached_sermon');
    setCachedSermon(null);
    await handleGenerate();
  };

  if (showResult && generatedSermon) {
    return (
      <SermonResult
        topic={cachedSermon?.topic || topic}
        sections={generatedSermon}
        onBack={() => setShowResult(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenLabel}>Sermon builder</Text>
          </View>
          <View style={styles.iconGroup}>
            <TouchableOpacity style={styles.smallIcon} activeOpacity={0.8}>
              <Ionicons name="square-outline" size={18} color="#1B153F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallIcon} activeOpacity={0.8}>
              <Ionicons name="square-outline" size={18} color="#1B153F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>SERMON TOPIC</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            style={styles.textInput}
            placeholder="Love and peace"
            placeholderTextColor="#8E86B8"
          />
        </View>

        <Text style={styles.fieldLabel}>AUDIENCE</Text>
        <View style={styles.chipRow}>
          {audiences.map((item) => {
            const active = item === selectedAudience;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedAudience(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>LENGTH</Text>
        <View style={styles.chipRow}>
          {lengths.map((item) => {
            const active = item === selectedLength;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedLength(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>TONE</Text>
        <View style={styles.chipRow}>
          {tones.map((tone) => {
            const active = tone === selectedTone;
            return (
              <TouchableOpacity
                key={tone}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedTone(tone)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tone}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.buildButton, isGenerating && { opacity: 0.7 }]} 
          activeOpacity={0.8}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buildButtonText}>Build my sermon</Text>
          )}
        </TouchableOpacity>

        {generateError && (
          <ErrorCard err={generateError} onRetry={handleGenerate} />
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGenerateNew} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Generate New Sermon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewPrevious} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>View Previous Sermon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B153F',
  },
  iconGroup: {
    flexDirection: 'row',
  },
  smallIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E7F4',
  },
  fieldLabel: {
    color: '#7D7A9A',
    fontSize: 10,
    marginBottom: 8,
    letterSpacing: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E8E7F8',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#2E2A4D',
    backgroundColor: '#F8F7FF',
  },
  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E7F8',
  },
  tagText: {
    color: '#1B153F',
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#F8F8FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E7F8',
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: {
    backgroundColor: '#1B153F',
    borderColor: '#1B153F',
  },
  chipText: {
    color: '#5E5694',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  buildButton: {
    backgroundColor: '#1B153F',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  buildButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  secondaryButton: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#EEF0FF',
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1B153F',
    fontSize: 12,
    fontWeight: '700',
  },
  generatedHeader: {
    marginBottom: 10,
  },
  generatedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D7A9A',
    letterSpacing: 1,
  },
  generatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E7F8',
  },
  generatedSection: {
    color: '#1B153F',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  generatedText: {
    color: '#2E2A4D',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  generatedTags: {
    color: '#7D7A9A',
    fontSize: 10,
    fontWeight: '700',
  },
});
