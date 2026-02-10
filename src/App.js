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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const removeHistoryItem = (e, itemToRemove) => {
    e.stopPropagation();
    const updatedHistory = searchHistory.filter(h => h !== itemToRemove);
    setSearchHistory(updatedHistory);
    localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
  };

  const toggleFavorite = (track) => {
    const isLiked = favorites.some(f => f.id === track.id);
    const newF = isLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newF);
    localStorage.setItem('beatstream_favs', JSON.stringify(newF));
  };

  const clearLibrary = () => {
    setFavorites([]);
    localStorage.removeItem('beatstream_favs');
  };

  const changeSpeed = (speed) => {
    setPlaybackRate(speed);
    audioRef.current.playbackRate = speed;
    setActiveMenu(null);
  };

  const currentList = view === 'library' ? favorites : tracks;

  return (
    <div className="flex min-h-screen bg-[#020205] text-white font-sans select-none" onClick={() => setActiveMenu(null)}>
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0 h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music size={24} className="text-[#6366f1]" />
          <span className="font-black text-xl italic tracking-tighter uppercase">Beatstream</span>
        </div>
        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LibraryIcon size={16} /> <span className="font-bold text-[13px] tracking-widest uppercase">Library</span>
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-3 transition-colors ${view === 'history' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
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
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none border border-white/5 focus:border-[#6366f1]/40 transition-all pr-12"
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#6366f1] transition-colors"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[300] p-2">
                {suggestions.map((track) => (
                  <div key={track.id} onClick={() => handleSearch(null, track.title)} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <img src={track.album.cover_small} className="w-12 h-12 rounded-lg" alt="" />
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] font-black truncate w-48 leading-none mb-1">{track.title}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{track.artist.name}</span>
                      </div>
                    </div>
                    {/* Αφαιρέθηκε το κείμενο με τις τελείες εδώ */}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-8 pr-8">
            <button className="text-white hover:text-[#6366f1] transition-colors font-black text-sm uppercase tracking-widest">
              Install
            </button>
            <button className="text-white hover:text-[#6366f1] transition-colors font-black text-sm uppercase tracking-widest">
              Log In
            </button>
            <button className="bg-white text-black px-6 py-2 rounded-full font-black text-sm hover:bg-[#6366f1] hover:text-white transition-all uppercase tracking-widest">
              Sign Up
            </button>
          </div>
        </header>

        <div className="p-8">
            <div className="flex items-center gap-6 mb-10">
              {view !== 'discover' && (
                <button onClick={() => setView('discover')} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-[#6366f1] transition-all">
                  <ChevronLeft size={28} strokeWidth={3} />
                </button>
              )}
              <h2 className="text-[44px] font-black italic tracking-tighter capitalize">{view === 'library' ? 'My Library' : view === 'history' ? 'History' : 'Discover'}</h2>
              {view === 'library' && favorites.length > 0 && (
                 <button onClick={clearLibrary} className="flex items-center gap-2 px-4 py-1.5 bg-[#6366f1]/10 text-[#6366f1] rounded-full border border-[#6366f1]/20 text-[10px] font-black uppercase mt-2">
                   <Trash2 size={14} /> CLEAR ALL
                 </button>
              )}
            </div>

            {view === 'history' ? (
               <div className="flex flex-col gap-2 max-w-xl">
                 {searchHistory.map((h, i) => (
                   <div key={i} onClick={() => handleSearch(null, h)} className="flex items-center justify-between p-4 bg-[#111111]/40 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer group">
                     <div className="flex items-center gap-4 text-zinc-400 group-hover:text-white">
                       <History size={18} /> <span className="font-bold">{h}</span>
                     </div>
                     <button 
                        onClick={(e) => removeHistoryItem(e, h)}
                        className="text-white hover:text-[#6366f1] transition-colors p-1"
                     >
                        <X size={18} strokeWidth={2.5} />
                     </button>
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
                         audioRef.current.playbackRate = playbackRate;
                         setPlayingTrack(track);
                         audioRef.current.play();
                         setIsPaused(false);
                       }
                     }} className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                       {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                     </button>
                   </div>
                   <div className="flex justify-between items-start mb-2">
                     <div className="truncate text-left flex-1">
                       <h3 className="font-bold truncate text-xs text-white">{track.title}</h3>
                       <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{track.artist?.name}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <Heart 
                         size={18} 
                         onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
                         className={`cursor-pointer ${favorites.some(f => f.id === track.id) ? "text-[#6366f1] fill-[#6366f1]" : "text-zinc-600 hover:text-white"}`} 
                       />
                       <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white">
                         < MoreVertical size={16} />
                       </button>
                     </div>
                   </div>

                   {activeMenu === track.id && (
                     <div className="absolute bottom-12 right-4 w-40 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 z-[150] shadow-2xl">
                       <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all">
                         <Download size={14} /> Download
                       </button>
                       <div className="h-[1px] bg-white/5 my-1" />
                       <div className="px-3 py-1 text-[9px] font-black text-[#6366f1] uppercase">Speed</div>
                       <div className="flex gap-1 px-2 pb-1">
                         {[0.5, 1, 1.5].map(s => (
                           <button key={s} onClick={() => changeSpeed(s)} className={`flex-1 py-1 rounded-md text-[10px] font-bold ${playbackRate === s ? 'bg-[#6366f1] text-white' : 'bg-white/5 text-zinc-500'}`}>
                             {s}x
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
            )}
        </div>

        {playingTrack && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[850px] bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2.5rem] flex items-center justify-between z-[500] shadow-2xl">
            <div className="flex items-center gap-4 w-[30%]">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-xl" alt="" />
              <div className="truncate text-left"><h4 className="text-[12px] font-bold text-white truncate">{playingTrack.title}</h4><p className="text-[10px] text-zinc-400 uppercase">{playingTrack.artist?.name}</p></div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <button onClick={() => { isPaused ? audioRef.current.play() : audioRef.current.pause(); setIsPaused(!isPaused); }} className="bg-white p-2 rounded-full hover:scale-110 transition-all">
                {isPaused ? <Play size={20} fill="black" /> : <Pause size={20} fill="black" />}
              </button>
              <div className="w-full flex items-center gap-3 px-4">
                <span className="text-[10px] text-zinc-500 w-10 text-right">{Math.floor(currentTime)}s</span>
                <div ref={progressBarRef} onMouseDown={handleMouseDown} className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
                  <div className="h-full bg-[#6366f1]" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                </div>
                <span className="text-[10px] text-zinc-500 w-10">{Math.floor(duration)}s</span>
              </div>
            </div>
            <div className="w-[30%] flex justify-end">
              <button onClick={() => setPlayingTrack(null)} className="p-2 bg-white/5 rounded-full hover:text-[#6366f1]"><X size={18} /></button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
