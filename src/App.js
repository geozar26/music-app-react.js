import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Gauge, 
  Music2, SearchX 
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
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = async (e, override) => {
    if (e) e.preventDefault();
    const q = override || searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
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

      const updatedHistory = [q, ...searchHistory.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      setSearchHistory(updatedHistory);
      localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
    } catch (err) {} finally {
      setIsSearching(false);
    }
  };

  const removeFromHistory = (e, termToRemove) => {
    e.stopPropagation();
    const updated = searchHistory.filter(item => item !== termToRemove);
    setSearchHistory(updated);
    localStorage.setItem('beatstream_history', JSON.stringify(updated));
  };

  const toggleLike = (e, track) => {
    e.stopPropagation();
    const isAlreadyLiked = favorites.some(f => f.id === track.id);
    let newFavs = isAlreadyLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newFavs);
    localStorage.setItem('beatstream_favs', JSON.stringify(newFavs));
  };

  const handleDownload = async (track) => {
    try {
      const response = await fetch(track.preview);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActiveMenu(null);
    } catch (err) {}
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
    setActiveMenu(null);
  };

  const shownTracks = view === 'discover' ? tracks : favorites;

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none" onClick={() => setActiveMenu(null)}>
      
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-white" size={24} />
          <span className="font-black text-xl uppercase italic tracking-tighter text-white">Beatstream</span>
        </div>
        
        <nav className="flex flex-col gap-6">
            <button 
                onClick={() => setView('library')} 
                className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <LibraryIcon size={16} />
                <span className="font-bold uppercase text-[11px] tracking-widest">Library</span>
            </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        <header className="p-4 flex items-center justify-between z-[100]">
          <div className="w-[450px] relative">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg"
                >
                  <X size={12} className="text-black stroke-[3px]" />
                </button>
              )}
            </div>

            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-[120]">
                {searchHistory.filter(h => h.toLowerCase().startsWith(searchQuery.toLowerCase())).map((term, i) => (
                  <div key={i} className="flex items-center justify-between px-4 hover:bg-white/5 transition-colors group/item">
                    <button 
                      onMouseDown={() => { setSearchQuery(term); handleSearch(null, term); }} 
                      className="flex-1 text-left py-2.5 pl-6 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3 group-hover/item:text-white transition-colors"
                    >
                      <History size={14} className="text-zinc-600 group-hover/item:text-indigo-400" /> {term}
                    </button>
                    <button onMouseDown={(e) => removeFromHistory(e, term)} className="p-2 text-zinc-600 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ΕΠΑΝΑΦΟΡΑ ΚΟΥΜΠΙΩΝ HEADER */}
          <div className="flex items-center gap-6 pr-4">
              <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Install</button>
              <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition-colors">Log In</button>
              <button className="bg-white text-black text-[10px] font-black uppercase px-6 py-2 rounded-full hover:bg-zinc-200 transition-colors">Sign Up</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowSearchHistory(false)}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && <button onClick={() => setView('discover')} className="hover:text-white transition-colors"><ChevronLeft size={44} /></button>}
            <h2 className="text-[44px] font-black uppercase italic text-white tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'LIBRARY'}
            </h2>
          </div>

          {/* EMPTY STATES LOGIC */}
          {shownTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 opacity-40">
              {view === 'library' ? (
                <>
                  <Music2 size={64} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Δεν υπάρχουν αποθηκευμένα τραγούδια ακόμα</p>
                </>
              ) : (
                !isSearching && (
                  <>
                    <SearchX size={64} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Δεν βρέθηκαν αποτελέσματα για "{searchQuery}"</p>
                  </>
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-32">
              {shownTracks.map(track => {
                const isLiked = favorites.some(f => f.id === track.id);
                return (
                  <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group hover:border-white/10 transition-all">
                    <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                      <img src={track.album?.cover_medium} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                      <button 
                        onClick={() => {
                          if (playingTrack?.id === track.id) { audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause(); } 
                          else { audioRef.current.src = track.preview; setPlayingTrack(track); audioRef.current.play(); }
                        }} 
                        className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                      </button>
                    </div>
                    <h3 className="font-bold truncate text-zinc-100 text-xs">{track.title}</h3>
                    
                    <div className="flex justify-between items-center mt-4 relative">
                      <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                          className={`transition-colors ${activeMenu === track.id ? 'text-white' : 'text-zinc-600 hover:text-white'}`}
                      >
                          <MoreVertical size={16} />
                      </button>

                      {activeMenu === track.id && (
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl py-3 z-[150] backdrop-blur-xl">
                              <button onClick={() => handleDownload(track)} className="w-full flex items-center gap-3 px-4 py-2 text-zinc-300 hover:bg-white/5 hover:text-white transition-all">
                                  <Download size={14} /> <span className="text-[11px] font-bold uppercase tracking-wider">Download</span>
                              </button>
                              <div className="px-4 py-2 border-t border-white/5 mt-1">
                                  <div className="flex items-center gap-2 mb-2 text-zinc-500"><Gauge size={12} /> <span className="text-[9px] font-bold uppercase tracking-widest">Playback Speed</span></div>
                                  <div className="flex gap-1">
                                      {[1, 1.25, 1.5].map(rate => (
                                          <button 
                                              key={rate} 
                                              onClick={() => changeSpeed(rate)}
                                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${playbackRate === rate ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                                          >
                                              {rate}x
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )}

                      <button onClick={(e) => toggleLike(e, track)} className="hover:scale-110 transition-transform">
                        <Heart size={18} className={`transition-all ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[200]">
            <div className="flex items-center gap-4 w-64">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-xs tracking-tight">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold text-zinc-500">{playbackRate}x</span>
                <button onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
                {isPaused ? <Play size={18} fill="black" className="ml-0.5" /> : <Pause size={18} fill="black" />}
                </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
