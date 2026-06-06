import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import bibleDB from '../src/services/bibleDB';

const BIBLE_HIGHLIGHTS_KEY = 'bible_highlights_v1';
const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#FFF59D' },
  { label: 'Green', value: '#C8F7D6' },
  { label: 'Blue', value: '#CFE8FF' },
  { label: 'Pink', value: '#F7D5F4' },
  { label: 'Orange', value: '#FFE0C2' },
];

// ─── Verse Picker Modal ───────────────────────────────────────────────────────
function VersePicker({ visible, onClose, onConfirm, books }) {
  const [tab, setTab] = useState('book');
  const [selBook, setSelBook] = useState(null);
  const [selChapter, setSelChapter] = useState(null);
  const [selVerse, setSelVerse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [verseCount] = useState(Array.from({ length: 40 }, (_, i) => i + 1));

  const reset = () => {
    setTab('book');
    setSelBook(null);
    setSelChapter(null);
    setSelVerse(null);
    setChapters([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const pickBook = async (book) => {
    setSelBook(book);
    setSelChapter(null);
    setSelVerse(null);
    try {
      const chs = await bibleDB.getChapters(book.book_id);
      setChapters(chs);
    } catch {
      setChapters([]);
    }
    setTab('chapter');
  };

  const pickChapter = (ch) => {
    setSelChapter(ch);
    setSelVerse(null);
    setTab('verse');
  };

  const pickVerse = (v) => setSelVerse(v);

  const handleConfirm = () => {
    if (!selBook) return;
    onConfirm({ book: selBook, chapter: selChapter, verse: selVerse });
    reset();
  };

  const TABS = ['book', 'chapter', 'verse'];

  const renderList = () => {
    if (tab === 'book') {
      return (
        <FlatList
          data={books}
          keyExtractor={(b) => String(b.book_id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pickerRow, selBook?.book_id === item.book_id && styles.pickerRowSel]}
              onPress={() => pickBook(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerRowText, selBook?.book_id === item.book_id && styles.pickerRowTextSel]}>
                {item.book_name}
              </Text>
              {selBook?.book_id === item.book_id && (
                <Ionicons name="checkmark" size={15} color="#534AB7" />
              )}
            </TouchableOpacity>
          )}
        />
      );
    }
    if (tab === 'chapter') {
      if (!selBook) return <Text style={styles.pickerHint}>Select a book first</Text>;
      return (
        <FlatList
          data={chapters}
          keyExtractor={(c) => String(c)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pickerRow, selChapter === item && styles.pickerRowSel]}
              onPress={() => pickChapter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerRowText, selChapter === item && styles.pickerRowTextSel]}>
                Chapter {item}
              </Text>
              {selChapter === item && <Ionicons name="checkmark" size={15} color="#534AB7" />}
            </TouchableOpacity>
          )}
        />
      );
    }
    // verse tab
    if (!selChapter) return <Text style={styles.pickerHint}>Select a chapter first</Text>;
    return (
      <FlatList
        data={verseCount}
        keyExtractor={(v) => String(v)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pickerRow, selVerse === item && styles.pickerRowSel]}
            onPress={() => pickVerse(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerRowText, selVerse === item && styles.pickerRowTextSel]}>
              Verse {item}
            </Text>
            {selVerse === item && <Ionicons name="checkmark" size={15} color="#534AB7" />}
          </TouchableOpacity>
        )}
      />
    );
  };

  const label = [
    selBook?.book_name,
    selChapter != null ? `${selChapter}` : null,
    selVerse != null ? `:${selVerse}` : null,
  ].filter(Boolean).join(' ');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.pickerSheet}>
        {/* handle */}
        <View style={styles.sheetHandle} />

        {/* selected label */}
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerHeaderLabel} numberOfLines={1}>
            {label || 'Choose a verse'}
          </Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#8F8DA8" />
          </TouchableOpacity>
        </View>

        {/* tabs */}
        <View style={styles.pickerTabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.pickerTab, tab === t && styles.pickerTabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerTabText, tab === t && styles.pickerTabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* list */}
        <View style={{ flex: 1 }}>{renderList()}</View>

        {/* confirm */}
        <View style={styles.pickerFooter}>
          <TouchableOpacity
            style={[styles.confirmBtn, !selBook && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!selBook}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Go to verse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Friendly error classifier ────────────────────────────────────────────────
function getFriendlyBibleError(err) {
  const msg = (err?.message || String(err || '')).toLowerCase();
  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused')
  ) {
    return "No internet connection. Please check your Wi-Fi or mobile data and try again.";
  }
  return "We could not load this right now. Please go back and try again.";
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Bible({ onExplainVerse }) {
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [verseActionVisible, setVerseActionVisible] = useState(false);
  const [selectedVerseAction, setSelectedVerseAction] = useState(null);
  const [highlightMap, setHighlightMap] = useState({});
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [verseActionMessage, setVerseActionMessage] = useState('');
  const [testament, setTestament] = useState('OT');

  const toggleTestament = () => {
    setTestament(testament === 'OT' ? 'NT' : 'OT');
  };

  const getFilteredBooks = () => {
    if (testament === 'OT') {
      return books.filter((b) => b.book_id >= 1 && b.book_id <= 39);
    } else {
      return books.filter((b) => b.book_id >= 40 && b.book_id <= 66);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await bibleDB.openBibleDB();
        setBooks(await bibleDB.getBooks());
        const savedIds = await bibleDB.getFavoriteVerseIds();
        setFavoriteVerseIds(savedIds);

        const storedHighlights = await AsyncStorage.getItem(BIBLE_HIGHLIGHTS_KEY);
        if (storedHighlights) {
          const parsedHighlights = JSON.parse(storedHighlights);
          if (parsedHighlights && typeof parsedHighlights === 'object') {
            setHighlightMap(parsedHighlights);
          }
        }
      } catch (err) {
        console.error('Bible highlight restore error', err);
        setError(getFriendlyBibleError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(BIBLE_HIGHLIGHTS_KEY, JSON.stringify(highlightMap)).catch((err) => {
      console.error('Bible highlight save error', err);
    });
  }, [highlightMap]);

  const handlePickerConfirm = async ({ book, chapter, verse }) => {
    setPickerVisible(false);
    await handleSelectBook(book);
    if (chapter) await handleSelectChapter(chapter, book);
    // verse highlighting could be done here if needed
  };

  const handleSelectBook = async (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setVerses([]);
    setHighlightedId(null);
    setLoading(true);
    try {
      const chs = await bibleDB.getChapters(book.book_id);
      setChapters(chs);
    } catch (err) {
      setError(getFriendlyBibleError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = async (chapter, bookOverride) => {
    const book = bookOverride || selectedBook;
    setSelectedChapter(chapter);
    setHighlightedId(null);
    setLoading(true);
    try {
      const v = await bibleDB.getChapter(book.book_id, chapter);
      setVerses(v);
    } catch (err) {
      setError(getFriendlyBibleError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVerse = async (verse) => {
    const text = `${verse.book_name} ${verse.chapter}:${verse.verse} — ${verse.text}`;
    await Clipboard.setStringAsync(text);
  };

  const handleToggleFavorite = async (verse) => {
    const verseId = verse.id;
    const currentlyFavored = favoriteVerseIds.includes(verseId);

    try {
      if (currentlyFavored) {
        await bibleDB.removeFavoriteBibleVerse(verseId);
        setFavoriteVerseIds((prev) => prev.filter((id) => id !== verseId));
        setVerseActionMessage('Removed from favorites.');
      } else {
        await bibleDB.addFavoriteBibleVerse(verse);
        setFavoriteVerseIds((prev) => [...prev, verseId]);
        setVerseActionMessage('Added to favorites.');
      }
    } catch (err) {
      console.error('Favorite toggle error', err);
      setVerseActionMessage('Unable to update favorites.');
    }
  };

  const handleExplainWithAI = (verse) => {
    if (typeof onExplainVerse === 'function') {
      onExplainVerse(verse);
    }
    setVerseActionVisible(false);
    setSelectedVerseAction(null);
  };

  const handleVerseLongPress = (verse) => {
    setSelectedVerseAction(verse);
    setShowHighlightPicker(false);
    setVerseActionMessage('');
    setVerseActionVisible(true);
  };

  const closeVerseActionSheet = () => {
    setVerseActionVisible(false);
    setSelectedVerseAction(null);
    setShowHighlightPicker(false);
    setVerseActionMessage('');
  };

  const handleVerseActionCopy = async () => {
    if (!selectedVerseAction) return;
    await handleCopyVerse(selectedVerseAction);
    setVerseActionMessage('Verse copied to clipboard.');
  };

  const handleVerseActionFavorite = async () => {
    if (!selectedVerseAction) return;
    await handleToggleFavorite(selectedVerseAction);
  };

  const handleVerseActionExplain = () => {
    if (!selectedVerseAction) return;
    handleExplainWithAI(selectedVerseAction);
  };

  const handleVerseActionHighlight = () => {
    if (!selectedVerseAction) return;
    setShowHighlightPicker(true);
  };

  const handleSelectHighlightColor = async (color) => {
    if (!selectedVerseAction) return;

    setHighlightMap((prev) => ({
      ...prev,
      [selectedVerseAction.id]: {
        id: selectedVerseAction.id,
        book_id: selectedVerseAction.book_id,
        book_name: selectedVerseAction.book_name,
        chapter: selectedVerseAction.chapter,
        verse: selectedVerseAction.verse,
        text: selectedVerseAction.text,
        color,
      },
    }));

    setShowHighlightPicker(false);
    setVerseActionVisible(false);
    setSelectedVerseAction(null);
    setVerseActionMessage('Verse highlighted.');
  };

  const handleRemoveHighlight = async () => {
    if (!selectedVerseAction) return;

    setHighlightMap((prev) => {
      const next = { ...prev };
      delete next[selectedVerseAction.id];
      return next;
    });

    setShowHighlightPicker(false);
    setVerseActionVisible(false);
    setSelectedVerseAction(null);
    setVerseActionMessage('Highlight removed.');
  };

  const goBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
      setVerses([]);
      setHighlightedId(null);
    } else if (selectedBook) {
      setSelectedBook(null);
      setChapters([]);
      setHighlightedId(null);
    }
  };

  const view = selectedChapter ? 'verses' : selectedBook ? 'chapters' : 'books';

  // ── Breadcrumb ──
  const Breadcrumb = () => (
    <View style={styles.breadcrumb}>
      <TouchableOpacity onPress={() => { setSelectedBook(null); setSelectedChapter(null); setChapters([]); setVerses([]); setHighlightedId(null); }}>
        <Text style={[styles.breadcrumbPart, !selectedBook && styles.breadcrumbActive]}>Books</Text>
      </TouchableOpacity>
      {selectedBook && (
        <>
          <Ionicons name="chevron-forward" size={11} color="#BBBAC9" />
          <TouchableOpacity onPress={() => { setSelectedChapter(null); setVerses([]); setHighlightedId(null); }}>
            <Text style={[styles.breadcrumbPart, selectedBook && !selectedChapter && styles.breadcrumbActive]}>
              {selectedBook?.book_name}
            </Text>
          </TouchableOpacity>
        </>
      )}
      {selectedChapter && (
        <>
          <Ionicons name="chevron-forward" size={11} color="#BBBAC9" />
          <Text style={[styles.breadcrumbPart, styles.breadcrumbActive]}>Chapter {selectedChapter}</Text>
        </>
      )}
    </View>
  );

  // ── Content ──
  const renderContent = () => {
    if (loading) return <ActivityIndicator size="small" color="#534AB7" style={{ marginTop: 32 }} />;
    if (error) return <Text style={styles.emptyText}>{error}</Text>;

    if (view === 'books') {
      if (!books.length) return <Text style={styles.emptyText}>No books found.</Text>;
      const filteredBooks = getFilteredBooks();
      if (!filteredBooks.length) return <Text style={styles.emptyText}>No books in this testament.</Text>;
      return (
        <FlatList
          data={filteredBooks}
          keyExtractor={(b) => String(b.book_id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleSelectBook(item)} activeOpacity={0.7}>
              <Text style={styles.rowText}>{item.book_name}</Text>
              <Ionicons name="chevron-forward" size={13} color="#BBBAC9" />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      );
    }

    if (view === 'chapters') {
      if (!chapters.length) return <Text style={styles.emptyText}>No chapters available.</Text>;
      return (
        <FlatList
          key={view}
          data={chapters}
          keyExtractor={(c) => String(c)}
          numColumns={5}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chapterCell} onPress={() => handleSelectChapter(item)} activeOpacity={0.7}>
              <Text style={styles.chapterNum}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    if (view === 'verses') {
      if (!verses.length) return <Text style={styles.emptyText}>No verses found.</Text>;
      return (
        <FlatList
          data={verses}
          keyExtractor={(v) => String(v.id)}
          renderItem={({ item }) => {
            const active = highlightedId === item.id;
            const highlight = highlightMap[item.id];
            return (
              <TouchableOpacity
                style={[
                  styles.verseRow,
                  active && styles.verseRowActive,
                  highlight ? { backgroundColor: highlight.color } : null,
                ]}
                onPress={() => setHighlightedId(active ? null : item.id)}
                onLongPress={() => handleVerseLongPress(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.verseNum, active && styles.verseNumActive]}>{item.verse}</Text>
                <Text style={styles.verseText}>{item.text}</Text>
                {active && (
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyVerse(item)} activeOpacity={0.7}>
                    <Ionicons name="copy-outline" size={14} color="#534AB7" />
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.heading}>BSB Bible</Text>
        {!selectedBook && (
          <TouchableOpacity 
            style={styles.swapButton} 
            onPress={toggleTestament} 
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#534AB7" />
            <Text style={styles.swapButtonText}>{testament}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Verse picker trigger ── */}
      <TouchableOpacity style={styles.gotoBar} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
        <Ionicons name="search-outline" size={15} color="#8F8DA8" />
        <Text style={styles.gotoText}>Go to a verse…</Text>
        <Ionicons name="chevron-down" size={14} color="#BBBAC9" />
      </TouchableOpacity>

      {/* ── Breadcrumb ── */}
      <Breadcrumb />

      {/* ── Main content ── */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* ── Back bar ── */}
      {view !== 'books' && (
        <TouchableOpacity style={styles.backBar} onPress={goBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={16} color="#534AB7" />
          <Text style={styles.backBarText}>{selectedChapter ? (selectedBook?.book_name || 'Chapters') : 'All Books'}</Text>
        </TouchableOpacity>
      )}

      {/* ── Verse action sheet ── */}
      <Modal visible={verseActionVisible} transparent animationType="slide" onRequestClose={closeVerseActionSheet}>
        <TouchableOpacity style={styles.actionSheetOverlay} activeOpacity={1} onPress={closeVerseActionSheet}>
          <View style={styles.actionSheetBackdrop} />
        </TouchableOpacity>
        <View style={styles.actionSheetContainer}>
          <View style={styles.actionSheetHandle} />
          <View style={styles.actionSheetHeader}>
            <View style={styles.actionSheetTitleRow}>
              <View style={styles.actionSheetIconWrap}>
                <Ionicons name="book-outline" size={18} color="#534AB7" />
              </View>
              <View>
                <Text style={styles.actionSheetTitle}>Verse options</Text>
                <Text style={styles.actionSheetSubtitle}>
                  {selectedVerseAction ? `${selectedVerseAction.book_name} ${selectedVerseAction.chapter}:${selectedVerseAction.verse}` : 'Select a verse'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeVerseActionSheet} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close" size={18} color="#8F8DA8" />
            </TouchableOpacity>
          </View>

          {selectedVerseAction && (
            <View style={styles.actionSheetVerseCard}>
              <Text style={styles.actionSheetVerseRef}>
                {selectedVerseAction.book_name} {selectedVerseAction.chapter}:{selectedVerseAction.verse}
              </Text>
              <Text style={styles.actionSheetVerseText}>{selectedVerseAction.text}</Text>
            </View>
          )}

          {verseActionMessage ? <Text style={styles.actionSheetStatus}>{verseActionMessage}</Text> : null}

          <View style={styles.actionSheetButtonList}>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={handleVerseActionFavorite}
              activeOpacity={0.85}
            >
              <View style={styles.actionSheetButtonIconWrap}>
                <Ionicons
                  name={favoriteVerseIds.includes(selectedVerseAction?.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={favoriteVerseIds.includes(selectedVerseAction?.id) ? '#FF6B6B' : '#534AB7'}
                />
              </View>
              <Text style={styles.actionSheetButtonText}>
                {favoriteVerseIds.includes(selectedVerseAction?.id) ? 'Remove from favorites' : 'Add to favorites'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={handleVerseActionHighlight}
              activeOpacity={0.85}
            >
              <View style={styles.actionSheetButtonIconWrap}>
                <Ionicons name="color-palette-outline" size={18} color="#534AB7" />
              </View>
              <Text style={styles.actionSheetButtonText}>
                {highlightMap[selectedVerseAction?.id] ? 'Change highlight' : 'Highlight'}
              </Text>
            </TouchableOpacity>

            {showHighlightPicker && selectedVerseAction && (
              <View style={styles.highlightPickerWrap}>
                <Text style={styles.highlightPickerLabel}>Choose a colour</Text>
                <View style={styles.highlightColorRow}>
                  {HIGHLIGHT_COLORS.map((colorOption) => (
                    <TouchableOpacity
                      key={colorOption.value}
                      style={[styles.colorChip, { backgroundColor: colorOption.value }]}
                      onPress={() => handleSelectHighlightColor(colorOption.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.colorChipLabel}>{colorOption.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {highlightMap[selectedVerseAction.id] && (
                  <TouchableOpacity style={styles.removeHighlightBtn} onPress={handleRemoveHighlight} activeOpacity={0.85}>
                    <Text style={styles.removeHighlightBtnText}>Remove highlight</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={handleVerseActionCopy}
              activeOpacity={0.85}
            >
              <View style={styles.actionSheetButtonIconWrap}>
                <Ionicons name="copy-outline" size={18} color="#534AB7" />
              </View>
              <Text style={styles.actionSheetButtonText}>Copy verse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetButtonPrimary]}
              onPress={handleVerseActionExplain}
              activeOpacity={0.9}
            >
              <View style={styles.actionSheetButtonIconWrap}>
                <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionSheetButtonText, styles.actionSheetButtonPrimaryText]}>Explain with AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Picker modal ── */}
      <VersePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handlePickerConfirm}
        books={books}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B153F',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0EBFF',
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#534AB7',
  },

  // Go to bar
  gotoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
  },
  gotoText: {
    flex: 1,
    fontSize: 13,
    color: '#A7A3C2',
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
  },
  breadcrumbPart: {
    fontSize: 11,
    color: '#A7A3C2',
  },
  breadcrumbActive: {
    color: '#1B153F',
    fontWeight: '500',
  },

  // Separator
  sep: {
    height: 0.5,
    backgroundColor: '#E4E3EF',
  },

  // Book row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowText: {
    fontSize: 13,
    color: '#1B153F',
  },

  // Chapter grid
  chapterCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#E4E3EF',
  },
  chapterNum: {
    fontSize: 13,
    color: '#1B153F',
  },

  // Verse
  verseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  verseRowActive: {
    backgroundColor: '#F5F4FF',
  },
  verseNum: {
    width: 28,
    fontSize: 11,
    fontWeight: '600',
    color: '#BBBAC9',
    paddingTop: 2,
  },
  verseNumActive: {
    color: '#534AB7',
  },
  verseText: {
    flex: 1,
    fontSize: 13,
    color: '#2F2D44',
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginLeft: 28,
  },
  copyBtnText: {
    fontSize: 12,
    color: '#534AB7',
    fontWeight: '600',
  },

  // Back bar
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E3EF',
  },
  backBarText: {
    fontSize: 13,
    color: '#534AB7',
    fontWeight: '600',
  },

  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 13,
    color: '#A7A3C2',
  },

  // ── Verse action sheet ──
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31, 23, 62, 0.35)',
  },
  actionSheetBackdrop: {
    flex: 1,
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E3EF',
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D9D8E8',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionSheetIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B153F',
  },
  actionSheetSubtitle: {
    fontSize: 11,
    color: '#8F8DA8',
    marginTop: 2,
  },
  actionSheetVerseCard: {
    backgroundColor: '#FCFBFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    padding: 12,
    marginBottom: 10,
  },
  actionSheetVerseRef: {
    fontSize: 12,
    fontWeight: '700',
    color: '#534AB7',
    marginBottom: 6,
  },
  actionSheetVerseText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#2F2D44',
  },
  actionSheetStatus: {
    fontSize: 12,
    color: '#4B456E',
    marginBottom: 10,
  },
  actionSheetButtonList: {
    gap: 10,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionSheetButtonPrimary: {
    backgroundColor: '#534AB7',
    borderColor: '#534AB7',
  },
  actionSheetButtonIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F2FF',
  },
  actionSheetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B153F',
    flex: 1,
  },
  actionSheetButtonPrimaryText: {
    color: '#FFFFFF',
  },
  highlightPickerWrap: {
    marginTop: 4,
    marginBottom: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    backgroundColor: '#FAF9FF',
  },
  highlightPickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#534AB7',
    marginBottom: 8,
  },
  highlightColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: '#E4E3EF',
    minWidth: 88,
    alignItems: 'center',
  },
  colorChipLabel: {
    fontSize: 11,
    color: '#1B153F',
    fontWeight: '600',
  },
  removeHighlightBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FFF1F3',
  },
  removeHighlightBtnText: {
    fontSize: 12,
    color: '#C34A6F',
    fontWeight: '700',
  },

  // ── Picker Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E3EF',
    height: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D9D8E8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
  },
  pickerHeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B153F',
    flex: 1,
    marginRight: 8,
  },
  pickerTabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
  },
  pickerTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  pickerTabActive: {
    borderBottomColor: '#534AB7',
  },
  pickerTabText: {
    fontSize: 12,
    color: '#A7A3C2',
  },
  pickerTabTextActive: {
    color: '#534AB7',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E3EF',
  },
  pickerRowSel: {
    backgroundColor: '#F5F4FF',
  },
  pickerRowText: {
    fontSize: 13,
    color: '#1B153F',
  },
  pickerRowTextSel: {
    color: '#534AB7',
    fontWeight: '600',
  },
  pickerHint: {
    padding: 24,
    textAlign: 'center',
    fontSize: 13,
    color: '#A7A3C2',
  },
  pickerFooter: {
    padding: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E3EF',
  },
  confirmBtn: {
    backgroundColor: '#534AB7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#C5C2E8',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});