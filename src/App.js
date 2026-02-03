import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  X, MoreVertical, Download, Gauge, ChevronLeft, Pause 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [activeMenu, setActiveMenu] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const audioRef = useRef(new Audio());

  // Dexie Queries
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.history.reverse().limit(5).toArray()) || [];

  // Αρχικά τραγούδια για να μην είναι ποτέ άδειο το Discover
  useEffect(() => {
    const fetchInitialTracks = async () => {
      try {
        const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=top-hits`, {
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        });
        setTracks(res.data.data || []);
      } catch (err) {}
    };
    fetchInitialTracks();
  }, []);

  const handlePlay = async (track) => {
    if (!track.preview) return;
    const audio = audioRef.current;
    const secureUrl = track.preview.replace("http://", "https://");
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    } else {
      audio.pause();
      audio.src = secureUrl;
      try { await audio.play(); setPlayingTrack(track); } catch (e) {}
    }
  };

  const searchTracks = async (queryOverride) => {
    const q = queryOverride || searchQuery;
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
      // Αποθήκευση στο ιστορικό αναζήτησης αν δεν υπάρχει ήδη
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  // Φιλτράρισμα ιστορικού αναζήτησης βάσει του τι γράφει ο χρήστης
  const filteredHistory = searchHistory.filter(h => 
    h.term.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        
        <div className="flex items-center gap-2 group">
          {view === 'library' && (
            <button onClick={() => setView('discover')} className="text-indigo-500 animate-in fade-in slide-in-from-right-1">
              <ChevronLeft size={20} />
            </button>
          )}
          <button 
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-2 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <LibraryIcon size={18} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24">
        
        <header className="p-4 flex items-center justify-between z-50">
          {/* SEARCH BAR WITH HISTORY */}
          <div className="w-[450px] shrink-0 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300"
                placeholder="Αναζήτηση..." value={searchQuery} 
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTracks()}
              />
            </div>

            {/* SEARCH HISTORY DROPDOWN */}
            {showSearchHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#111111] border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50">
                {filteredHistory.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { setSearchQuery(item.term); searchTracks(item.term); }}
                    className="w-full text-left px-10 py-3 hover:bg-white/5 text-zinc-400 hover:text-white text-[11px] font-bold flex items-center gap-3"
                  >
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-8 pr-4">
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">INSTALL</button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">LOG IN</button>
            <button className="bg-[#6366f1] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">SIGN UP</button>
          </div>
        </header>

        {/* TRACKS GRID */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setActiveMenu(null); setShowSearchHistory(false); }}>
          <h2 className="text-[44px] font-black uppercase italic mb-10 text-zinc-300 tracking-tighter">
            {view === 'discover' ? 'DISCOVER' : 'LIBRARY'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favoriteTracks).map((track) => (
              <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative">
                <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                  <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>
                <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                <p className="text-[11px] text-zinc-600 truncate mb-4">{track.artist?.name}</p>
                
                <div className="flex justify-between items-center px-1">
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white">
                      <MoreVertical size={16} />
                    </button>
                    
                    {/* DROPDOWN MENU */}
                    {activeMenu === track.id && (
                      <div className="absolute bottom-8 left-0 w-44 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 p-2 overflow-hidden">
                        <button onClick={() => { window.open(track.preview, '_blank'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] uppercase font-bold hover:bg-white/5 rounded flex items-center gap-2">
                          <Download size={14} /> Λήψη
                        </button>
                        <div className="h-[px] bg-white/5 my-1" />
                        <div className="px-3 py-1 text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                          <Gauge size={12} /> Ταχύτητα
                        </div>
                        {[1, 1.5, 2].map(speed => (
                          <button key={speed} onClick={() => { audioRef.current.playbackRate = speed; setActiveMenu(null); }} className="w-full text-left px-6 py-1.5 hover:bg-white/5 text-[10px] font-bold text-zinc-400 rounded">
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => {
                    const isFav = favoriteTracks.some(t => t.id === track.id);
                    isFav ? db.tracks.delete(track.id) : db.tracks.add(track);
                  }}>
                    <Heart size={16} className={favoriteTracks.some(t => t.id === track.id) ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER... */}
      </main>
    </div>
  );
};

export default MusicApp;
