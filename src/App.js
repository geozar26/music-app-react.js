import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Zap, 
  Music2, Music3, Trash2
} from 'lucide-react';
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Νέο state για suggestions
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover'); 
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(new Audio());
  const searchRef = useRef(null);
  const progressBarRef = useRef(null);

  // API Configuration
  const API_CONFIG = {
    headers: {
      'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
      'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
    }
  };

  // Logic για τα Suggestions (Amazon Music Style)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1) {
        try {
          const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${searchQuery}`, API_CONFIG);
          setSuggestions(res.data.data.slice(0, 6) || []);
        } catch (err) { console.error(err); }
      } else {
        setSuggestions([]);
      }
    }, 300); // Περιμένει 300ms για να μην κάνει spam το API

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Κλείσιμο suggestions αν πατήσουμε έξω
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestions([]);
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
    const savedHist = JSON.parse(localStorage.getItem('beatstream_history')) || [];
    setFavorites(savedFavs);
    setSearchHistory(savedHist);
    fetchTrending();

    const audio = audioRef.current;
    const updateTime = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
    const updateDuration = () => setDuration(audio.duration || 0);
    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleEnded = () => {
      const currentList = view === 'library' ? favorites : tracks;
      const currentIndex = currentList.findIndex(t => t.id === playingTrack?.id);
      if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
        const nextTrack = currentList[currentIndex + 1];
        audioRef.current.src = nextTrack.preview;
        setPlayingTrack(nextTrack);
        audioRef.current.play();
      }
    };
    audioRef.current.onended = handleEnded;
  }, [playingTrack, tracks, favorites, view]);

  const handleMouseDown = (e) => { setIsDragging(true); handleScrub(e); };
  const handleMouseMove = (e) => { if (isDragging) handleScrub(e); };
  const handleMouseUp = () => { setIsDragging(false); };
  const handleScrub = (e) => {
    if (!audioRef.current || !duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (x / rect.width) * duration;
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, API_CONFIG);
      setTracks(res.data.data || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleSearch = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
    if (!q.trim()) return;
    setIsLoading(true);
    setShowHistory(false);
    setSuggestions([]);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, API_CONFIG);
      setTracks(res.data.data || []);
      setView('discover');
      const updatedHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 15);
      setSearchHistory(updatedHistory);
      localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
      if (queryOverride) setSearchQuery(queryOverride);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const clearLibrary = () => {
    setFavorites([]);
    localStorage.removeItem('beatstream_favs');
  };

  const stopAndClosePlayer = () => {
    audioRef.current.pause();
    audioRef.current.src = "";
    setPlayingTrack(null);
  };

  const currentList = view === 'library' ? favorites : tracks;

  return (
    <div className="flex min-h-screen bg-[#020205] text-white font-sans select-none" onClick={() => setActiveMenu(null)}>
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0 h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music size={24} className="text-[#6366f1]" />
          <span className="font-black text-xl capitalize italic tracking-tighter text-white">Beatstream</span>
        </div>
        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LibraryIcon size={16} />
            <span className="font-bold capitalize text-[13px] tracking-widest">Library</span>
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-3 transition-colors ${view === 'history' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <History size={16} />
            <span className="font-bold capitalize text-[13px] tracking-widest">History</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative pb-40">
        <header className="p-4 flex items-center justify-between z-[100] bg-[#020205]/80 backdrop-blur-md sticky top-0">
          <div className="w-[500px] relative" ref={searchRef}>
            <div className="relative z-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none text-white border border-white/5 focus:border-[#6366f1]/40 transition-all"
                placeholder="Search songs, artists..." 
                value={searchQuery}
                onFocus={() => setShowHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button onClick={() => {setSearchQuery(''); setSuggestions([]);}} className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-[#6366f1] transition-colors">
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* ANIMATED SUGGESTIONS BOX (AMAZON STYLE) */}
            {(suggestions.length > 0 || (showHistory && searchHistory.length > 0)) && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[150]">
                <div className="p-2">
                  {suggestions.length > 0 ? (
                    suggestions.map((track) => (
                      <div 
                        key={track.id} 
                        onClick={() => handleSearch(null, track.title)}
                        className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
                      >
                        {/* Αριστερά: Το κείμενο του query */}
                        <div className="flex items-center gap-3 flex-1">
                          <Search size={14} className="text-zinc-500 group-hover:text-[#6366f1]" />
                          <span className="text-sm font-bold text-zinc-300 group-hover:text-white truncate max-w-[150px]">
                            {searchQuery.toLowerCase()}
                          </span>
                        </div>
                        
                        {/* Δεξιά: Εικόνα και Πληροφορίες */}
                        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                          <img src={track.album.cover_small} className="w-10 h-10 rounded-lg object-cover shadow-lg" alt="" />
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-white truncate w-32 tracking-tight leading-none mb-1">{track.title}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{track.artist.name}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    searchHistory.slice(0, 5).map((h, i) => (
                      <div key={i} onClick={() => handleSearch(null, h)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                        <History size={14} className="text-zinc-500" />
                        <span className="text-sm font-bold text-zinc-300">{h}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-8 pr-12">
            <button className="text-[15px] font-bold text-white hover:text-[#6366f1] transition-colors">Log In</button>
            <button className="bg-white text-black text-[14px] font-black px-6 py-2 rounded-full hover:bg-transparent hover:border-[#6366f1] hover:text-[#6366f1] border border-transparent transition-all">Sign Up</button>
          </div>
        </header>

        <div className="p-8">
          <div className="flex items-center gap-6 mb-10">
            {view !== 'discover' && (
              <button onClick={() => setView('discover')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white hover:text-[#6366f1] transition-all">
                <ChevronLeft size={28} strokeWidth={3} />
              </button>
            )}
            
            <div className="flex items-center gap-6">
              <h2 className="text-[44px] font-black capitalize italic tracking-tighter text-white">
                {view === 'discover' ? 'Discover' : view === 'library' ? 'My Library' : 'History'}
              </h2>

              {view === 'library' && favorites.length > 0 && (
                <button 
                  onClick={clearLibrary}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#6366f1] rounded-full transition-all border border-[#6366f1]/20 group mt-2"
                >
                  <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Clear Library</span>
                </button>
              )}
            </div>
          </div>

          {view === 'history' ? (
            <div className="flex flex-col gap-2 max-w-2xl">
              {searchHistory.length === 0 ? (
                <p className="text-lg font-bold text-zinc-500 py-10">History is empty.</p>
              ) : (
                searchHistory.map((h, i) => (
                  <div key={i} onClick={() => handleSearch(null, h)} className="flex items-center justify-between group bg-[#111111]/40 hover:bg-white/5 p-4 rounded-2xl border border-white/5 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <History size={18} className="text-zinc-600 group-hover:text-[#6366f1]" />
                      <span className="text-lg font-bold text-zinc-300 group-hover:text-white">{h}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newHist = searchHistory.filter(item => item !== h);
                        setSearchHistory(newHist);
                        localStorage.setItem('beatstream_history', JSON.stringify(newHist));
                      }}
                      className="p-2 text-zinc-500 hover:text-white transition-all"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {!isLoading && currentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                  <div className="bg-white/5 p-8 rounded-[3rem] mb-6">
                    <Music3 size={64} className="opacity-20 text-[#6366f1]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No tracks found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {currentList.map(track => (
                    <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group">
                      <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                        <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <button onClick={() => {if (playingTrack?.id === track.id) {isPaused ? audioRef.current.play() : audioRef.current.pause();} else {audioRef.current.src = track.preview; audioRef.current.playbackRate = playbackRate; setPlayingTrack(track); audioRef.current.play();}}} className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                          {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                        </button>
                      </div>
                      <h3 className="font-bold truncate text-xs mb-1 text-white">{track.title}</h3>
                      <p className="text-[10px] text-zinc-500 truncate mb-4 uppercase font-bold tracking-wider">{track.artist?.name}</p>
                      <div className="flex justify-between items-center relative">
                        <button onClick={(e) => {e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id);}} className="text-zinc-600 hover:text-white transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          const isLiked = favorites.some(f => f.id === track.id);
                          const newF = isLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
                          setFavorites(newF);
                          localStorage.setItem('beatstream_favs', JSON.stringify(newF));
                        }}>
                          <Heart size={18} className={favorites.some(f => f.id === track.id) ? "text-red-500 fill-red-500 scale-110" : "text-zinc-800 hover:text-zinc-400"} />
                        </button>

                        {activeMenu === track.id && (
                          <div className="absolute bottom-8 left-0 w-40 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl z-[160] backdrop-blur-xl">
                            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl transition-all group">
                              <Download size={14} className="text-zinc-500 group-hover:text-[#6366f1]" />
                              <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Download</span>
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Zap size={12} className="text-[#6366f1] fill-[#6366f1]/20 shrink-0" /> 
                              <span className="translate-y-[1px]">Speed</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 px-1">
                              {[0.5, 1, 1.5].map(s => (
                                <button key={s} onClick={() => { setPlaybackRate(s); audioRef.current.playbackRate = s; setActiveMenu(null); }} className={`py-1 rounded-lg text-[10px] font-bold transition-all ${playbackRate === s ? 'bg-[#6366f1] text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>
                                  {s}x
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {playingTrack && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[850px] bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] flex items-center justify-between shadow-2xl z-[200]">
            <div className="flex items-center gap-4 w-[30%]">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-xl shadow-md" alt="" />
              <div className="truncate text-white">
                <h4 className="text-[12px] font-bold truncate">{playingTrack.title}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase truncate">{playingTrack.artist?.name}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2 max-w-[40%]">
              <button onClick={() => isPaused ? audioRef.current.play() : audioRef.current.pause()} className="bg-white p-2 rounded-full hover:scale-110 transition-all shadow-lg">
                {isPaused ? <Play size={20} fill="black" className="text-black ml-0.5" /> : <Pause size={20} fill="black" className="text-black" />}
              </button>
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-500 w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                <div ref={progressBarRef} onMouseDown={handleMouseDown} className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group/bar">
                  <div className="h-full bg-[#6366f1] shadow-[0_0_8px_#6366f1] pointer-events-none" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 w-10 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="w-[30%] flex justify-end pr-2">
              <button onClick={stopAndClosePlayer} className="text-white hover:text-[#6366f1] transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
                <X size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* TA CSS ΓΙΑ ΤΟ ΑΝΙΜΑΤΙΟΝ */}
      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeInSlide 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MusicApp;
