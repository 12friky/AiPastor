import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'bsb.db';
const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite`;
const DATABASE_FILE_URI = `${SQLITE_DIR}/${DATABASE_NAME}`;

let db = null;

async function copyDatabaseIfNeeded() {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DATABASE_FILE_URI);
    if (fileInfo.exists) {
      // already copied
      return;
    }

    // ensure SQLite dir exists
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });

    // Load bundled asset and copy to device storage
    // Use Asset to ensure the file is available locally
    const assetModule = require('../../assets/BSB.db');
    const [asset] = await Asset.loadAsync(assetModule);
    // download asset if necessary
    if (!asset.localUri) {
      await asset.downloadAsync?.();
    }
    const sourceUri = asset.localUri || asset.uri;
    if (!sourceUri) {
      throw new Error('Bible asset URI is unavailable');
    }

    await FileSystem.copyAsync({ from: sourceUri, to: DATABASE_FILE_URI });
    console.log('[BibleDB] Copied bsb.db to device storage');
  } catch (error) {
    console.error('[BibleDB] copyDatabaseIfNeeded error:', error);
    throw error;
  }
}

function openSQLiteDatabase() {
  if (db) return db;

  // Use the new synchronous open API that expects a database name
  // The underlying implementation will open the file from the app's SQLite directory
  db = SQLite.openDatabaseSync(DATABASE_NAME);
  return db;
}

async function ensureDatabase() {
  // idempotent initialization: copy if needed then open db
  await copyDatabaseIfNeeded();
  openSQLiteDatabase();
  createSaveTables();
  return db;
}

function selectAllSync(sql, params = []) {
  const database = db || openSQLiteDatabase();
  try {
    // getAllSync should return an array of rows
    const rows = database.getAllSync(sql, params);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error('[BibleDB] selectAllSync error', err, sql, params);
    return [];
  }
}

function runSync(sql, params = []) {
  const database = db || openSQLiteDatabase();
  try {
    // runSync for non-select statements
    return database.runSync(sql, params);
  } catch (err) {
    console.error('[BibleDB] runSync error', err, sql, params);
    throw err;
  }
}

function createSaveTables() {
  try {
    runSync(`
      CREATE TABLE IF NOT EXISTS saved_tool_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        title TEXT,
        prompt TEXT,
        result TEXT,
        created_at TEXT
      )
    `);

    runSync(`
      CREATE TABLE IF NOT EXISTS saved_sermons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT,
        sections_json TEXT,
        created_at TEXT
      )
    `);

    runSync(`
      CREATE TABLE IF NOT EXISTS saved_ai_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT,
        response TEXT,
        created_at TEXT
      )
    `);

    runSync(`
      CREATE TABLE IF NOT EXISTS favorite_bible_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bible_verse_id INTEGER UNIQUE,
        book_id INTEGER,
        book_name TEXT,
        chapter INTEGER,
        verse INTEGER,
        text TEXT,
        created_at TEXT
      )
    `);
  } catch (err) {
    console.error('[BibleDB] createSaveTables error', err);
    throw err;
  }
}

async function logSchema() {
  try {
    openSQLiteDatabase();
    const master = selectAllSync('SELECT name, type, sql FROM sqlite_master WHERE type IN ("table","view") ORDER BY name');
    console.log('[BibleDB] sqlite_master:');
    for (const row of master) {
      console.log(`  ${row.type}: ${row.name}`);
      console.log(`    sql: ${row.sql}`);
    }

    const tables = selectAllSync('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name');
    for (const t of tables) {
      const tableName = t.name;
      const info = selectAllSync(`PRAGMA table_info("${tableName}")`);
      console.log(`[BibleDB] columns for ${tableName}:`);
      for (const col of info) {
        console.log(`    - ${col.name} (${col.type})`);
      }
    }
  } catch (error) {
    console.error('[BibleDB] logSchema error:', error);
  }
}

const bibleDB = {
  openBibleDB: async () => {
    await ensureDatabase();
    return db || openSQLiteDatabase();
  },

  getBooks: async () => {
    await ensureDatabase();
    const rows = selectAllSync('SELECT id AS book_id, name AS book_name FROM BSB_books ORDER BY id');
    return rows.map((r) => ({ book_id: r.book_id, book_name: r.book_name }));
  },

  getChapters: async (bookId) => {
    await ensureDatabase();
    const rows = selectAllSync('SELECT DISTINCT chapter FROM BSB_verses WHERE book_id = ? ORDER BY chapter', [bookId]);
    return rows.map((r) => r.chapter);
  },

  getChapter: async (bookId, chapter) => {
    await ensureDatabase();
    const rows = selectAllSync(
      'SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name AS book_name FROM BSB_verses v JOIN BSB_books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter = ? ORDER BY v.verse',
      [bookId, chapter]
    );
    return rows;
  },

  getVerse: async (bookId, chapter, verse) => {
    await ensureDatabase();
    const rows = selectAllSync(
      'SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name AS book_name FROM BSB_verses v JOIN BSB_books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ? LIMIT 1',
      [bookId, chapter, verse]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  getVerseOfTheDay: async () => {
    await ensureDatabase();

    const countResult = selectAllSync('SELECT COUNT(*) AS total FROM BSB_verses');
    const totalVerses = Number(countResult?.[0]?.total || 0);

    if (!totalVerses) {
      return null;
    }

    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const offset = dayIndex % totalVerses;

    const rows = selectAllSync(
      'SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name AS book_name FROM BSB_verses v JOIN BSB_books b ON v.book_id = b.id ORDER BY v.id LIMIT 1 OFFSET ?',
      [offset]
    );

    return rows.length > 0 ? rows[0] : null;
  },

  searchVerses: async (query) => {
    await ensureDatabase();
    const normalized = `%${query.replace(/%/g, '\%')}%`;
    const rows = selectAllSync(
      'SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name AS book_name FROM BSB_verses v JOIN BSB_books b ON v.book_id = b.id WHERE v.text LIKE ? ESCAPE \'\\\' ORDER BY v.book_id, v.chapter, v.verse LIMIT 200',
      [normalized]
    );
    return rows;
  },

  saveToolItem: async ({ type, title, prompt, result }) => {
    await ensureDatabase();
    return runSync(
      'INSERT INTO saved_tool_items (type, title, prompt, result, created_at) VALUES (?, ?, ?, ?, ?)',
      [type, title, prompt, result, new Date().toISOString()]
    );
  },

  getSavedToolItems: async (type) => {
    await ensureDatabase();
    if (type) {
      return selectAllSync('SELECT * FROM saved_tool_items WHERE type = ? ORDER BY id DESC', [type]);
    }
    return selectAllSync('SELECT * FROM saved_tool_items ORDER BY id DESC');
  },

  saveSermon: async (topic, sections) => {
    await ensureDatabase();
    return runSync(
      'INSERT INTO saved_sermons (topic, sections_json, created_at) VALUES (?, ?, ?)',
      [topic, JSON.stringify(sections), new Date().toISOString()]
    );
  },

  getSavedSermons: async () => {
    await ensureDatabase();
    return selectAllSync('SELECT * FROM saved_sermons ORDER BY id DESC');
  },

  saveAiResponse: async (prompt, response) => {
    await ensureDatabase();
    return runSync(
      'INSERT INTO saved_ai_responses (prompt, response, created_at) VALUES (?, ?, ?)',
      [prompt, response, new Date().toISOString()]
    );
  },

  getSavedAiResponses: async () => {
    await ensureDatabase();
    return selectAllSync('SELECT * FROM saved_ai_responses ORDER BY id DESC');
  },

  getFavoriteVerseIds: async () => {
    await ensureDatabase();
    const rows = selectAllSync('SELECT bible_verse_id FROM favorite_bible_verses');
    return rows.map((row) => row.bible_verse_id);
  },

  getSavedBibleVerses: async () => {
    await ensureDatabase();
    return selectAllSync('SELECT * FROM favorite_bible_verses ORDER BY id DESC');
  },

  addFavoriteBibleVerse: async (verse) => {
    await ensureDatabase();
    return runSync(
      'INSERT OR IGNORE INTO favorite_bible_verses (bible_verse_id, book_id, book_name, chapter, verse, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [verse.id, verse.book_id, verse.book_name, verse.chapter, verse.verse, verse.text, new Date().toISOString()]
    );
  },

  removeFavoriteBibleVerse: async (verseId) => {
    await ensureDatabase();
    return runSync('DELETE FROM favorite_bible_verses WHERE bible_verse_id = ?', [verseId]);
  },
};

// Optionally log schema at startup for debugging (comment out in production)
(async () => {
  try {
    await ensureDatabase();
    await logSchema();
  } catch (e) {
    // silence startup schema errors
  }
})();

export default bibleDB;
