import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Gauge, 
  Music2 
} from 'lucide-react';
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover'); 
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
    const savedHist = JSON.parse(localStorage.getItem('beatstream_history')) || [];
    setFavorites(savedFavs);
    setSearchHistory(savedHist);
    fetchTrending();

    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 30);
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
  }, []);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
    } catch (err) {} finally { setIsLoading(false); }
  };

  const handleSearch = async (e, override) => {
    if (e) e.preventDefault();
    const q = override || searchQuery;
    if (!q.trim()) return;

    setIsLoading(true);
    setShowSearchHistory(false);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
      setView('discover');
      const updatedHistory = [q, ...searchHistory.filter(item => item !== q)].slice(0, 6);
      setSearchHistory(updatedHistory);
      localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
    } catch (err) {} finally { setIsLoading(false); }
  };

  const removeFromHistory = (e, term) => {
    e.stopPropagation();
    const updatedHistory = searchHistory.filter(item => item !== term);
    setSearchHistory(updatedHistory);
    localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
  };

  const clearLibrary = () => {
    if (window.confirm("Are you sure?")) {
      setFavorites([]);
      localStorage.setItem('beatstream_favs', JSON.stringify([]));
    }
  };

  const toggleLike = (e, track) => {
    e.stopPropagation();
    const isAlreadyLiked = favorites.some(f => f.id === track.id);
    const newFavs = isAlreadyLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newFavs);
    localStorage.setItem('beatstream_favs', JSON.stringify(newFavs));
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
    setActiveMenu(null);
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none" 
         onClick={() => {setActiveMenu(null); setShowSearchHistory(false);}}>
      
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music size={24} className="text-[#6366f1]" />
          <span className="font-black text-xl uppercase italic tracking-tighter">Beatstream</span>
        </div>
        <nav>
          <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LibraryIcon size={16} />
            <span className="font-bold uppercase text-[11px] tracking-widest">Library</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        <header className="p-4 flex items-center justify-between z-[100] bg-[#020205]/80 backdrop-blur-md">
          <div className="w-[450px] relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none text-zinc-300 border border-white/5 focus:border-white/20 transition-all"
                placeholder="Search..." 
                value={searchQuery}
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-1 rounded-full hover:bg-[#6366f1] transition-all duration-300 flex items-center justify-center shadow-lg"
                >
                  <X size={12} strokeWidth={4} />
                </button>
              )}
            </div>

            {/* HISTORY DROPDOWN */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[120] backdrop-blur-xl bg-opacity-95">
                {searchHistory.map((term, i) => (
                  <div 
                    key={i} 
                    className="group/item w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevents blur
                      setSearchQuery(term); 
                      handleSearch(null, term);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <History size={14} className="text-zinc-600" />
                      <span className="text-[10px] font-bold uppercase text-zinc-400 group-hover/item:text-white transition-colors">{term}</span>
                    </div>
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        removeFromHistory(e, term);
                      }} 
                      className="text-white hover:text-[#6366f1] transition-all p-1"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 pr-12">
            <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Install</button>
            <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Log In</button>
            <button className="bg-white text-black text-[10px] font-black uppercase px-6 py-2 rounded-full border border-transparent hover:bg-transparent hover:border-[#6366f1] hover:text-[#6366f1] transition-all duration-300">
              Sign Up
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex items-center justify-between mb-10 pr-10"> 
            <div className="flex items-center gap-4">
              {view === 'library' && (
                <button onClick={() => setView('discover')} className="hover:text-[#6366f1] transition-colors">
                  <ChevronLeft size={44} strokeWidth={2.5} />
                </button>
              )}
              <h2 className="text-[44px] font-black uppercase italic tracking-tighter">
                {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
              </h2>
            </div>

            {view === 'library' && favorites.length > 0 && (
              <button 
                onClick={clearLibrary}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#6366f1]/30 hover:border-[#6366f1] transition-all duration-300 group bg-[#6366f1]/5 shadow-lg"
              >
                <X size={16} className="text-[#6366f1] group-hover:rotate-90 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#6366f1]">
                  Clear All
                </span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div></div>
          ) : (view === 'library' ? favorites : tracks).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 opacity-40">
              <Music2 size={64} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-[0.2em]">NO TRACKS FOUND</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-32">
              {(view === 'library' ? favorites : tracks).map(track => (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group hover:border-white/10 transition-all">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <button onClick={() => {if (playingTrack?.id === track.id) {isPaused ? audioRef.current.play() : audioRef.current.pause();} else {audioRef.current.src = track.preview; setPlayingTrack(track); audioRef.current.play();}}} className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-xl">
                      {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-xs mb-1">{track.title}</h3>
                  <p className="text-[10px] text-zinc-500 truncate mb-4 uppercase font-bold tracking-wider">{track.artist?.name}</p>
                  <div className="flex justify-between items-center relative">
                    <button onClick={(e) => {e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id);}} className="text-zinc-600 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                    {activeMenu === track.id && (
                      <div className="absolute bottom-full left-0 mb-4 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl py-3 z-[150] backdrop-blur-xl">
                        <button className="
