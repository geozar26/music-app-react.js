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

  // Συνάρτηση για τη μορφή του χρόνου (π.χ. 0:30)
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
    const updateTime = () => setCurrentTime(audio.currentTime);
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

  const toggleLike = (e, track) => {
    e.stopPropagation();
    const isAlreadyLiked = favorites.some(f => f.id === track.id);
    const newFavs = isAlreadyLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
    setFavorites(newFavs);
    localStorage.setItem('beatstream_favs', JSON.stringify(newFavs));
  };

  return (
    <div className="flex min-h-screen bg-[#020205] text-white font-sans select-none" onClick={() => {setActiveMenu(null); setShowSearchHistory(false);}}>
      
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0 h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music size={24} className="text-[#6366f1]" />
          <span className="font-black text-xl capitalize italic tracking-tighter">Beatstream</span>
        </div>
        <nav>
          <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LibraryIcon size={16} />
            <span className="font-bold capitalize text-[13px] tracking-widest">Library</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative pb-32">
        <header className="p-4 flex items-center justify-between z-[100] bg-[#020205]/80 backdrop-blur-md sticky top-0">
          <div className="w-[450px] relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2.5 px-10 outline-none text-white border border-white/5 focus:border-white/20 transition-all"
                placeholder="Search..." 
                value={searchQuery}
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {/* 1. ΚΟΥΜΠΙ X ΣΤΟ SEARCH */}
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
          {/* ...Υπόλοιπο header αμετάβλητο... */}
          <div className="flex items-center gap-6 pr-12">
            <button className="text-[15px] font-bold capitalize text-white hover:text-[#6366f1] transition-colors">Install</button>
            <button className="bg-white text-black text-[14px] font-black capitalize px-6 py-2 rounded-full hover:bg-transparent hover:border-[#6366f1] hover:text-[#6366f1] border border-transparent transition-all">Sign Up</button>
          </div>
        </header>

        <div className="p-8">
           {/* ...Grid των τραγουδιών όπως το είχες... */}
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {(view === 'library' ? favorites : tracks).map(track => (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <button onClick={() => {if (playingTrack?.id === track.id) {isPaused ? audioRef.current.play() : audioRef.current.pause();} else {audioRef.current.src = track.preview; setPlayingTrack(track); audioRef.current.play();}}} className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  <h3 className="font-bold truncate text-xs">{track.title}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{track.artist?.name}</p>
                </div>
              ))}
           </div>
        </div>

        {/* 2. ΕΠΑΓΓΕΛΜΑΤΙΚΗ ΜΠΑΡΑ ΣΤΗΝ ΟΘΟΝΗ */}
        {playingTrack && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-[2.5rem] flex items-center gap-8 shadow-2xl z-[200]">
            <div className="flex items-center gap-4 w-64">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-xl shadow-lg" alt="" />
              <div className="truncate">
                <h4 className="text-xs font-black truncate">{playingTrack.title}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase truncate">{playingTrack.artist?.name}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <button onClick={() => isPaused ? audioRef.current.play() : audioRef.current.pause()} className="bg-white p-2 rounded-full hover:scale-110 transition-transform">
                {isPaused ? <Play size={20} fill="black" className="text-black ml-0.5" /> : <Pause size={20} fill="black" className="text-black" />}
              </button>
              
              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full relative group overflow-hidden">
                  <div className="h-full bg-[#6366f1] transition-all" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 w-10">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="w-64 flex justify-end">
              <button onClick={(e) => toggleLike(e, playingTrack)}>
                <Heart size={20} className={favorites.some(f => f.id === playingTrack.id) ? "text-red-500 fill-red-500" : "text-zinc-500"} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
