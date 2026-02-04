import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X 
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

  // Διαγραφή μεμονωμένου στοιχείου από το ιστορικό
  const removeFromHistory = (e, termToRemove) => {
    e.stopPropagation(); // Για να μην πατηθεί η αναζήτηση
    const updated = searchHistory.filter(item => item !== termToRemove);
    setSearchHistory(updated);
    localStorage.setItem('beatstream_history', JSON.stringify(updated));
  };

  const filteredHistory = searchQuery.trim() === '' 
    ? searchHistory 
    : searchHistory.filter(h => h.toLowerCase().startsWith(searchQuery.toLowerCase()));

  const toggleLike = (e, track) => {
    e.stopPropagation();
    const isAlreadyLiked = favorites.some(f => f.id === track.id);
    let newFavs = isAlreadyLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newFavs);
    localStorage.setItem('beatstream_favs', JSON.stringify(newFavs));
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl uppercase italic tracking-tighter">Beatstream</span>
        </div>
        <button onClick={() => setView('library')} className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all ${view === 'library' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-white'}`}>
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
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
              {/* ΕΠΑΓΓΕΛΜΑΤΙΚΟ X ΣΤΗΝ SEARCH BAR */}
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg"
                >
                  <X size={12} className="text-black stroke-[3px]" />
                </button>
              )}
            </div>

            {/* DROPDOWN ΙΣΤΟΡΙΚΟΥ */}
            {showSearchHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden">
                {filteredHistory.map((term, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between px-4 hover:bg-white/5 transition-colors group/item"
                  >
                    <button 
                      onMouseDown={() => { setSearchQuery(term); handleSearch(null, term); }} 
                      className="flex-1 text-left py-2.5 pl-6 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3 group-hover/item:text-white transition-colors"
                    >
                      <History size={14} className="text-zinc-600 group-hover/item:text-indigo-400" /> {term}
                    </button>
                    {/* X ΣΤΙΣ ΕΠΙΛΟΓΕΣ ΙΣΤΟΡΙΚΟΥ */}
                    <button 
                      onMouseDown={(e) => removeFromHistory(e, term)}
                      className="p-2 text-zinc-600 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* TRACK GRID */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowSearchHistory(false)}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && <button onClick={() => setView('discover')} className="hover:text-indigo-400 transition-colors"><ChevronLeft size={44} /></button>}
            <h2 className="text-[44px] font-black uppercase italic text-zinc-300 tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
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
                      className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                    >
                      {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <MoreVertical size={16} className="text-zinc-600" />
                    <button onClick={(e) => toggleLike(e, track)} className="hover:scale-125 transition-transform active:scale-95">
                      <Heart size={20} className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLAYER BAR */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[200]">
            <div className="flex items-center gap-4 w-64">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg shadow-lg" alt="" />
              <div className="truncate text-white font-bold text-sm tracking-tight">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>
            <button 
              onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()} 
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
            >
              {isPaused ? <Play size={20} fill="black" className="ml-1" /> : <Pause size={20} fill="black" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;

