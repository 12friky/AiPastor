import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FEATURES = [
  'Unlimited Sermon Generation',
  'Unlimited AI Pastor Chat',
  'Unlimited Bible Explanations',
  'Download Sermons as PDF',
  'Priority Support',
];

/**
 * UpgradeScreen
 *
 * Props:
 *   message        — string shown in red at the top (passed from the caller)
 *   requiresUpgrade — boolean; when true the back button is hidden so the
 *                     user cannot return to use AI features for free
 *   onBack         — function called when the back button is pressed
 *                     (only shown when requiresUpgrade is false)
 */
export default function UpgradeScreen({ message, requiresUpgrade = false, onBack }) {
  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'Payment integration is coming soon. Thank you for your interest in Premium!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header — back button only shown when NOT requiresUpgrade */}
      <View style={styles.header}>
        {!requiresUpgrade && onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#534AB7" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Crown icon */}
        <View style={styles.crownWrap}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>

        <Text style={styles.title}>Upgrade to Premium</Text>

        {/* Message from navigation (e.g. "Your free tokens are finished") */}
        {!!message && (
          <View style={styles.messageBanner}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {/* Explanation */}
        <View style={styles.explanationCard}>
          <Text style={styles.explanationText}>
            You have used all 20 of your free tokens.{'\n\n'}
            To continue using AiPastor you need to upgrade.{'\n\n'}
            This was a one-time free trial — Premium gives you unlimited access to every feature.
          </Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureCard}>
          <Text style={styles.featureCardTitle}>What you get with Premium</Text>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✅</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>$9.99</Text>
          <Text style={styles.pricePeriod}> / month</Text>
        </View>

        {/* Upgrade button */}
        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
          <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
        </TouchableOpacity>

        {/* Note */}
        <Text style={styles.note}>
          Cancel anytime. Secure payment powered by Stripe.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: {
    width: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B153F',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  crownWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  crownEmoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B153F',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageBanner: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    width: '100%',
  },
  messageText: {
    fontSize: 13,
    color: '#BE123C',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
  },
  explanationCard: {
    backgroundColor: '#F8F7FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E3EF',
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  explanationText: {
    fontSize: 13,
    color: '#3F3C60',
    lineHeight: 21,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featureCheck: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#1B153F',
    fontWeight: '500',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1B153F',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#7D7A9A',
    fontWeight: '500',
  },
  upgradeBtn: {
    backgroundColor: '#534AB7',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
    shadowColor: '#534AB7',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  note: {
    fontSize: 11,
    color: '#A7A3C2',
    textAlign: 'center',
    lineHeight: 16,
  },
});
