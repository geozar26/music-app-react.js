import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Zap, 
  Trash2
} from 'lucide-react';
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover'); 
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [playbackRate, setPlaybackRate] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(new Audio());
  const searchRef = useRef(null);
  const progressBarRef = useRef(null);

  const API_CONFIG = {
    headers: {
      'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
      'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
    }
  };

  // --- PLAYER LOGIC ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrub(e);
  };

  const handleScrub = (e) => {
    if (!audioRef.current || !duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (x / rect.width) * duration;
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e) => handleScrub(e);
      const onMouseUp = () => setIsDragging(false);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging]);

  // --- SEARCH & SUGGESTIONS ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${searchQuery}`, API_CONFIG);
          setSuggestions(res.data.data?.slice(0, 6) || []);
        } catch (err) { console.error(err); }
      } else {
        setSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
    const savedHist = JSON.parse(localStorage.getItem('beatstream_history')) || [];
    setFavorites(savedFavs);
    setSearchHistory(savedHist);
    fetchTrending();

    const audio = audioRef.current;
    const updateTime = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
    const updateDuration = () => setDuration(audio.duration || 0);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, API_CONFIG);
      setTracks(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
    if (!q.trim()) return;
    setSuggestions([]);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, API_CONFIG);
      setTracks(res.data.data || []);
      setView('discover');
      const updatedHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 15);
      setSearchHistory(updatedHistory);
      localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
      setSearchQuery(q);
    } catch (err) { console.error(err); }
  };

  const toggleFavorite = (track) => {
    const isLiked = favorites.some(f => f.id === track.id);
    const newF = isLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newF);
    localStorage.setItem('beatstream_favs', JSON.stringify(newF));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('beatstream_history');
  };

  const clearLibrary = () => {
    setFavorites([]);
    localStorage.removeItem('beatstream_favs');
  };

  const currentList = view === 'library' ? favorites : tracks;

  return (
    <div className="flex min-h-screen bg-[#020205] text-white font-sans select-none" onClick={() => setActiveMenu(null)}>
      {/* Sidebar */}
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0 h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music size={24} className="text-[#6366f1]" />
          <span className="font-black text-xl italic tracking-tighter">Beatstream</span>
        </div>
        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('library')} className={`flex items-center gap-3 ${view === 'library' ? 'text-white' : 'text-zinc-500'}`}>
            <LibraryIcon size={16} /> <span className="font-bold text-[13px] tracking-widest uppercase">Library</span>
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-3 ${view === 'history' ? 'text-white' : 'text-zinc-500'}`}>
            <History size={16} /> <span className="font-bold text-[13px] tracking-widest uppercase">History</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative pb-40">
        <header className="p-4 flex items-center justify-between z-[200] bg-[#020205]/80 backdrop-blur-md sticky top-0">
          <div className="w-[550px] relative" ref={searchRef}>
            <div className="relative z-[210]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none text-white border border-white/5 focus:border-[#6366f1]/40 transition-all"
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[300] animate-search-in p-2">
                {suggestions.map((track) => (
                  <div key={track.id} onClick={() => handleSearch(null, track.title)} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <img src={track.album.cover_small} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] font-black text-white truncate w-48 leading-none mb-1">{track.title}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{track.artist.name}</span>
                      </div>
                    </div>
                    <div className="pr-4 italic text-zinc-500 text-sm">{searchQuery.toLowerCase()}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 pr-8">
            <button className="text-sm font-bold">Log In</button>
            <button className="bg-white text-black px-6 py-2 rounded-full font-black text-sm">Sign Up</button>
          </div>
        </header>

        <div className="p-8">
           <div className="flex items-center gap-6 mb-10">
             {view !== 'discover' && (
               <button onClick={() => setView('discover')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white">
                 <ChevronLeft size={28} strokeWidth={3} />
               </button>
             )}
             <h2 className="text-[44px] font-black italic tracking-tighter capitalize">
               {view === 'discover' ? 'Discover' : view === 'library' ? 'My Library' : 'History'}
             </h2>
             {view === 'library' && favorites.length > 0 && (
                <button onClick={clearLibrary} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 text-[10px] font-black uppercase mt-2">
                  <Trash2 size={14} /> CLEAR ALL
                </button>
             )}
             {view === 'history' && searchHistory.length > 0 && (
                <button onClick={clearHistory} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 text-[10px] font-black uppercase mt-2">
                  <Trash2 size={14} /> CLEAR ALL
                </button>
             )}
           </div>

           {view === 'history' && searchHistory.length > 0 ? (
              <div className="flex flex-col gap-2 max-w-xl">
                {searchHistory.map((h, i) => (
                  <div key={i} onClick={() => handleSearch(null, h)} className="flex items-center justify-between p-4 bg-[#111111]/40 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer group">
                    <div className="flex items-center gap-4 text-zinc-400 group-hover:text-white">
                      <History size={18} /> <span className="font-bold">{h}</span>
                    </div>
                    <X size={18} className="text-zinc-600 hover:text-white" onClick={(e) => { e.stopPropagation(); const newH = searchHistory.filter(x => x !== h); setSearchHistory(newH); localStorage.setItem('beatstream_history', JSON.stringify(newH)); }} />
                  </div>
                ))}
              </div>
           ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {currentList.map(track => (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 group relative">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt="" />
                    <button onClick={() => {
                      if (playingTrack?.id === track.id) {
                        isPaused ? audioRef.current.play() : audioRef.current.pause();
                        setIsPaused(!isPaused);
                      } else {
                        audioRef.current.src = track.preview;
                        setPlayingTrack(track);
                        audioRef.current.play();
                        setIsPaused(false);
                      }
                    }} className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                      {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="truncate text-left">
                      <h3 className="font-bold truncate text-xs text-white">{track.title}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{track.artist?.name}</p>
                    </div>
                    <Heart 
                      size={18} 
                      onClick={() => toggleFavorite(track)}
                      className={`cursor-pointer transition-all ${favorites.some(f => f.id === track.id) ? "text-red-500 fill-red-500" : "text-zinc-600 hover:text-white"}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
           )}
        </div>

        {playingTrack && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[850px] bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] flex items-center justify-between z-[500] shadow-2xl">
            <div className="flex items-center gap-4 w-[30%]">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-xl" alt="" />
              <div className="truncate text-left text-white">
                <h4 className="text-[12px] font-bold truncate">{playingTrack.title}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">{playingTrack.artist?.name}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <button onClick={() => { isPaused ? audioRef.current.play() : audioRef.current.pause(); setIsPaused(!isPaused); }} className="bg-white p-2 rounded-full hover:scale-110 transition-all">
                {isPaused ? <Play size={20} fill="black" /> : <Pause size={20} fill="black" />}
              </button>
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 tabular-nums">{Math.floor(currentTime)}s</span>
                <div ref={progressBarRef} onMouseDown={handleMouseDown} className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
                  <div className="h-full bg-[#6366f1]" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-zinc-500 tabular-nums">{Math.floor(duration)}s</span>
              </div>
            </div>
            <div className="w-[30%] flex justify-end">
              <button onClick={() => setPlayingTrack(null)} className="p-2 bg-white/5 rounded-full hover:text-red-500 transition-colors"><X size={18} /></button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes searchFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-search-in { animation: searchFadeIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default MusicApp;
