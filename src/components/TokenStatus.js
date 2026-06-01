import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTokens } from '../contexts/TokenContext';

const TOTAL = 20;

export default function TokenStatus({ onUpgradePress }) {
  const { isPremium, isExpired, tokensRemaining } = useTokens();

  // ── Premium ──
  if (isPremium) {
    return (
      <View style={[styles.pill, styles.pillGold]}>
        <Text style={styles.pillTextGold}>👑 Premium</Text>
      </View>
    );
  }

  // ── Expired ──
  if (isExpired) {
    return (
      <TouchableOpacity style={[styles.pill, styles.pillRed]} onPress={onUpgradePress} activeOpacity={0.85}>
        <Text style={styles.pillTextRed}>🔒 0/{TOTAL} — Upgrade</Text>
      </TouchableOpacity>
    );
  }

  // ── Free with tokens ──
  const pct = tokensRemaining / TOTAL;
  const isRed    = tokensRemaining <= 2;
  const isOrange = tokensRemaining > 2 && tokensRemaining <= 10;
  const barColor = isRed ? '#DC2626' : isOrange ? '#D97706' : '#16A34A';
  const textColor = isRed ? '#DC2626' : isOrange ? '#D97706' : '#1B153F';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.count, { color: textColor }]}>
        {tokensRemaining}/{TOTAL} tokens
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(pct * 100, 3)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // compact pill for premium / expired
  pill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillGold: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  pillRed:  { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3' },
  pillTextGold: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  pillTextRed:  { fontSize: 11, fontWeight: '700', color: '#BE123C' },

  // free tier — count + bar
  wrap: {
    alignItems: 'flex-end',
  },
  count: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  track: {
    width: 80,
    height: 4,
    backgroundColor: '#E4E3EF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
