import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import bibleDB from '../services/bibleDB';

export default function BibleReaderScreen() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState(null);
  const [view, setView] = useState('books'); // 'books', 'chapters', 'verses', 'search'

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const booksData = await bibleDB.getBooks();
      setBooks(booksData || []);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBook = async (book) => {
    setSelectedBook(book);
    setIsLoading(true);
    try {
      const chaptersData = await bibleDB.getChapters(book.book_number);
      setChapters(chaptersData || []);
      setView('chapters');
    } catch (error) {
      console.error('Error loading chapters:', error);
      Alert.alert('Error', 'Failed to load chapters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChapter = async (chapter) => {
    setSelectedChapter(chapter);
    setIsLoading(true);
    try {
      const versesData = await bibleDB.getChapter(selectedBook.book_number, chapter);
      setVerses(versesData || []);
      setView('verses');
    } catch (error) {
      console.error('Error loading verses:', error);
      Alert.alert('Error', 'Failed to load verses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await bibleDB.searchVerses(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching verses:', error);
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyVerse = async (verse) => {
    const text = `${verse.book_name} ${verse.chapter}:${verse.verse} - ${verse.text}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Verse copied to clipboard');
  };

  const renderBooksView = () => (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bible Reader</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#6E63E7" />
      ) : (
        <View className="gap-2">
          {books.map((book) => (
            <TouchableOpacity
              key={book.book_number}
              onPress={() => handleSelectBook(book)}
              className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg"
            >
              <Text className="text-gray-900 dark:text-white font-semibold">{book.book_name}</Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">{book.book_short}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderChaptersView = () => (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
      <TouchableOpacity
        onPress={() => {
          setView('books');
          setSelectedBook(null);
        }}
        className="flex-row items-center mb-4"
      >
        <Ionicons name="chevron-back" size={20} color="#6E63E7" />
        <Text className="text-purple-600 dark:text-purple-400 font-semibold">Back to Books</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {selectedBook?.book_name}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6E63E7" />
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {chapters.map((chapter) => (
            <TouchableOpacity
              key={chapter}
              onPress={() => handleSelectChapter(chapter)}
              className="bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded-lg min-w-12 items-center"
            >
              <Text className="text-gray-900 dark:text-white font-semibold">{chapter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderVersesView = () => (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
      <TouchableOpacity
        onPress={() => {
          setView('chapters');
          setSelectedChapter(null);
        }}
        className="flex-row items-center mb-4"
      >
        <Ionicons name="chevron-back" size={20} color="#6E63E7" />
        <Text className="text-purple-600 dark:text-purple-400 font-semibold">Back to Chapters</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {selectedBook?.book_name} {selectedChapter}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6E63E7" />
      ) : (
        <View className="gap-4">
          {verses.map((verse) => (
            <Pressable
              key={`${verse.verse}`}
              onPress={() => setHighlightedVerse(highlightedVerse === verse.verse ? null : verse.verse)}
              className={`p-3 rounded-lg ${
                highlightedVerse === verse.verse
                  ? 'bg-yellow-200 dark:bg-yellow-700'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <View className="flex-row gap-2 items-start">
                <Text className="text-purple-600 dark:text-purple-400 font-bold min-w-8">
                  {verse.verse}
                </Text>
                <Text className="flex-1 text-gray-900 dark:text-white leading-relaxed">
                  {verse.text}
                </Text>
              </View>
              {highlightedVerse === verse.verse && (
                <TouchableOpacity
                  onPress={() => handleCopyVerse(verse)}
                  className="flex-row items-center gap-2 mt-2"
                >
                  <Ionicons name="copy" size={16} color="#6E63E7" />
                  <Text className="text-purple-600 dark:text-purple-400 text-sm">Copy Verse</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderSearchView = () => (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-4">
      <TextInput
        placeholder="Search Bible..."
        value={searchQuery}
        onChangeText={handleSearch}
        className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg mb-4"
        placeholderTextColor="#888"
      />

      {isSearching ? (
        <ActivityIndicator size="large" color="#6E63E7" />
      ) : searchResults.length > 0 ? (
        <View className="gap-4">
          {searchResults.map((result, idx) => (
            <Pressable
              key={idx}
              onPress={() => setHighlightedVerse(`${result.chapter}:${result.verse}`)}
              className={`p-3 rounded-lg ${
                highlightedVerse === `${result.chapter}:${result.verse}`
                  ? 'bg-yellow-200 dark:bg-yellow-700'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                {result.book_name} {result.chapter}:{result.verse}
              </Text>
              <Text className="text-gray-900 dark:text-white mt-2 leading-relaxed">
                {result.text}
              </Text>
              {highlightedVerse === `${result.chapter}:${result.verse}` && (
                <TouchableOpacity
                  onPress={() => handleCopyVerse(result)}
                  className="flex-row items-center gap-2 mt-2"
                >
                  <Ionicons name="copy" size={16} color="#6E63E7" />
                  <Text className="text-purple-600 dark:text-purple-400 text-sm">Copy Verse</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          ))}
        </View>
      ) : searchQuery ? (
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-8">No results found</Text>
      ) : (
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-8">Type to search Bible verses</Text>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row gap-2 p-4 bg-gray-100 dark:bg-gray-800">
        <TouchableOpacity
          onPress={() => setView('books')}
          className={`flex-1 p-2 rounded-lg items-center ${view === 'books' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <Text className={view === 'books' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('search')}
          className={`flex-1 p-2 rounded-lg items-center ${view === 'search' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          <Text className={view === 'search' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'books' && renderBooksView()}
      {view === 'chapters' && renderChaptersView()}
      {view === 'verses' && renderVersesView()}
      {view === 'search' && renderSearchView()}
    </SafeAreaView>
  );
}
