import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const audioRef = useRef(new Audio());

  // Σύνδεση με Dexie για τα αγαπημένα
  const favoriteTracks = useLiveQuery(() => {
    if (db && db.tracks) return db.tracks.toArray();
    return [];
  }, []) || [];

  const searchHistory = useLiveQuery(() => {
    if (db && db.history) return db.history.reverse().limit(6).toArray();
    return [];
  }, []) || [];

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
      } catch (err) {}
    };
    fetchInitial();

    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
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
      if (db?.history) await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  const toggleLike = async (e, track) => {
    e.stopPropagation();
    if (!db?.tracks) return;
    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.put(track);
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        
        <nav className="space-y-4">
          <button 
            onClick={() => setView('discover')} 
            className={`flex items-center gap-3 w-full px-2 transition-colors ${view === 'discover' ? 'text-indigo-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Search size={18} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Discover</span>
          </button>
          
          <button 
            onClick={() => setView('library')} 
            className={`flex items-center gap-3 w-full px-2 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <LibraryIcon size={18} />
            <span className="font-bold uppercase tracking-widest text-[10px]">My Library</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative pb-24 overflow-hidden">
        {/* HEADER ΜΕ ΤΑ ΝΕΑ ΚΟΥΜΠΙΑ */}
        <header className="p-4 flex items-center justify-between z-[100] bg-[#020205]/80 backdrop-blur-md">
          <div className="w-[450px] relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 outline-none text-zinc-300 border border-white/5 focus:border-indigo-500/50 transition-all"
                placeholder="Search artists, songs, albums..." value={searchQuery} 
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-[110]">
                {searchHistory.map((item) => (
                  <button key={item.id} onClick={() => { setSearchQuery(item.term); handleSearch(null, item.term); }} className="w-full text-left px-10 py-2 hover:bg-white/5 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3">
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ΤΑ ΚΟΥΜΠΙΑ ΠΟΥ ΖΗΤΗΣΕΣ (LOGIN / SIGN UP / INSTALL) */}
          <div className="flex items-center gap-6">
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
              Install App
            </button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
              Log In
            </button>
            <button className="bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full hover:scale-105 transition-transform active:scale-95">
              Sign Up
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowSearchHistory(false)}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && <button onClick={() => setView('discover')} className="hover:text-indigo-500 transition-colors"><ChevronLeft size={44} /></button>}
            <h2 className="text-[44px] font-black uppercase italic text-white tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favoriteTracks).map((track) => {
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              return (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group hover:bg-[#111111]/80 transition-all duration-500">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                    <button onClick={() => {
                        const audio = audioRef.current;
                        if (playingTrack?.id === track.id) { audio.paused ? audio.play() : audio.pause(); } 
                        else { audio.src = track.preview; setPlayingTrack(track); audio.play(); }
                    }} className="absolute inset-0 m-auto w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl">
                      {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-zinc-100 mb-1">{track.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate mb-4">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <MoreVertical size={16} className="text-zinc-700 hover:text-zinc-400 cursor-pointer" />
                    <button 
                      onClick={(e) => toggleLike(e, track)}
                      className="transform hover:scale-110 transition-transform active:scale-90"
                    >
                      {/* Η ΚΑΡΔΙΑ ΓΙΝΕΤΑΙ ΚΟΚΚΙΝΗ ΚΑΙ ΓΕΜΑΤΗ ΟΤΑΝ ΕΙΝΑΙ LIKED */}
                      <Heart 
                        size={20} 
                        className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-500"}`} 
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {view === 'library' && favoriteTracks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
              <Heart size={48} className="mb-4 opacity-20" />
              <p className="uppercase tracking-widest font-bold text-xs">Your library is empty</p>
            </div>
          )}
        </div>

        {/* PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[200]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg shadow-lg" alt="" />
              <div className="truncate">
                <div className="text-white font-bold text-sm truncate">{playingTrack.title}</div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider truncate">{playingTrack.artist?.name}</div>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl mx-auto flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                <button onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  {!audioRef.current.paused ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                </button>
              </div>
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 font-mono w-8 text-right">0:{(Math.floor(currentTime)).toString().padStart(2, '0')}</span>
                <div className="h-[3px] flex-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300 relative" 
                    style={{ width: `${(currentTime / (duration || 30)) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-xl"></div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono w-8">0:30</span>
              </div>
            </div>

            <div className="w-64 flex justify-end items-center gap-4">
               <button onClick={(e) => toggleLike(e, playingTrack)}>
                  <Heart size={18} className={`${favoriteTracks.some(t => t.id === playingTrack.id) ? "text-red-500 fill-red-500" : "text-zinc-500 hover:text-white"}`} />
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
