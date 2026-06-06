import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTokens } from '../src/contexts/TokenContext';
import Home from './Home';
import Sermon from './Sermon';
import Bible from './Bible';
import AiChat from './AiChat';
import ToolHub from './ToolHub';
import SavedSermonsScreen from './SavedSermonsScreen';
import SavedAiScreen from './SavedAiScreen';
import SavedToolsScreen from './SavedToolsScreen';
import FavoriteVersesScreen from './FavoriteVersesScreen';
import UpgradeScreen from './UpgradeScreen';
import TokenStatus from '../src/components/TokenStatus';

const ScreenPlaceholder = ({ label }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>Hello {label} Screen</Text>
  </View>
);

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeToolPage, setActiveToolPage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingVersePrompt, setPendingVersePrompt] = useState(null);
  // Upgrade screen state: { message, requiresUpgrade }
  const [upgradeParams, setUpgradeParams] = useState(null);
  const { logout, user } = useAuth();
  const { isExpired, refreshTokenStatus } = useTokens();
  const showDrawerMenu = activeTab === 'home' && !upgradeParams;

  const navigateToUpgrade = (message, requiresUpgrade = false) => {
    setUpgradeParams({ message, requiresUpgrade });
  };

  const handleUpgradeBack = () => {
    setUpgradeParams(null);
  };

  useEffect(() => {
    if (!showDrawerMenu) {
      setMenuOpen(false);
    }
  }, [showDrawerMenu]);

  const menuItems = [
    { key: 'favorites', label: 'Favorites' },
    { key: 'savedTools', label: 'Saved tools' },
    { key: 'aiSaved', label: 'AI Saved' },
    { key: 'prayers', label: 'Prayers' },
    { key: 'savedSermons', label: 'Sermons' },
    { key: 'announcement', label: 'Announcement' },
    { key: 'socialWriter', label: 'Social Writer' },
    { key: 'bulletinWriter', label: 'Bulletin Writer' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleExplainVerse = (verse) => {
    const prompt = `Explain this verse in a simple, pastoral way: ${verse.book_name} ${verse.chapter}:${verse.verse} says, "${verse.text}"`;
    setPendingVersePrompt(prompt);
    setActiveTab('aichat');
  };

  const handlePromptHandled = () => {
    setPendingVersePrompt(null);
  };

  const renderScreen = () => {
    // ── Upgrade screen takes over everything ──────────────────────────────
    if (upgradeParams) {
      return (
        <UpgradeScreen
          message={upgradeParams.message}
          requiresUpgrade={upgradeParams.requiresUpgrade}
          onBack={upgradeParams.requiresUpgrade ? undefined : handleUpgradeBack}
        />
      );
    }

    if (activeToolPage) {
      return (
        <ToolHub
          selectedTool={activeToolPage}
          onBack={() => setActiveToolPage(null)}
          onTokensExpired={() =>
            navigateToUpgrade(
              'Your free tokens are finished. Upgrade to Premium to continue using AiPastor.',
              true
            )
          }
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Home
            onOpenTools={(tool) => setActiveToolPage(tool)}
            onUpgradePress={() => navigateToUpgrade('Unlock unlimited access with Premium.')}
          />
        );
      case 'sermon':
        return (
          <Sermon
            onTokensExpired={() =>
              navigateToUpgrade(
                'Your free tokens are finished. Upgrade to Premium to continue using AiPastor.',
                true
              )
            }
          />
        );
      case 'bible':
        return (
          <Bible
            onExplainVerse={handleExplainVerse}
            onTokensExpired={() =>
              navigateToUpgrade(
                'Your free tokens are finished. Upgrade to Premium to continue using AiPastor.',
                true
              )
            }
          />
        );
      case 'aichat':
        return (
          <AiChat
            initialPrompt={pendingVersePrompt}
            onPromptHandled={handlePromptHandled}
            onTokensExpired={() =>
              navigateToUpgrade(
                'Your free tokens are finished. Upgrade to Premium to continue using AiPastor.',
                true
              )
            }
          />
        );
      case 'favorites':
        return <FavoriteVersesScreen onBack={() => setActiveTab('home')} />;
      case 'savedTools':
        return <SavedToolsScreen onBack={() => setActiveTab('home')} />;
      case 'aiSaved':
        return <SavedAiScreen onBack={() => setActiveTab('home')} />;
      case 'prayers':
        return <ScreenPlaceholder label="Prayers" />;
      case 'savedSermons':
        return <SavedSermonsScreen onBack={() => setActiveTab('home')} />;
      case 'announcement':
        return <ScreenPlaceholder label="Announcement" />;
      case 'socialWriter':
        return <ScreenPlaceholder label="Social Writer" />;
      case 'bulletinWriter':
        return <ScreenPlaceholder label="Bulletin Writer" />;
      default:
        return (
          <Home
            onOpenTools={(tool) => setActiveToolPage(tool)}
            onUpgradePress={() => navigateToUpgrade('Unlock unlimited access with Premium.')}
          />
        );
    }
  };

  const TabButton = ({ name, label, icon, onPress, isActive }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={isActive ? '#534AB7' : '#B0B0B0'} 
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === 'home' && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuButton}>
              <Ionicons name="menu-outline" size={24} color="#534AB7" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerSubtitle}>Welcome back</Text>
              <Text style={styles.headerTitle}>{user?.fullName || 'Pastor'}</Text>
            </View>
          </View>

          {/* Token status — sits between name and logout, shrinks gracefully */}
          <View style={styles.headerTokenWrap}>
            <TokenStatus
              onUpgradePress={() => navigateToUpgrade('Unlock unlimited access with Premium.')}
            />
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {showDrawerMenu && menuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuContent}>
            <View style={styles.menuHeaderRow}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity style={styles.menuCloseIcon} onPress={() => setMenuOpen(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="#1B153F" />
              </TouchableOpacity>
            </View>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => {
                  setActiveTab(item.key);
                  setMenuOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!activeToolPage && !upgradeParams && (
        <View style={styles.tabBar}>
        <TabButton 
          name="home"
          label="Home" 
          icon="home-outline" 
          onPress={() => setActiveTab('home')}
          isActive={activeTab === 'home'}
        />
        <TabButton 
          name="sermon"
          label="Sermon" 
          icon="book-outline" 
          onPress={() => setActiveTab('sermon')}
          isActive={activeTab === 'sermon'}
        />
        <TabButton 
          name="bible"
          label="Bible" 
          icon="library-outline" 
          onPress={() => setActiveTab('bible')}
          isActive={activeTab === 'bible'}
        />
        <TabButton 
          name="aichat"
          label="AI Chat" 
          icon="chatbubble-outline" 
          onPress={() => setActiveTab('aichat')}
          isActive={activeTab === 'aichat'}
        />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
    marginRight: 8,
  },
  headerTokenWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7D7A9A',
    marginBottom: 4,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B153F',
    marginLeft: 12,
  },
  logoutButton: {
    padding: 8,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E6F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#F0EBFF',
  },
  tabLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#534AB7',
    fontWeight: '600',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menuContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B153F',
  },
  menuCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0FF',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1B153F',
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6E63E7',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B153F',
    textAlign: 'center',
  },
});
