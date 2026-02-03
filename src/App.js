
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  X, MoreVertical, Download, Gauge, ChevronLeft, Pause, DownloadCloud
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

    searchTracks(null, "Top Hits");

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
      if (audio.paused) {
        audio.play().catch(e => console.error(e));
      } else {
        audio.pause();
        setPlayingTrack(null);
      }
    } else {
      audio.pause();
      audio.src = secureUrl;
      audio.load();
      try {
        await audio.play();
        setPlayingTrack(track);
      } catch (e) { console.error(e); }
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

      if (db.searches && !queryOverride) {
        const exists = await db.searches.where('query').equals(q.toLowerCase()).count();
        if (!exists) await db.searches.add({ query: q.toLowerCase(), timestamp: Date.now() });
      }
    } catch (err) { console.error(err); }
  };

  const formatTime = (t) => {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
        </div>
        <button 
          onClick={() => setView('library')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'library' ? 'bg-indigo-500/15 text-indigo-400' : 'text-zinc-500 hover:text-white'}`}
        >
          <LibraryIcon size={20} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
        </button>
      </aside>

      {/* MAIN SECTION */}
      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24">
        
        {/* HEADER ME OLA TA KOUMPIA */}
        <header className="p-4 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-50">
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-white/5 rounded-xl py-2 px-10 border border-white/10 outline-none focus:border-indigo-500 transition-all"
                placeholder="Search..." value={searchQuery} onFocus={() => setShowHistory(true)} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl z-[100] p-2">
                {searchHistory.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer" onClick={() => { setSearchQuery(item.query); searchTracks(null, item.query); }}>
                    <span className="text-zinc-300">{item.query}</span>
                    <button onClick={(e) => { e.stopPropagation(); db.searches.delete(item.id); }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ΤΑ ΚΟΥΜΠΙΑ ΠΟΥ ΗΘΕΛΕΣ */}
          <div className="flex items-center gap-3 ml-4">
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest border border-white/10 transition-all">
              <DownloadCloud size={16} className="text-indigo-400" />
              Install App
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-indigo-500/20">
              Sign Up
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setShowHistory(false); setActiveMenu(null); }}>
          <div className="flex items-center gap-4 mb-8">
            {view === 'library' && (
              <button onClick={() => setView('discover')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-indigo-400 border border-white/10 transition-all">
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">{view === 'discover' ? 'Discover' : 'Library'}</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="bg-white/[0.03] p-4 rounded-2xl group border border-white/5 hover:bg-white/[0.07] transition-all relative">
                <div className="relative mb-4 aspect-square rounded-xl overflow-hidden shadow-xl">
                  <img src={track.album?.cover_medium || track.albumArt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                  <button onClick={() => handlePlay(track)} className={`absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl transition-all ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>
                <h3 className="font-bold truncate text-white">{track.title}</h3>
                <p className="text-[11px] text-zinc-500 truncate mb-4">{track.artist?.name || track.artist}</p>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-600 hover:text-white transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === track.id && (
                      <div className="absolute bottom-full left-0 mb-2 w-36 bg-[#0d0d1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 backdrop-blur-xl">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 hover:bg-white/5 rounded-lg"><Gauge size={14} /> Speed</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-zinc-400 hover:bg-white/5 rounded-lg"><Download size={14} /> Get</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => {
                    const isFav = favorites.some(f => f.id === track.id);
                    isFav ? db.favorites.delete(track.id) : db.favorites.add({id: track.id, title: track.title, artist: track.artist?.name || track.artist, albumArt: track.album?.cover_medium || track.albumArt, preview: track.preview});
                  }}>
                    <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500 shadow-glow" : "text-zinc-700 hover:text-red-400"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM PLAYER */}
        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#080810]/95 backdrop-blur-2xl border-t border-white/10 px-6 py-4 flex items-center justify-between z-[100]">
            <div className="flex items-center gap-4 w-64 shrink-0">
              <img src={playingTrack.album?.cover_medium || playingTrack.albumArt} className="w-12 h-12 rounded-lg shadow-lg border border-white/10" alt="" />
              <div className="truncate">
                <div className="font-bold text-sm truncate text-white">{playingTrack.title}</div>
                <div className="text-[10px] text-zinc-500 uppercase truncate">{playingTrack.artist?.name || playingTrack.artist}</div>
              </div>
            </div>

            <div className="flex-1 max-w-xl mx-auto flex flex-col items-center gap-2 px-4">
              <div className="flex items-center gap-3 w-full">
                <span className="text-[10px] font-mono text-zinc-500 w-8">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 w-8">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="w-64 flex justify-end">
              <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-white/10 shadow-lg">
                <Pause size={20} fill="black" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
