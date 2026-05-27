import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../src/services/bibleDB';

export default function SavedToolsScreen({ onBack }) {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await bibleDB.getSavedToolItems();
        setSavedItems(rows);
      } catch (err) {
        console.error('Load saved tool items', err);
        Alert.alert('Error', 'Unable to load saved tool items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#534AB7" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved tools</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#534AB7" />
        ) : savedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No saved tool content yet.</Text>
          </View>
        ) : (
          savedItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title || item.type}</Text>
                <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              <Text style={styles.cardMeta}>{item.prompt}</Text>
              <Text style={styles.cardSummary}>{item.result}</Text>
            </View>
          ))
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
  cardHeader: {
    marginBottom: 10,
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
  cardMeta: {
    fontSize: 12,
    color: '#5F5D7B',
    marginBottom: 10,
  },
  cardSummary: {
    fontSize: 13,
    color: '#4F4A78',
    lineHeight: 20,
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
