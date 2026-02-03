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
  const [activeMenu, setActiveMenu] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlayingTrack(null);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    
    // Αφαιρέθηκε η αυτόματη αναζήτηση παιδικών
    
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
    } catch (err) {}
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10">
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <div className="flex items-center gap-3 px-2 text-zinc-500">
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24">
        
        {/* HEADER - ΚΟΥΜΠΙΑ ΔΙΠΛΑ-ΔΙΠΛΑ ΟΠΩΣ ΣΤΗ ΦΩΤΟ */}
        <header className="p-4 flex items-center justify-between">
          
          {/* SEARCH BAR */}
          <div className="w-[450px] shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300"
                placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTracks(e)}
              />
            </div>
          </div>

          {/* TA ΚΟΥΜΠΙΑ ΔΙΠΛΑ ΣΤΟ SIGN UP */}
          <div className="flex items-center gap-8 pr-4">
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              INSTALL
            </button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
              LOG IN
            </button>
            <button className="bg-[#6366f1] hover:bg-[#5558e3] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">
              SIGN UP
            </button>
          </div>
        </header>

        {/* TRACKS GRID */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setActiveMenu(null)}>
          <h2 className="text-[44px] font-black uppercase italic mb-10 text-zinc-300 tracking-tighter italic">DISCOVER</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {tracks.map((track) => (
              <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative">
                <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                  <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>
                <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                <p className="text-[11px] text-zinc-600 truncate mb-4">{track.artist?.name}</p>
                
                <div className="flex justify-between items-center px-1">
                   <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-800">
                      <MoreVertical size={16} />
                    </button>
                  <Heart size={16} className="text-zinc-900" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[100]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_medium} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate text-white font-bold text-sm">{playingTrack.title}</div>
            </div>
            <div className="flex-1 max-w-xl mx-auto flex items-center">
              <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime / (duration || 30)) * 100}%` }} />
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
