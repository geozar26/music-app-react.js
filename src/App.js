import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, Pause, History 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db"; 
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [playingTrack, setPlayingTrack] = useState(null);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState([]);

  const audioRef = useRef(new Audio());

  // 1. Live Query για τα δεδομένα από τη Dexie
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const allHistory = useLiveQuery(() => db.history.reverse().toArray()) || [];

  // 2. useEffect για το φιλτράρισμα του ιστορικού (Αυτό που ζήτησες)
  // Τρέχει κάθε φορά που ο χρήστης γράφει ένα γράμμα
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(allHistory.slice(0, 6)); // Αν είναι κενό, δείξε τα τελευταία 6
    } else {
      const filtered = allHistory.filter(item => 
        item.term.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [searchQuery, allHistory]);

  // 3. useEffect για την αρχική φόρτωση
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, {
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        });
        setTracks(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchInitial();
  }, []);

  const handleSearch = async (termOverride) => {
    const q = termOverride || searchQuery;
    if (!q.trim()) return;

    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
      setView('discover');
      setShowSearchHistory(false);
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  const toggleLike = async (track) => {
    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.put(track);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black p-6 border-r border-white/5">
        <div className="mb-10 flex items-center gap-2 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" />
          <span className="font-black italic uppercase">Beatstream</span>
        </div>
        
        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('discover')} className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${view === 'discover' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
            <Search size={18} /> Discover
          </button>
          <button onClick={() => setView('library')} className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
            <LibraryIcon size={18} /> My Library
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-24">
        <header className="p-6">
          <div className="relative w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              className="w-full bg-[#111] rounded-xl py-2 px-10 outline-none border border-white/5 focus:border-indigo-500 transition-all"
              placeholder="Αναζήτηση..."
              value={searchQuery}
              onFocus={() => setShowSearchHistory(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            {/* SEARCH HISTORY DROPDOWN */}
            {showSearchHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {filteredHistory.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setSearchQuery(item.term); handleSearch(item.term); }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-zinc-400 text-[11px] font-bold uppercase"
                  >
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="p-8" onClick={() => setShowSearchHistory(false)}>
          <h2 className="text-4xl font-black italic uppercase mb-10 text-zinc-200">
            {view === 'discover' ? 'Discover' : 'My Library'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favoriteTracks).map(track => {
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              return (
                <div key={track.id} className="bg-[#111]/40 p-4 rounded-[2rem] border border-white/5 group hover:bg-[#111] transition-all">
                  <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 shadow-xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => {
                        audioRef.current.src = track.preview;
                        audioRef.current.play();
                        setPlayingTrack(track);
                      }}
                      className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Play fill="white" size={20} />
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-sm">{track.title}</h3>
                  <p className="text-[10px] text-zinc-500 truncate mb-4 uppercase font-bold">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center px-1">
                    <MoreVertical size={16} className="text-zinc-800" />
                    
                    {/* Διορθωμένο κουμπί Καρδιάς */}
                    <button onClick={() => toggleLike(track)} className="transition-transform active:scale-125">
                      <Heart 
                        size={20} 
                        className={`transition-colors ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-600"}`} 
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MINI PLAYER */}
      {playingTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 p-4 flex items-center justify-between px-10 z-[100]">
          <div className="flex items-center gap-4">
            <img src={playingTrack.album?.cover_small} className="w-10 h-10 rounded-lg" alt="" />
            <div>
              <div className="text-xs font-bold">{playingTrack.title}</div>
              <div className="text-[9px] text-zinc-500 uppercase">{playingTrack.artist?.name}</div>
            </div>
          </div>
          <button 
            onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black"
          >
            <Pause fill="black" size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
