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
  const [isLoading, setIsLoading] = useState(true);

  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const audioRef = useRef(new Audio());

  // Φόρτωση από Local Storage κατά την εκκίνηση
  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
    setFavorites(savedFavs);
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
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${searchQuery}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
      setView('discover');
    } catch (err) {} finally {
      setIsSearching(false);
    }
  };

  // Λειτουργία Cardia / Local Storage
  const toggleLike = (e, track) => {
    e.stopPropagation();
    const isAlreadyLiked = favorites.some(f => f.id === track.id);
    let newFavs;
    if (isAlreadyLiked) {
      newFavs = favorites.filter(f => f.id !== track.id);
    } else {
      newFavs = [track, ...favorites];
    }
    setFavorites(newFavs);
    localStorage.setItem('beatstream_favs', JSON.stringify(newFavs));
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
    setActiveMenu(null);
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none" onClick={() => setActiveMenu(null)}>
      
      <aside className="w-64 bg-black flex flex-col p-6 border-r border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-white" size={24} />
          <span className="font-black text-xl uppercase italic tracking-tighter text-white">Beatstream</span>
        </div>
        <nav className="flex flex-col gap-6">
            <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pr-12">
              <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-[#6366f1] transition-colors">Install</button>
              <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-[#6366f1] transition-colors">Log In</button>
              <button className="bg-white text-black text-[10px] font-black uppercase px-6 py-2 rounded-full border border-transparent hover:bg-transparent hover:border-[#6366f1] hover:text-[#6366f1] transition-all duration-300">
                Sign Up
              </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && (
              <button onClick={() => setView('discover')} className="hover:text-[#6366f1] transition-colors">
                <ChevronLeft size={44} strokeWidth={2.5} />
              </button>
            )}
            <h2 className="text-[44px] font-black uppercase italic text-white tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          {!isLoading && (view === 'library' ? favorites : tracks).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 opacity-40">
              <Music2 size={64} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-[0.2em]">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΠΟΘΗΚΕΥΜΕΝΑ ΤΡΑΓΟΥΔΙΑ ΑΚΟΜΑ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-32">
              {(view === 'library' ? favorites : tracks).map(track => {
                const isLiked = favorites.some(f => f.id === track.id);
                return (
                  <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group hover:border-white/10 transition-all">
                    <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                      <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      <button 
                        onClick={() => {
                          if (playingTrack?.id === track.id) { isPaused ? audioRef.current.play() : audioRef.current.pause(); } 
                          else { audioRef.current.src = track.preview; setPlayingTrack(track); audioRef.current.play(); }
                        }} 
                        className="absolute inset-0 m-auto w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                      >
                        {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                      </button>
                    </div>
                    <h3 className="font-bold truncate text-zinc-100 text-xs">{track.title}</h3>
                    <div className="flex justify-between items-center mt-4 relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                      
                      {activeMenu === track.id && (
                          <div className="absolute bottom-full left-0 mb-4 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl py-3 z-[150] backdrop-blur-xl">
                              <button className="w-full flex items-center gap-3 px-5 py-3 text-zinc-300 hover:bg-white/5 hover:text-white transition-all border-b border-white/5">
                                  <Download size={16} /> <span className="text-xs font-black uppercase tracking-wider">Download</span>
                              </button>
                              <div className="px-5 pt-2 pb-1">
                                  <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                      <Gauge size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Playback Speed</span>
                                  </div>
                                  <div className="flex gap-2">
                                      {[1, 1.25, 1.5].map(rate => (
                                          <button key={rate} onClick={() => changeSpeed(rate)} className={`flex-1 py-1.5 rounded-xl text-xs font-black border ${playbackRate === rate ? 'bg-white text-black' : 'border-white/10 text-zinc-500 hover:text-white'}`}>{rate}x</button>
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
      </main>
    </div>
  );
};

export default MusicApp;
