import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  X, MoreVertical, Download, Gauge, ChevronLeft, Pause 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [showHistory, setShowHistory] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.searches?.orderBy('timestamp').reverse().toArray()) || [];

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlayingTrack(null);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    searchTracks(null, "Ελληνικά τραγούδια");
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const handlePlay = async (track) => {
    if (!track.preview) return;
    const audio = audioRef.current;
    const secureUrl = track.preview.replace("http://", "https://");
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    } else {
      audio.pause();
      audio.src = secureUrl;
      audio.load();
      try { await audio.play(); setPlayingTrack(track); } catch (e) {}
    }
  };

  const searchTracks = async (e, queryOverride) => {
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
      setShowHistory(false);
    } catch (err) {}
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#080810] flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button onClick={() => setView('library')} className="flex items-center gap-3 px-2 text-zinc-500 hover:text-white transition-all">
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24">
        
        {/* HEADER - ΑΚΡΙΒΗΣ ΔΙΑΤΑΞΗ ΦΩΤΟΓΡΑΦΙΑΣ */}
        <header className="p-4 flex items-center z-50">
          {/* SEARCH BAR - ΠΕΡΙΟΡΙΣΜΕΝΟ ΜΕΓΕΘΟΣ */}
          <div className="w-[450px] relative">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-full py-2 px-10 border border-white/5 outline-none text-zinc-300 focus:border-white/10"
                placeholder="ελληνικά τραγούδια" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* ΤΑ ΚΟΥΜΠΙΑ ΣΟΥ - ΤΕΡΜΑ ΔΕΞΙΑ */}
          <div className="flex-1 flex justify-end items-center gap-8 pr-6">
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
              Install
            </button>
            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
              Log In
            </button>
            <button className="bg-[#6366f1] hover:bg-[#5558e3] px-9 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/10">
              Sign Up
            </button>
          </div>
        </header>

        {/* TRACKS GRID */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setShowHistory(false); setActiveMenu(null); }}>
          <h2 className="text-[44px] font-black uppercase italic mb-10 text-zinc-300 tracking-tighter opacity-80">Discover</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 hover:bg-[#111111]/80 transition-all relative">
                <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden">
                  <img src={track.album?.cover_medium || track.albumArt} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>
                <h3 className="font-bold truncate text-zinc-100 px-1">{track.title}</h3>
                <p className="text-[11px] text-zinc-600 truncate px-1 mb-4">{track.artist?.name || track.artist}</p>
                
                <div className="flex justify-between items-center px-1">
                   <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-800 hover:text-zinc-500">
                      <MoreVertical size={16} />
                    </button>
                  <button onClick={() => {
                    const isFav = favorites.some(f => f.id === track.id);
                    isFav ? db.favorites.delete(track.id) : db.favorites.add({id: track.id, title: track.title, artist: track.artist?.name || track.artist, albumArt: track.album?.cover_medium || track.albumArt, preview: track.preview});
                  }}>
                    <Heart size={16} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-900"} />
                  </button>
                </div>
                
                {activeMenu === track.id && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-[#0d0d1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 hover:bg-white/5 rounded-lg"><Gauge size={14} /> Speed</button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 hover:bg-white/5 rounded-lg"><Download size={14} /> Get</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#080810]/98 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[100]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_medium || playingTrack.albumArt} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-sm">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto flex items-center gap-4">
              <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(currentTime / (duration || 30)) * 100}%` }} />
              </div>
            </div>
            <div className="w-64 flex justify-end">
              <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
                {audioRef.current.paused ? <Play size={20} fill="black" className="ml-1" /> : <Pause size={20} fill="black" />}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
