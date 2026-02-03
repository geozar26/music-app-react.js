import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, Download, Gauge, ChevronLeft, Pause, History 
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

  // Σύνδεση με Dexie για αυτόματη ενημέρωση του UI
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.history.reverse().limit(6).toArray()) || [];

  useEffect(() => {
    // Φόρτωση αρχικών τραγουδιών (Discover)
    const loadTrending = async () => {
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
    loadTrending();

    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const handleSearch = async (e, queryOverride) => {
    if (e) e.preventDefault();
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
      // Αποθήκευση στο ιστορικό της Dexie
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  const toggleLike = async (e, track) => {
    e.stopPropagation();
    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      // Αποθηκεύουμε όλο το αντικείμενο για να εμφανίζεται στο My Library
      await db.tracks.put(track);
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button 
          onClick={() => setView('library')}
          className={`flex items-center gap-3 px-2 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24 overflow-hidden">
        
        {/* HEADER & SEARCH BAR */}
        <header className="p-4 flex items-center justify-between z-[100]">
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
            {/* DROPDOWN ΙΣΤΟΡΙΚΟΥ */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden">
                {searchHistory.map((item) => (
                  <button key={item.id} onClick={() => { setSearchQuery(item.term); handleSearch(null, item.term); }} className="w-full text-left px-10 py-2 hover:bg-white/5 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3">
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-8 pr-4">
            <button className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white">Install</button>
            <button className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white">Log in</button>
            <button className="bg-[#6366f1] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">Sign up</button>
          </div>
        </header>

        {/* TRACKS GRID */}
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
              // Εδώ ελέγχουμε αν το τραγούδι είναι στη λίστα των favorites
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              return (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => {
                        const audio = audioRef.current;
                        if (playingTrack?.id === track.id) {
                            audio.paused ? audio.play() : audio.pause();
                        } else {
                            audio.src = track.preview.replace("http://", "https://");
                            setPlayingTrack(track);
                            audio.play();
                        }
                    }} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                  <p className="text-[11px] text-zinc-600 truncate mb-4">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center px-1">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-800 hover:text-white">
                      <MoreVertical size={16} />
                    </button>

                    {/* Η ΚΑΡΔΙΑ ΠΟΥ ΠΛΕΟΝ ΔΟΥΛΕΥΕΙ */}
                    <button onClick={(e) => toggleLike(e, track)}>
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

        {/* BOTTOM PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[200]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_small || playingTrack.album?.cover_medium} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-sm">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto flex items-center px-4">
              <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime / (duration || 30)) * 100}%` }} />
              </div>
            </div>
            <button onClick={() => {
                const audio = audioRef.current;
                audio.paused ? audio.play() : audio.pause();
            }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
              {!audioRef.current.paused ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
