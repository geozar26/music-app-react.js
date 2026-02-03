import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, Download, Gauge, ChevronLeft, Pause, History 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db"; // Βεβαιώσου ότι το db.js έχει: tracks: 'id', history: 'id, term'
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [activeMenu, setActiveMenu] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const audioRef = useRef(new Audio());
  
  // LIVE QUERIES: Ενημερώνουν το UI αυτόματα μόλις αλλάξει η βάση
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.history.toArray()) || [];

  useEffect(() => {
    fetchInitial();
    const audio = audioRef.current;
    audio.addEventListener('play', () => setIsAudioPlaying(true));
    audio.addEventListener('pause', () => setIsAudioPlaying(false));
    return () => {
      audio.removeEventListener('play', () => setIsAudioPlaying(true));
      audio.removeEventListener('pause', () => setIsAudioPlaying(false));
    };
  }, []);

  const fetchInitial = async () => {
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
    } catch (err) {}
  };

  const handlePlay = (track) => {
    const audio = audioRef.current;
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play() : audio.pause();
    } else {
      audio.src = track.preview.replace("http://", "https://");
      setPlayingTrack(track);
      audio.play();
    }
  };

  const handleSearch = async (query) => {
    const q = query || searchQuery;
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
      // Αποθήκευση στο ιστορικό
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  const toggleLike = async (track) => {
    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.add(track);
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col relative pb-24 overflow-hidden">
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between z-50">
          <div className="w-[450px] relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300"
                placeholder="Search..." value={searchQuery} 
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            {/* ΙΣΤΟΡΙΚΟ ΑΝΑΖΗΤΗΣΗΣ (DROPDOWN) */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 py-2">
                {searchHistory
                  .filter(h => h.term.toLowerCase().startsWith(searchQuery.toLowerCase()))
                  .map((item) => (
                    <button key={item.id} onClick={() => { setSearchQuery(item.term); handleSearch(item.term); }} className="w-full text-left px-10 py-2 hover:bg-white/5 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3 transition-colors">
                      <History size={14} className="text-zinc-600" /> {item.term}
                    </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-8 pr-4">
            <button className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest">Install</button>
            <button className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest">Log in</button>
            <button className="bg-[#6366f1] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">Sign up</button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setActiveMenu(null); setShowSearchHistory(false); }}>
          
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && (
              <button onClick={() => setView('discover')} className="text-zinc-500 hover:text-white transition-all">
                <ChevronLeft size={44} />
              </button>
            )}
            <h2 className="text-[44px] font-black uppercase italic text-zinc-300 tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favoriteTracks).map((track) => {
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              return (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {playingTrack?.id === track.id && isAudioPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                  <p className="text-[11px] text-zinc-600 truncate mb-4">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center px-1">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white">
                      <MoreVertical size={16} />
                    </button>

                    {/* MENU: ΛΗΨΗ & ΤΑΧΥΤΗΤΑ */}
                    {activeMenu === track.id && (
                      <div className="absolute bottom-10 left-0 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 p-2">
                        <button onClick={() => window.open(track.preview)} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-white/5 rounded flex items-center gap-2 uppercase text-zinc-300">
                          <Download size={14} /> Λήψη
                        </button>
                        <div className="h-[1px] bg-white/5 my-1" />
                        <div className="flex justify-around p-1">
                          {[1, 1.5, 2].map(s => (
                            <button key={s} onClick={() => { audioRef.current.playbackRate = s; setActiveMenu(null); }} className="text-[10px] font-bold hover:text-indigo-400">{s}x</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ΚΑΡΔΙΑ: ΤΩΡΑ ΓΙΝΕΤΑΙ ΚΟΚΚΙΝΗ ΑΜΕΣΩΣ */}
                    <button onClick={() => toggleLike(track)}>
                      <Heart 
                        size={18} 
                        className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} 
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLAYER... */}
      </main>
    </div>
  );
};

export default MusicApp;
