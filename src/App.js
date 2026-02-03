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
  const [activeMenu, setActiveMenu] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const audioRef = useRef(new Audio());

  // Safe Queries με το ερωτηματικό (?) για να μην βγάζει το σφάλμα undefined
  const favoriteTracks = useLiveQuery(() => db?.tracks?.toArray(), []) || [];
  const searchHistory = useLiveQuery(() => db?.history?.reverse().limit(6).toArray(), []) || [];

  useEffect(() => {
    // Μόνιμα τραγούδια στο Discover
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
    fetchTrending();

    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const handleSearch = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
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
      
      // Αποθήκευση στο ιστορικό
      if (db?.history) {
        await db.history.put({ id: q.toLowerCase(), term: q });
      }
    } catch (err) {}
  };

  const toggleLike = async (e, track) => {
    e.stopPropagation();
    if (!db?.tracks) return; // Προστασία από το undefined error

    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.put(track);
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR - ΟΠΩΣ ΤΟ ΕΧΕΙΣ ΣΤΗ ΦΩΤΟ */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button 
          onClick={() => setView('library')}
          className={`flex items-center gap-3 px-2 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24 overflow-hidden">
        
        {/* HEADER & SEARCH BAR */}
        <header className="p-4 flex items-center justify-between z-[100]">
          <div className="w-[450px] relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300"
                placeholder="Search..." value={searchQuery} 
                onFocus={() => setShowSearchHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            {/* ΙΣΤΟΡΙΚΟ ΠΟΥ ΕΜΦΑΝΙΖΕΤΑΙ ΣΤΟ SEARCH BAR */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-[110]">
                {searchHistory
