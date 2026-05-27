import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { API_BASE_URL } from '../apiService';
import { Ionicons } from '@expo/vector-icons';
import SermonResult from './SermonResult';

export default function Sermon() {
  const [topic, setTopic] = useState('Love and peace');
  const [selectedAudience, setSelectedAudience] = useState('Congregation');
  const [selectedLength, setSelectedLength] = useState('5-8 minutes');
  const [selectedTone, setSelectedTone] = useState('Encouraging');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSermon, setGeneratedSermon] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const audiences = ['Congregation', 'Youth group', 'Parents', 'Leaders'];
  const lengths = ['5-8 minutes', '10-12 minutes', '15-20 minutes'];
  const tones = ['Encouraging', 'Convicting', 'Teaching', 'Evangelistic'];

  const expectedSections = [
    'SERMON TITLE',
    'FOCUS',
    'OPENING SCRIPTURE (TEXT)',
    'INTRODUCTION (HOOK)',
    'Point 1',
    'Point 2',
    'Point 3',
    'ILLUSTRATION',
    'CLIMAX (THE EXPLOSION MOMENT)',
    'ALTAR CALL / APPLICATION',
    'CLOSING VERSE',
    'PREACHER\'S TIP',
  ];

  const parseSermonResponse = (responseText) => {
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const tryParseJson = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.every((item) => item.section && item.text)) {
          return parsed;
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
      const section = parts[i];
      const text = parts[i + 1] || '';
      if (section && text) {
        sections.push({ section, text: text.trim() });
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Validation', 'Please enter a sermon topic.');
      return;
    }

    setIsGenerating(true);
    setGeneratedSermon(null);
    setShowResult(false);

    const prompt = `Prepare a full structured sermon on the topic "${topic}" for a ${selectedAudience}. Tone: ${selectedTone}. Length: ${selectedLength}. Use a warm, bold, African Pentecostal preaching voice. Do not make it sound like an essay.

When I give you a sermon topic, present it in EXACTLY this format and only this format. Do not add any extra sections or text outside the JSON array.

SERMON TITLE: [Topic as a powerful title]

FOCUS: [What the congregation should understand or feel]

---

OPENING SCRIPTURE (TEXT)

- Give the main anchor verse in full

- Give 1 supporting verse

---

INTRODUCTION (HOOK)

- Label it: "Open strong"

- Give it a short title

- Write 3–5 sentences that open with a relatable human situation or story

- End the introduction with a question or statement that transitions into the sermon

---

MAIN BODY — 3 POINTS

For each point:
- Number it exactly as Point 1, Point 2, Point 3
- Give it a clear, short title
- Write 4–6 sentences explaining the point theologically and practically
- Ground it in the congregation's real life
- End each point with 2–3 key Bible verses in full

---

ILLUSTRATION

- Label it: "Story / Illustration"
- Give it a title
- Write a short vivid story or analogy (not from the Bible) that makes the sermon's main truth easy to picture and feel
- It must connect emotionally, not just intellectually

---

CLIMAX (THE EXPLOSION MOMENT)

- This is the emotional and spiritual peak of the sermon
- Write it in direct, second-person language
- It should be bold, repetitive, and building in intensity
- This is where the preacher shifts from explaining to declaring

---

ALTAR CALL / APPLICATION

- Give 3 specific invitations:
  1. For the unsaved
  2. For believers who need to return or recommit
  3. For those who want a fresh encounter or deeper experience

---

CLOSING VERSE

- One powerful verse that seals the message

---

PREACHER'S TIP

- Give 1 practical tip for delivering this sermon in the pulpit

---

RULES YOU MUST FOLLOW:
1. Always include real Bible verses written out in full
2. The 3 main points must build on each other — each one deeper than the last
3. The illustration must be original, not a Bible story
4. The climax must sound like it is spoken, not written — use repetition and rhythm
5. The altar call must have 3 distinct invitations for different people in the room
6. Write in a warm, bold, African Pentecostal preaching voice
7. Never make it sound like an essay — it must sound like a sermon

Return the output STRICTLY as a valid JSON array of objects. Only respond with the JSON array. Do not include any markdown or explanation.

The JSON array must use these exact section titles in order: SERMON TITLE, FOCUS, OPENING SCRIPTURE (TEXT), INTRODUCTION (HOOK), Point 1, Point 2, Point 3, ILLUSTRATION, CLIMAX (THE EXPLOSION MOMENT), ALTAR CALL / APPLICATION, CLOSING VERSE, PREACHER'S TIP.

Each object must have exactly these keys:
- "section": the exact section title above
- "text": the content for that section
`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/gemin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate sermon');
      }

      let aiText = data.response || '';
      aiText = aiText.replace(/^```json/mi, '').replace(/```$/m, '').trim();
      const parsedSermon = parseSermonResponse(aiText);
      setGeneratedSermon(parsedSermon);

      setShowResult(true);
    } catch (error) {
      Alert.alert('Generation Error', error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (showResult && generatedSermon) {
    return (
      <SermonResult
        topic={topic}
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
