import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../src/services/bibleDB';

export default function FavoriteVersesScreen({ onBack }) {
  const [favoriteVerses, setFavoriteVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const rows = await bibleDB.getSavedBibleVerses();
      setFavoriteVerses(rows);
    } catch (err) {
      console.error('Load favorites', err);
      Alert.alert('Error', 'Unable to load favorite verses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleDelete = async (item) => {
    Alert.alert('Delete this verse?', 'This will remove it from your favorites.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bibleDB.removeFavoriteBibleVerse(item.bible_verse_id);
            setFavoriteVerses((prev) => prev.filter((entry) => entry.id !== item.id));
          } catch (err) {
            console.error('Delete favorite verse', err);
            Alert.alert('Error', 'Unable to delete this verse.');
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
        <Text style={styles.title}>Favorites</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#534AB7" />
        ) : favoriteVerses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No favorite verses yet.</Text>
          </View>
        ) : (
          favoriteVerses.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{`${item.book_name} ${item.chapter}:${item.verse}`}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={18} color="#E15A5A" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSummary}>{item.text}</Text>
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
