import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../src/services/bibleDB';

export default function SavedSermonsScreen({ onBack }) {
  const [savedSermons, setSavedSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const loadSavedSermons = async () => {
    try {
      setLoading(true);
      const rows = await bibleDB.getSavedSermons();
      setSavedSermons(rows);
    } catch (err) {
      console.error('Load saved sermons', err);
      Alert.alert('Error', 'Unable to load saved sermons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSermons();
  }, []);

  const handleDelete = async (item) => {
    Alert.alert('Delete this sermon?', 'This will remove it from your saved sermons.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bibleDB.removeSavedSermon(item.id);
            setSavedSermons((prev) => prev.filter((entry) => entry.id !== item.id));
          } catch (err) {
            console.error('Delete saved sermon', err);
            Alert.alert('Error', 'Unable to delete this sermon.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#534AB7" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Sermons</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#534AB7" />
        ) : savedSermons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No saved sermons yet.</Text>
          </View>
        ) : (
          savedSermons.map((item) => {
            let sections = [];
            const cleanText = (value) => String(value || '')
              .replace(/\r\n/g, '\n')
              .replace(/[\t\u00a0]+/g, ' ')
              .replace(/\s*\n\s*/g, '\n')
              .replace(/\n{3,}/g, '\n\n')
              .replace(/\s+/g, ' ')
              .trim();
            const cleanSection = (value) => cleanText(value).replace(/^\*+|\*+$/g, '').trim();
            try {
              sections = item.sections_json ? JSON.parse(item.sections_json) : [];
              sections = Array.isArray(sections)
                ? sections.map((entry) => ({
                    section: cleanSection(entry?.section || 'SECTION'),
                    text: cleanText(entry?.text || ''),
                  }))
                : [];
            } catch (error) {
              sections = [];
            }
            const isExpanded = expandedId === item.id;
            const previewText = sections.length > 0
              ? sections.slice(0, 2).map((entry) => entry.text || '').join(' ')
              : 'No sermon content available yet.';
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{item.topic || 'Untitled sermon'}</Text>
                    <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} style={styles.iconButton} activeOpacity={0.8}>
                      <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color="#534AB7" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={18} color="#E15A5A" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardSummary}>{sections.length} sections</Text>
                {isExpanded ? (
                  <View style={styles.expandedBody}>
                    {sections.slice(0, 6).map((entry, index) => (
                      <Text key={`${item.id}-${index}`} style={styles.previewText}>{entry.section ? `${entry.section}: ${entry.text}` : entry.text}</Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.previewText} numberOfLines={2}>{previewText}</Text>
                )}
              </View>
            );
          })
        )}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E7F8',
  },
  backButton: {
    marginRight: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B153F',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#F7F7FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9E8F5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B153F',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 11,
    color: '#7D7A9A',
  },
  cardSummary: {
    fontSize: 13,
    color: '#4F4A78',
  },
  previewText: {
    fontSize: 12,
    color: '#4F4A78',
    lineHeight: 18,
    marginTop: 6,
  },
  expandedBody: {
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#EEF0FF',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#FFF4F4',
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7D7A9A',
    fontSize: 13,
  },
});
