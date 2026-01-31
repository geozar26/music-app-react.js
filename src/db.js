import Dexie from 'dexie';

export const db = new Dexie('MusicAppDB');
db.version(1).stores({
  favorites: 'id, title, artist, albumArt, preview',
  searches: '++id, query, timestamp'
});