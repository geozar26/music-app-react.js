import React, { useState, useEffect } from 'react';
import { Search, Play, Heart, Music, Library as LibraryIcon, X } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [showHistory, setShowHistory] = useState(false);

  // Queries από τη βάση με safety checks (|| [])
  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.searches?.orderBy('timestamp').reverse().toArray()) || [];

  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const res = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
          params: { q: 'Top Hits' },
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        });
        setTracks(res.data.data || []);
      } catch (e) { console.error(e); }
    };
    fetchDefault();
  }, []);

  const toggleFavorite = async (track) => {
    if (!db.favorites) return; // Safety check
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      await db.favorites.delete(track.id);
    } else {
      await db.favorites.add({
        id: track.id,
        title: track.title,
        artist: track.artist.name || track.artist,
        albumArt: track.album?.cover_medium || track.albumArt,
        preview: track.preview
      });
    }
  };

  const searchTracks = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
    if (!q.trim()) return;

    setView('discover');
    setShowHistory(false);

    try {
      // Διόρθωση: Έλεγχος αν το db.searches είναι undefined πριν το query
      if (db.searches) {
        const exists = await db.searches.where('query').equals(q.toLowerCase()).count();
        if (!exists) {
          await db.searches.add({ query: q.toLowerCase(), timestamp: Date.now() });
        }
      }

      const response = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
        params: { q },
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(response.data.data || []);
    } catch (error) { console.error(error); }
  };

  // Βελτιωμένο φιλτράρισμα: Αν η μπάρα είναι άδεια, δείχνει όλο το ιστορικό. 
  // Αν γράφεις, δείχνει όσα ξεκινούν με αυτούς τους χαρακτήρες.
  const filteredHistory = (searchHistory || []).filter(h => {
    if (!searchQuery) return true;
    return h.query.toLowerCase().startsWith(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans text-sm">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black border-r border-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setView('discover')}>
            <Music className="text-green-500" size={24} />
            <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
          </div>

          <button 
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-4 ${
              view === 'library' ? 'bg-green-500/20 text-green-500' : 'text-zinc-400 hover:bg-white/5'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="font-black uppercase tracking-widest">Library</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#0a0a0a]">
        <header className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/5 z-50">
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text"
                className="w-full bg-zinc-900/60 rounded-full py-2 px-10 border border-zinc-800 focus:border-green-500 outline-none transition"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setShowHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* DROPDOWN ΙΣΤΟΡΙΚΟΥ */}
            {showHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2">
                  {filteredHistory.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800 rounded-xl cursor-pointer group"
                      onClick={() => {
                        setSearchQuery(item.query);
                        searchTracks(null, item.query);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Search size={14} className="text-zinc-500" />
                        <span className="text-zinc-300 font-medium">{item.query}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          db.searches.delete(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 ml-6 shrink-0">
            <button className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full border border-green-500/20 font-bold uppercase text-[11px]">Install</button>
            <button className="text-zinc-400 font-bold uppercase text-[11px]">Log In</button>
            <button className="bg-white text-black px-5 py-1.5 rounded-full font-bold uppercase text-[11px] shadow-lg">Sign Up</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowHistory(false)}>
          <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase italic">
            {view === 'discover' ? 'Discover' : 'Your Library'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="bg-zinc-900/30 p-4 rounded-2xl hover:bg-zinc-900/60 transition-all group border border-white/5 relative">
                <div className="relative mb-4 aspect-square">
                  <img src={track.album?.cover_medium || track.albumArt} alt="" className="w-full h-full rounded-xl object-cover" />
                  <button className="absolute inset-0 m-auto w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all">
                    <Play size={24} fill="black" />
                  </button>
                </div>
                <div className="flex justify-between items-start">
                  <div className="truncate pr-2">
                    <h3 className="font-bold truncate">{track.title}</h3>
                    <p className="text-[11px] text-zinc-500 truncate">{track.artist?.name || track.artist}</p>
                  </div>
                  <button onClick={() => toggleFavorite(track)}>
                    <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-600"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MusicApp;