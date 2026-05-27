import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '../apiService';
import bibleDB from '../src/services/bibleDB';

const TOOL_OPTIONS = [
  { key: 'prayer', label: 'Prayer gen', icon: 'heart-outline' },
  { key: 'social', label: 'Social writer', icon: 'chatbubble-outline' },
  { key: 'announcement', label: 'Announcement', icon: 'megaphone-outline' },
  { key: 'bulletin', label: 'Bulletin writer', icon: 'document-text-outline' },
];

export default function ToolHub({ selectedTool, onBack }) {
  const defaultTool = TOOL_OPTIONS[0].key;
  const [prompt, setPrompt] = useState('');
  const [activeTool, setActiveTool] = useState(selectedTool || defaultTool);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setActiveTool(selectedTool || defaultTool);
  }, [selectedTool]);

  const activeToolItem = TOOL_OPTIONS.find((item) => item.key === activeTool) || TOOL_OPTIONS[0];
  const activeToolLabel = activeToolItem.label;

  const handleGenerate = async () => {
    if (!activeTool || !prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedText('');

    const toolPrompt = `Generate a ${activeToolLabel.toLowerCase()} using the following user prompt: ${prompt}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/gemin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: toolPrompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Backend generation failed');
      }

      setGeneratedText(data.response || 'No response from backend');
    } catch (error) {
      Alert.alert('Generation Error', error.message || 'Unable to generate content');
      setGeneratedText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    await Clipboard.setStringAsync(generatedText);
    Alert.alert('Copied', `${activeToolLabel} copied to clipboard.`);
  };

  const handleSave = async () => {
    if (!generatedText) {
      Alert.alert('Nothing to save', 'Generate content first.');
      return;
    }

    setIsSaving(true);
    try {
      await bibleDB.saveToolItem({
        type: activeTool,
        title: `${activeToolLabel} - ${new Date().toLocaleString()}`,
        prompt: prompt.trim(),
        result: generatedText,
      });
      Alert.alert('Saved', `${activeToolLabel} saved successfully.`);
    } catch (err) {
      console.error('Tool save error', err);
      Alert.alert('Save Error', 'Unable to save the generated content.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#534AB7" />
        </TouchableOpacity>
        <Text style={styles.title}>Create content</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Choose a content type and enter a prompt below.</Text>

        <View style={styles.optionRow}>
          {TOOL_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.optionCard, activeTool === item.key && styles.optionCardActive]}
              onPress={() => setActiveTool(item.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={activeTool === item.key ? '#FFFFFF' : '#534AB7'}
              />
              <Text style={[styles.optionLabel, activeTool === item.key && styles.optionLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Prompt</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={`Enter a prompt for ${activeTool}`}
            placeholderTextColor="#BBBAC9"
            style={styles.input}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, (!prompt.trim() || isGenerating) && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateButtonText}>Generate {activeTool}</Text>
          )}
        </TouchableOpacity>

        {generatedText ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Generated result</Text>
            <Text style={styles.resultText}>{generatedText}</Text>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopy} activeOpacity={0.8}>
                <Ionicons name="copy-outline" size={16} color="#534AB7" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B153F',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    color: '#A7A3C2',
    fontSize: 12,
    marginBottom: 18,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  optionCard: {
    width: '48%',
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: '#534AB7',
    borderColor: '#534AB7',
  },
  optionLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#1B153F',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: '#FFFFFF',
  },
  inputCard: {
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F9F9FF',
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A7A3C2',
    marginBottom: 8,
  },
  input: {
    minHeight: 100,
    color: '#2F2D44',
    fontSize: 13,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#534AB7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#F2F2FF',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E4E3EF',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E3EF',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#534AB7',
    borderColor: '#534AB7',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#534AB7',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  resultLabel: {
    fontSize: 12,
    color: '#6F6AC7',
    marginBottom: 8,
    fontWeight: '700',
  },
  resultText: {
    fontSize: 13,
    color: '#2F2D44',
    lineHeight: 20,
  },
  generateButtonDisabled: {
    backgroundColor: '#C5C2E8',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
