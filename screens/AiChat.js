import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../src/contexts/AuthContext';
import { useTokens } from '../src/contexts/TokenContext';
import { API_BASE_URL } from '../apiService';
import bibleDB from '../src/services/bibleDB';

const AI_CHAT_CACHE_KEY = 'ai_chat_cache_v1';

// ─── Friendly error classifier ────────────────────────────────────────────────
function getFriendlyError(err) {
  const msg = (err?.message || String(err || '')).toLowerCase();
  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused')
  ) {
    return "No internet connection. Check your Wi-Fi or data, then tap to retry.";
  }
  if (
    msg.includes('gemini') ||
    msg.includes('api key') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('503') ||
    msg.includes('500')
  ) {
    return "Our AI is taking a short break. Please wait a moment and tap to retry.";
  }
  return "Something went wrong. Tap this message to try again.";
}

export default function AiChat({ initialPrompt = null, onPromptHandled = () => {}, onTokensExpired }) {
  const { user } = useAuth();
  const { isExpired, refreshTokenStatus } = useTokens();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasLoadedCache, setHasLoadedCache] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);
  const handledPromptRef = useRef(null);

  const sanitizeAiText = (text = '') => text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  const scrollToEnd = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }, 80);
  };

  const persistMessages = async (nextMessages) => {
    try {
      if (!nextMessages || nextMessages.length === 0) {
        await AsyncStorage.removeItem(AI_CHAT_CACHE_KEY);
        return;
      }

      await AsyncStorage.setItem(AI_CHAT_CACHE_KEY, JSON.stringify(nextMessages));
    } catch (err) {
      console.error('AI chat cache save failed', err);
    }
  };

  const animateAiResponse = (aiId, aiFull) => {
    const cleanedText = sanitizeAiText(aiFull);
    const words = cleanedText.split(/(\s+)/);
    let idx = 0;

    const interval = setInterval(() => {
      idx += 1;
      const current = words.slice(0, idx).join('');
      setMessages((prev) => prev.map((msg) => (msg.id === aiId ? { ...msg, text: current } : msg)));
      scrollToEnd();
      if (idx >= words.length) {
        clearInterval(interval);
        setMessages((prev) => prev.map((msg) => (msg.id === aiId ? { ...msg, loading: false } : msg)));
      }
    }, 30);
  };

  const loadWelcomeMessage = async () => {
    const pastorName = user?.fullName || 'Pastor';
    const welcomePrompt = `Return exactly this welcome message only (no extra text): Peace be with you, Pastor ${pastorName}. How can I help you today? I can assist you with explaining scripture or guide you in prayers.`;

    const aiId = `ai-${Date.now()}`;
    setMessages([{ id: aiId, sender: 'ai', text: '', loading: true }]);

    try {
      const storedToken = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/gemin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        // Welcome message uses CHAT_AI_PASTOR cost
        body: JSON.stringify({ message: welcomePrompt, feature: 'CHAT_AI_PASTOR' }),
      });
      const data = await res.json();

      // If tokens ran out even on welcome, redirect to upgrade
      if (data.error === 'OUT_OF_TOKENS') {
        setMessages([]);
        if (onTokensExpired) onTokensExpired();
        return;
      }

      const aiText = data?.response || `Peace be with you, Pastor ${pastorName}. How can I help you today? I can assist you with explaining scripture or guide you in prayers.`;
      setMessages([{ id: aiId, sender: 'ai', text: sanitizeAiText(aiText), loading: false }]);
      scrollToEnd();
    } catch (err) {
      console.error('Welcome message error', err);
      const friendlyMsg = getFriendlyError(err);
      setMessages([{ id: aiId, sender: 'ai', text: friendlyMsg, loading: false, error: true }]);
    }
  };

  const sendPrompt = async (prompt, options = {}) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    // ── Token guard ──────────────────────────────────────────────────────
    if (isExpired) {
      if (onTokensExpired) onTokensExpired();
      return;
    }

    const shouldAddUserMessage = options.addUserMessage !== false;
    const aiId = options.replaceMessageId || `ai-${Date.now() + 1}`;
    const userId = `u-${Date.now()}`;

    if (shouldAddUserMessage) {
      setMessages((prev) => [...prev, { id: userId, sender: 'user', text: cleanPrompt }]);
    }

    if (options.replaceMessageId) {
      setMessages((prev) => prev.map((msg) => (msg.id === options.replaceMessageId ? { ...msg, text: '', loading: true, error: false } : msg)));
    } else {
      setMessages((prev) => [...prev, { id: aiId, sender: 'ai', text: '', loading: true }]);
    }

    if (options.clearInput !== false) {
      setInput('');
    }

    setIsSending(true);
    scrollToEnd();

    try {
      const storedToken = await AsyncStorage.getItem('token');
      // Detect if this is a bible explanation prompt
      const feature = options.feature || (cleanPrompt.toLowerCase().includes('explain this verse') ? 'EXPLAIN_BIBLE' : 'CHAT_AI_PASTOR');

      const res = await fetch(`${API_BASE_URL}/api/gemin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        body: JSON.stringify({ message: cleanPrompt, feature }),
      });
      const data = await res.json();

      // Handle token exhaustion
      if (data.error === 'OUT_OF_TOKENS') {
        setMessages((prev) => prev.filter((msg) => msg.id !== aiId));
        if (onTokensExpired) onTokensExpired();
        return;
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to get response');

      const aiFull = data?.response || 'No response';
      animateAiResponse(aiId, aiFull);
      // Refresh token count after successful AI call
      refreshTokenStatus();
    } catch (err) {
      console.error('Send message error', err);
      const friendlyMsg = getFriendlyError(err);
      setMessages((prev) => prev.map((msg) => (msg.id === aiId ? { ...msg, loading: false, text: friendlyMsg, error: true } : msg)));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadCachedMessages = async () => {
      try {
        const cached = await AsyncStorage.getItem(AI_CHAT_CACHE_KEY);
        if (!mounted) return;

        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.error('AI chat cache load failed', err);
      } finally {
        if (mounted) {
          setHasLoadedCache(true);
          setTimeout(() => scrollToEnd(), 120);
        }
      }
    };

    loadCachedMessages();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedCache) return;

    if (messages.length > 0) {
      persistMessages(messages);
      return;
    }

    persistMessages([]);
  }, [hasLoadedCache, messages]);

  useEffect(() => {
    if (!hasLoadedCache) return;

    if (initialPrompt) {
      const prompt = initialPrompt.trim();
      if (prompt && handledPromptRef.current !== prompt) {
        handledPromptRef.current = prompt;
        sendPrompt(prompt);
        onPromptHandled();
      }
      return;
    }

    if (messages.length === 0) {
      loadWelcomeMessage();
    }
  }, [hasLoadedCache, initialPrompt, messages.length, onPromptHandled]);

  const [isSaving, setIsSaving] = useState(false);

  const sendMessage = async () => {
    sendPrompt(input);
  };

  const saveLastResponse = async () => {
    const latestAi = [...messages].reverse().find((m) => m.sender === 'ai' && !m.loading && !m.error);
    const latestUser = [...messages].reverse().find((m) => m.sender === 'user');
    if (!latestAi || !latestAi.text) {
      Alert.alert('Nothing to save', 'There is no completed AI response yet.');
      return;
    }

    setIsSaving(true);
    try {
      await bibleDB.saveAiResponse(latestUser?.text || 'AI prompt', latestAi.text);
      Alert.alert('Saved ✅', 'The AI response has been saved to your library.');
    } catch (err) {
      console.error('Save AI response error', err);
      Alert.alert('Could not save', 'Something went wrong while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyLastResponse = async () => {
    const latestAi = [...messages].reverse().find((m) => m.sender === 'ai' && !m.loading && !m.error);
    if (!latestAi || !latestAi.text) {
      Alert.alert('Nothing to copy', 'There is no completed AI response yet.');
      return;
    }

    try {
      await Clipboard.setStringAsync(latestAi.text);
      Alert.alert('Copied ✅', 'The AI response has been copied to your clipboard.');
    } catch (err) {
      Alert.alert('Could not copy', 'Something went wrong. Please try again.');
    }
  };

  const retryMessage = async (msg) => {
    if (!msg || msg.sender !== 'ai') return;
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    const prompt = lastUser ? lastUser.text : `Return the welcome message for Pastor ${user?.fullName || 'Pastor'}`;
    await sendPrompt(prompt, { replaceMessageId: msg.id, addUserMessage: false, clearInput: false });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI Pastor</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={copyLastResponse} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={18} color="#6E63E7" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={saveLastResponse} activeOpacity={0.8} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#6E63E7" /> : <Ionicons name="save-outline" size={18} color="#6E63E7" />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.content} onContentSizeChange={scrollToEnd}>
          {messages.map((msg) => (
            <View key={msg.id} style={msg.sender === 'user' ? styles.userBubble : [styles.messageCard, msg.error && styles.messageCardError]}>
              <TouchableOpacity disabled={!msg.error} onPress={() => retryMessage(msg)} activeOpacity={0.8}>
                <Text style={msg.sender === 'user' ? styles.userText : [styles.messageText, msg.error && styles.messageTextError]}>
                  {msg.text}
                </Text>
                {msg.error && (
                  <Text style={styles.retryHint}>Tap to retry ↺</Text>
                )}
                {msg.loading && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#6E63E7' }}>• • •</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBarContainer}>
          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              style={styles.inputField}
              placeholder="Ask your AI pastor..."
              placeholderTextColor="#AEA9C5"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} activeOpacity={0.7} onPress={sendMessage} disabled={isSending}>
              {isSending ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="send-outline" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingBottom: 120,
  },
  messages: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: '#6E63E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B153F',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#44C16C',
    marginRight: 6,
  },
  statusText: {
    color: '#6E63E7',
    fontSize: 12,
    fontWeight: '600',
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
  },
  messageCard: {
    backgroundColor: '#EEF0FF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  messageText: {
    color: '#3F3C60',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    backgroundColor: '#F6F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tagButtonText: {
    color: '#6E63E7',
    fontSize: 12,
    fontWeight: '600',
  },
  userBubble: {
    backgroundColor: '#4C42E2',
    alignSelf: 'flex-start',
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    maxWidth: '100%',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 20,
  },
  answerCard: {
    backgroundColor: '#F1F0FF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  answerText: {
    color: '#3F3C60',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  refRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  refTag: {
    backgroundColor: '#E7F6F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refText: {
    color: '#2C6A59',
    fontSize: 11,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8E7F8',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: '#4F4A78',
    paddingVertical: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#6E63E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  // ── Error bubble styles ──
  messageCardError: {
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#FECDCD',
  },
  messageTextError: {
    color: '#B91C1C',
    marginBottom: 6,
  },
  retryHint: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '700',
    marginTop: 4,
    opacity: 0.8,
  },
});
