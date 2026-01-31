import React, { useState, useRef } from 'react';
import { Search, Play, Heart, History } from 'lucide-react'; // Προσθήκη History icon
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());

  // Favorites από IndexedDB
  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];

  // Τελευταίες 5 αναζητήσεις για το Sidebar
  const searches = useLiveQuery(() => 
    db.searches.orderBy("id").reverse().limit(5).toArray()
  ) || [];

  const searchTracks = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await db.searches.add({ query: searchQuery.trim() });
      const response = await axios.get(
        "https://deezerdevs-deezer.p.rapidapi.com/search",
        {
          params: { q: searchQuery },
          headers: {
            'x-rapidapi-key': 'ΒΑΛΕ_ΕΔΩ_ΤΟ_ΚΛΕΙΔΙ_ΣΟΥ',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        }
      );
      setTracks(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const playTrack = (track) => {
    if (!track.preview) return;
    if (currentTrack?.id === track.id) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
      return;
    }
    audioRef.current.src = track.preview;
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      await db.favorites.delete(track.id);
    } else {
      await db.favorites.put({
        id: track.id,
        title: track.title,
        artist: track.artist?.name || track.artist,
        albumArt: track.album?.cover_medium || track.albumArt,
        preview: track.preview
      });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">

      {/* SIDEBAR */}
      <div className="w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col p-4 overflow-hidden">
        <h1 className="text-green-500 font-bold mb-8 px-2 tracking-tighter italic text-2xl">
          BEATSTREAM
        </h1>

        {/* ΕΝΟΤΗΤΑ ΑΓΑΠΗΜΕΝΑ */}
        <div className="mb-8">
            <h2 className="text-xs font-bold text-zinc-500 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
            <Heart size={14} /> Αγαπημένα
            </h2>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
            {favorites.length === 0 && <p className="text-xs text-zinc-600 px-2 italic">Κανένα αγαπημένο ακόμα</p>}
            {favorites.map(track => (
                <div
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer group transition"
                >
                <img src={track.albumArt} className="w-10 h-10 rounded shadow-md" alt="" />
                <div className="flex-1 truncate">
                    <div className="text-sm font-medium truncate group-hover:text-green-400 transition">{track.title}</div>
                    <div className="text-xs text-zinc-500 truncate">{track.artist}</div>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* ΕΝΟΤΗΤΑ ΙΣΤΟΡΙΚΟ ΑΝΑΖΗΤΗΣΕΩΝ */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-xs font-bold text-zinc-500 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> Ιστορικό
          </h2>
          <div className="flex-1 overflow-y-auto space-y-1">
            {searches.map(s => (
              <div
                key={s.id}
                onClick={() => {
                  setSearchQuery(s.query);
                  // Προαιρετικά: Αυτόματη αναζήτηση όταν πατάς το ιστορικό
                }}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer transition text-sm"
              >
                <Search size={14} className="opacity-50" />
                <span className="truncate">{s.query}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">

        {/* SEARCH HEADER */}
        <header className="p-6 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800/50 flex justify-center">
          <form
            onSubmit={searchTracks}
            className="w-full max-w-xl relative"
          >
            <Search className="absolute left-4 top-3 text-zinc-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση καλλιτεχνών ή τραγουδιών..."
              className="w-full bg-zinc-800/50 hover:bg-zinc-800 focus:bg-zinc-800 transition-colors rounded-full py-3 px-12 border-none ring-1 ring-zinc-700 focus:ring-green-500 outline-none"
            />
          </form>
        </header>

        {/* RESULTS GRID */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-900 to-black">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map(track => (
              <div
                key={track.id}
                className="bg-zinc-800/30 p-4 rounded-2xl hover:bg-zinc-800/60 transition-all duration-300 group shadow-lg"
              >
                <div className="relative mb-4 overflow-hidden rounded-xl shadow-xl">
                  <img
                    src={track.album.cover_medium}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={track.title}
                  />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute bottom-3 right-3 bg-green-500 text-black p-3 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                  >
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
                
                <div className="flex justify-between items-start gap-2">
                  <div className="truncate flex-1">
                    <h3 className="font-bold text-sm truncate mb-1">{track.title}</h3>
                    <p className="text-xs text-zinc-400 truncate">{track.artist.name}</p>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(track)}
                    className="mt-1 transition-transform active:scale-125"
                  >
                    <Heart
                      size={20}
                      className={
                        favorites.some(f => f.id === track.id)
                          ? "fill-green-500 text-green-500"
                          : "text-zinc-600 hover:text-zinc-400"
                      }
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {tracks.length === 0 && !searchQuery && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic">
               <Search size={48} className="mb-4 opacity-20" />
               <p>Ξεκινήστε την αναζήτηση για να βρείτε μουσική</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default MusicApp;
