import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Gauge 
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
  const [activeMenu, setActiveMenu] = useState(null); // Για το μενού στις τελείες
  const [playbackRate, setPlaybackRate] = useState(1);

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
    } catch (err) {}
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

  // ΛΕΙΤΟΥΡΓΙΑ DOWNLOAD
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
    } catch (err) { console.error("Download failed", err); }
  };

  // ΛΕΙΤΟΥΡΓΙΑ ΤΑΧΥΤΗΤΑΣ
  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
    setActiveMenu(null);
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none" onClick={() => setActiveMenu(null)}>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl uppercase italic tracking-tighter">Beatstream</span>
        </div>
        
        {/* ΕΠΑΝΑΦΟΡΑ SIDEBAR BUTTONS */}
        <div className="flex flex-col gap-2">
            <button 
                onClick={() => setView('discover')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${view === 'discover' ? 'bg-white/5 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
                <Search size={18} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Discover</span>
            </button>
            <button 
                onClick={() => setView('library')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${view === 'library' ? 'bg-white/5 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
                <LibraryIcon size={18} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between z-[100]">
          <div className="w-[450px] relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none text-zinc-300 border border-white/5 focus:border-white/20 transition-all"
                placeholder="Search songs, artists..." 
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
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowSearchHistory(false)}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && <button onClick={() => setView('discover')} className="hover:text-indigo-400 transition-colors"><ChevronLeft size={44} /></button>}
            <h2 className="text-[44px] font-black uppercase italic text-zinc-300 tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-32">
            {(view === 'discover' ? tracks : favorites).map(track => {
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
                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                  
                  <div className="flex justify-between items-center mt-4 relative">
                    {/* MORE BUTTON - VERTICAL DOTS */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                        className={`p-1 rounded-full transition-colors ${activeMenu === track.id ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}
                    >
                        <MoreVertical size={18} />
                    </button>

                    {/* CONTEXT MENU (Speed & Download) */}
                    {activeMenu === track.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl py-3 z-[150] overflow-hidden backdrop-blur-xl">
                            <div className="px-4 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">Options</div>
                            <button onClick={() => handleDownload(track)} className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:bg-white/5 hover:text-white transition-all">
                                <Download size={16} /> <span className="text-xs font-bold">Download MP3</span>
                            </button>
                            <div className="px-4 py-2.5 border-t border-white/5 mt-1">
                                <div className="flex items-center gap-2 mb-2 text-zinc-500"><Gauge size={14} /> <span className="text-[10px] font-bold uppercase">Speed</span></div>
                                <div className="flex gap-2">
                                    {[1, 1.25, 1.5].map(rate => (
                                        <button 
                                            key={rate} 
                                            onClick={() => changeSpeed(rate)}
                                            className={`flex-1 py-1 rounded-md text-[10px] font-bold border transition-all ${playbackRate === rate ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-zinc-400 hover:border-white/20'}`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={(e) => toggleLike(e, track)} className="hover:scale-125 transition-transform active:scale-95">
                      <Heart size={20} className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[200]">
            <div className="flex items-center gap-4 w-64">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-sm">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-indigo-400">{playbackRate}x</span>
                <button onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                {isPaused ? <Play size={20} fill="black" className="ml-1" /> : <Pause size={20} fill="black" />}
                </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
