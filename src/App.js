import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  X, MoreVertical, Download, Gauge, ChevronLeft, Pause, History
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

  // Φέρνουμε δεδομένα από τη Dexie
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const historyTracks = useLiveQuery(() => db.history.orderBy('playedAt').reverse().limit(20).toArray()) || [];

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlayingTrack(null);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
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
      audio.playbackRate = 1; 
      try { 
        await audio.play(); 
        setPlayingTrack(track);
        // Προσθήκη στο Ιστορικό
        await db.history.put({ ...track, playedAt: Date.now() });
      } catch (e) {}
    }
  };

  const toggleLike = async (track) => {
    const isFavorite = favoriteTracks.some(t => t.id === track.id);
    if (isFavorite) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.add(track);
    }
  };

  const searchTracks = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${searchQuery}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
      setView('discover');
    } catch (err) {}
  };

  // Επιλογή λίστας βάσει του view
  const getDisplayTracks = () => {
    if (view === 'library') return favoriteTracks;
    if (view === 'history') return historyTracks;
    return tracks;
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        
        <nav className="flex flex-col gap-4">
          <button onClick={() => setView('library')} className={`flex items-center gap-3 px-2 transition-colors ${view === 'library' ? 'text-indigo-500' : 'text-zinc-500 hover:text-white'}`}>
            <LibraryIcon size={18} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-3 px-2 transition-colors ${view === 'history' ? 'text-indigo-500' : 'text-zinc-500 hover:text-white'}`}>
            <History size={18} />
            <span className="font-bold uppercase tracking-widest text-[10px]">History</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col relative pb-24">
        <header className="p-4 flex items-center justify-between bg-[#020205]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            {view !== 'discover' && (
              <button onClick={() => setView('discover')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="w-[400px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300 focus:ring-1 focus:ring-indigo-500"
                placeholder="Search tracks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTracks(e)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">INSTALL</button>
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">LOG IN</button>
            <button className="bg-[#6366f1] px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">SIGN UP</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => setActiveMenu(null)}>
          <h2 className="text-[40px] font-black uppercase italic mb-10 text-zinc-200 tracking-tighter">
            {view === 'discover' ? 'Discover' : view === 'library' ? 'My Library' : 'Recently Played'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {getDisplayTracks().map((track) => (
              <div key={track.id + (track.playedAt || '')} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative">
                <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                  <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>
                
                <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                <p className="text-[11px] text-zinc-500 truncate mb-4">{track.artist?.name}</p>
                
                <div className="flex justify-between items-center relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {/* DROPDOWN MENU */}
                  {activeMenu === track.id && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden">
                      <button onClick={() => { window.open(track.preview, '_blank'); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                        <Download size={14} /> Λήψη Τραγουδιού
                      </button>
                      <div className="h-[1px] bg-white/5" />
                      <div className="px-4 py-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Gauge size={12} /> Ταχύτητα
                      </div>
                      {[1, 1.5, 2].map(speed => (
                        <button key={speed} onClick={() => { audioRef.current.playbackRate = speed; setActiveMenu(null); }} className="w-full text-left px-8 py-2 hover:bg-white/5 text-[10px] font-bold text-zinc-400">
                          {speed}x {speed === 1 && '(Normal)'}
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => toggleLike(track)}>
                    <Heart 
                      size={18} 
                      className={`transition-all ${favoriteTracks.some(t => t.id === track.id) ? "text-red-500 fill-red-500 scale-110" : "text-zinc-600 hover:text-zinc-400"}`} 
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[100]">
            <div className="flex items-center gap-4 w-72">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg" alt="" />
              <div className="truncate">
                <div className="text-white font-bold text-sm truncate">{playingTrack.title}</div>
                <div className="text-zinc-500 text-[10px] uppercase">{playingTrack.artist?.name}</div>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 w-full">
                <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">
                  {Math.floor(currentTime/60)}:{(Math.floor(currentTime%60)).toString().padStart(2,'0')}
                </span>
                <div className="flex-1 h-1 bg-white/10 rounded-full">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(currentTime/duration)*100}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono w-10">
                  {Math.floor(duration/60)}:{(Math.floor(duration%60)).toString().padStart(2,'0')}
                </span>
              </div>
            </div>

            <div className="w-72 flex justify-end">
              <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
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
