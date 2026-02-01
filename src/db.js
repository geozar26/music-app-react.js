// db.js
import Dexie from 'dexie';

export const db = new Dexie('MusicAppDB');
db.version(1).stores({
  favorites: 'id, title',
  searches: '++id, query, timestamp' // To query πρέπει να είναι indexed για να δουλέψει το .where()
});