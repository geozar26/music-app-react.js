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
  const [isPaused, setIsPaused] = useState(true); // Extra state για σωστό UI στα εικονίδια

  const audioRef = useRef(new Audio());

  /* ===================== DEXIE QUERIES ===================== */
  
  // Παίρνουμε τα αγαπημένα και το ιστορικό σε πραγματικό χρόνο
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.history.reverse().toArray()) || [];

  // Φιλτράρισμα ιστορικού για το dropdown
  const filteredHistory = searchQuery.trim() === '' 
    ? searchHistory.slice(0, 6) 
    : searchHistory.filter(h => h.term.toLowerCase().startsWith(searchQuery.toLowerCase())).slice(0, 6);

  /* ===================== AUDIO LOGIC ===================== */

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 30);
    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Αρχικό fetch
    fetchTrending();

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
    } catch (err) { console.error("Fetch error", err); }
  };

  /* ===================== ACTIONS ===================== */

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
      // Αποθήκευση στη βάση
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) { console.error("Search error", err); }
  };

  const toggleLike = async (e, track) => {
    e.stopPropagation();
    // ΣΗΜΑΝΤΙΚΟ: Μετατρέπουμε το ID σε Number για να μην υπάρχει ασυμβατότητα
    const trackId = Number(track.id);
    const exists = await db.tracks.get(trackId);

    if (exists) {
      await db.tracks.delete(trackId);
    } else {
      await db.tracks.put({
        ...track,
        id: trackId // Σιγουρευόμαστε ότι το ID είναι αριθμός
      });
    }
  };

  const playTrack = (track) => {
    const audio = audioRef.current;
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play() : audio.pause();
    } else {
      audio.src = track.preview;
      setPlayingTrack(track);
      audio.play();
    }
  };

  const shownTracks = view === 'discover' ? tracks : favoriteTracks;

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>

        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('discover')} className={`flex items-center gap-3 px-2 ${view === 'discover' ? 'text-white' : 'text-zinc-500'}`}>
            <Search size={18} /> <span className="font-bold uppercase tracking-widest text-[10px]">Discover</span>
          </button>
          <button onClick={() => setView('library')} className={`flex items-center gap-3 px-2 ${view === 'library' ? 'text-white' : 'text-zinc-500'}`}>
            <LibraryIcon size={18} /> <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative pb-24 overflow-hidden">
        
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between z-[100]">
          <div className="w-[450px] relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                className="w-full bg-[#111111] rounded-xl py-2 px-10 outline-none text-zinc-300 border border-transparent focus:border-indigo-500/50"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* SEARCH HISTORY DROPDOWN */}
            {showSearchHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-[110]">
                {filteredHistory.map(item => (
                  <button 
                    key={item.id}
                    onMouseDown={() => { // Χρησιμοποιούμε onMouseDown για να προλάβει το click το blur
                      setSearchQuery(item.term);
                      handleSearch(null, item.term);
                    }}
                    className="w-full text-left px-10 py-2 hover:bg-white/5 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3"
                  >
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button className="text-[10px] font-bold uppercase text-zinc-400">Install</button>
            <button className="text-[10px] font-bold uppercase text-zinc-400">Log In</button>
            <button className="bg-white text-black text-[10px] font-black uppercase px-6 py-2 rounded-full">Sign Up</button>
          </div>
        </header>

        {/* TRACKS GRID */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowSearchHistory(false)}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && <button onClick={() => setView('discover')}><ChevronLeft size={44} /></button>}
            <h2 className="text-[44px] font-black uppercase italic text-zinc-300 tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {shownTracks.map(track => {
              // ΕΛΕΓΧΟΣ ΑΝ ΕΙΝΑΙ LIKED (μετατροπή σε Number για σιγουριά)
              const isLiked = favoriteTracks.some(t => Number(t.id) === Number(track.id));

              return (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] border border-white/5 relative group">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => playTrack(track)}
                      className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {playingTrack?.id === track.id && !isPaused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>

                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>

                  <div className="flex justify-between items-center mt-4">
                    <MoreVertical size={16} className="text-zinc-600" />
                    <button onClick={(e) => toggleLike(e, track)} className="hover:scale-110 transition-transform">
                      <Heart size={18} className={`transition-all ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} />
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
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-sm">{playingTrack.title}</div>
            </div>

            <div className="flex-1 max-w-xl mx-auto flex items-center px-4">
              <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>

            <button 
              onClick={() => audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center"
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


