import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, Download, Gauge, ChevronLeft, Pause, History 
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
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(new Audio());

  // ΣΥΝΔΕΣΗ ΜΕ ΒΑΣΗ: Αυτά τα queries κάνουν το UI να αντιδρά αμέσως
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray(), []) || [];
  const searchHistory = useLiveQuery(() => db.history.reverse().limit(6).toArray(), []) || [];

  useEffect(() => {
    fetchInitial();
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsAudioPlaying(true);
    const onPause = () => setIsAudioPlaying(false);
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const fetchInitial = async () => {
    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=top-hits`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
    } catch (err) {}
  };

  // Η ΚΑΡΔΙΑ ΠΟΥ ΔΟΥΛΕΥΕΙ
  const toggleLike = async (e, track) => {
    e.stopPropagation();
    try {
      const isFav = favoriteTracks.some(t => t.id === track.id);
      if (isFav) {
        await db.tracks.delete(track.id);
      } else {
        // Αποθήκευση ολόκληρου του αντικειμένου για να φαίνεται στο Library
        await db.tracks.put({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          preview: track.preview
        });
      }
    } catch (err) {
      console.error("Σφάλμα στην αποθήκευση:", err);
    }
  };

  const handleSearch = async (query) => {
    const q = query || searchQuery;
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
      // ΑΠΟΘΗΚΕΥΣΗ ΙΣΤΟΡΙΚΟΥ
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  const handlePlay = (track) => {
    const audio = audioRef.current;
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play() : audio.pause();
    } else {
      audio.src = track.preview.replace("http://", "https://");
      setPlayingTrack(track);
      audio.play();
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans select-none">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black flex flex-col shrink-0 p-6 border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button onClick={() => setView('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <LibraryIcon size={18} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col relative pb-24 overflow-hidden">
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between z-50">
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
            {/* ΙΣΤΟΡΙΚΟ ΑΝΑΖΗΤΗΣΗΣ */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 py-2">
                {searchHistory.map((item) => (
                  <button key={item.id} onClick={() => { setSearchQuery(item.term); handleSearch(item.term); }} className="w-full text-left px-10 py-2 hover:bg-white/5 text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-3 transition-colors">
                    <History size={14} className="text-zinc-600" /> {item.term}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-8 pr-4">
            <button className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Install</button>
            <button className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Log in</button>
            <button className="bg-[#6366f1] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#5558e3] transition-all">Sign up</button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setActiveMenu(null); setShowSearchHistory(false); }}>
          <div className="flex items-center gap-4 mb-10">
            {view === 'library' && (
              <button onClick={() => setView('discover')} className="text-zinc-500 hover:text-white transition-all">
                <ChevronLeft size={44} />
              </button>
            )}
            <h2 className="text-[44px] font-black uppercase italic text-zinc-300 tracking-tighter">
              {view === 'discover' ? 'DISCOVER' : 'MY LIBRARY'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favoriteTracks).map((track) => {
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              return (
                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2rem] group border border-white/5 relative hover:border-white/10 transition-all">
                  <div className="relative mb-4 aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center transition-all ${playingTrack?.id === track.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                      {playingTrack?.id === track.id && isAudioPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                    </button>
                  </div>
                  
                  <h3 className="font-bold truncate text-zinc-100">{track.title}</h3>
                  <p className="text-[11px] text-zinc-600 truncate mb-4">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center px-1">
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white">
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeMenu === track.id && (
                        <div className="absolute bottom-full left-0 mb-2 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-[60] p-2">
                          <button onClick={() => window.open(track.preview)} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-white/5 rounded flex items-center gap-2 uppercase text-zinc-300 transition-colors">
                            <Download size={14} /> Λήψη
                          </button>
                          <div className="h-[1px] bg-white/5 my-1" />
                          <div className="px-3 py-1 text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2"><Gauge size={12}/> Ταχύτητα</div>
                          <div className="flex justify-around p-1">
                            {[1, 1.5, 2].map(s => (
                              <button key={s} onClick={() => { audioRef.current.playbackRate = s; setActiveMenu(null); }} className="text-[10px] font-bold hover:text-indigo-400 transition-colors">{s}x</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={(e) => toggleLike(e, track)} className="active:scale-125 transition-transform">
                      <Heart size={18} className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 hover:text-zinc-400"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center justify-between z-[100]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_small} className="w-12 h-12 rounded-lg object-cover" alt="" />
              <div className="truncate text-left">
                <div className="text-white font-bold text-sm truncate">{playingTrack.title}</div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{playingTrack.artist?.name}</div>
              </div>
            </div>
            <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }} />
              </div>
            </div>
            <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
              {isAudioPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
