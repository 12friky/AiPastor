import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const tools = [
  { key: 'prayer', label: 'Prayer gen', icon: 'heart-outline' },
  { key: 'social', label: 'Social writer', icon: 'chatbubble-outline' },
  { key: 'announce', label: 'Announcement', icon: 'megaphone-outline' },
  { key: 'bulletin', label: 'Bulletin writer', icon: 'document-text-outline' },
];

export default function Tools() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tools</Text>
        </View>

        <View style={styles.grid}>
          {tools.map((t) => (
            <TouchableOpacity key={t.key} style={styles.card} activeOpacity={0.8}>
              <Ionicons name={t.icon} size={22} color="#6E63E7" />
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardSub}>Open</Text>
            </TouchableOpacity>
          ))}
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B153F',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FBFBFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#1B153F',
  },
  cardSub: {
    color: '#7D7A9A',
    fontSize: 11,
    marginTop: 6,
  },
});
