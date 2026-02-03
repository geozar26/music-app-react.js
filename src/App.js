;import React, { useState, useEffect } from 'react';
import { Search, Play, Heart, Music, Library as LibraryIcon, X, MoreVertical, Download, Gauge, ChevronLeft } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [showHistory, setShowHistory] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.searches?.orderBy('timestamp').reverse().toArray()) || [];

  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const res = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
          params: { q: 'Top Hits' },
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        });
        setTracks(res.data.data || []);
      } catch (e) { console.error(e); }
    };
    fetchDefault();
  }, []);

  const toggleFavorite = async (track) => {
    if (!db.favorites) return; 
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      await db.favorites.delete(track.id);
    } else {
      await db.favorites.add({
        id: track.id,
        title: track.title,
        artist: track.artist.name || track.artist,
        albumArt: track.album?.cover_medium || track.albumArt,
        preview: track.preview
      });
    }
  };

  const searchTracks = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
    if (!q.trim()) return;
    setView('discover');
    setShowHistory(false);
    try {
      const response = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
        params: { q },
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(response.data.data || []);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans relative">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0 z-50">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8 px-2 cursor-pointer" onClick={() => setView('discover')}>
            <Music className="text-indigo-500 w-6 h-6" />
            <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
          </div>

          {/* BACK BUTTON ΕΠΑΓΓΕΛΜΑΤΙΚΑ ΣΤΟ SIDEBAR */}
          {view === 'library' && (
            <button 
              onClick={() => setView('discover')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-white/5 text-indigo-400 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-[11px]">Back Home</span>
            </button>
          )}

          <button 
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === 'library' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="font-bold uppercase tracking-widest text-[11px]">My Library</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-gradient-to-b from-[#0d0d1a] to-[#020205] relative overflow-hidden">
        
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 z-40">
          <div className="flex-1 max-w-md">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input 
                type="text"
                className="w-full bg-white/5 rounded-full py-2 pl-10 pr-4 border border-white/10 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                placeholder="Search songs, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-indigo-400 font-bold text-[11px] uppercase tracking-[0.2em] hover:text-white transition-colors">Install</button>
            <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20">Sign Up</button>
          </div>
        </header>

        {/* TRACKS GRID */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" onClick={() => setActiveMenu(null)}>
          <h2 className="text-4xl font-black mb-10 uppercase tracking-tighter italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            {view === 'discover' ? 'Discover' : 'Your Library'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="group flex flex-col bg-white/[0.02] p-4 rounded-3xl border border-white/5 hover:bg-white/[0.05] transition-all hover:scale-[1.02] hover:border-indigo-500/40">
                
                {/* IMAGE */}
                <div className="relative aspect-square mb-5 rounded-2xl overflow-hidden">
                  <img src={track.album?.cover_medium || track.albumArt} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-2xl">
                      <Play size={24} fill="white" className="ml-1" />
                    </button>
                  </div>
                </div>

                {/* TEXT & ACTIONS */}
                <div className="flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="overflow-hidden">
                      <h3 className="font-black text-sm truncate text-white">{track.title}</h3>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">{track.artist?.name || track.artist}</p>
                    </div>

                    {/* Η ΚΑΡΔΙΑ (ΔΕΞΙΑ) */}
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }} className="shrink-0 pt-1">
                      <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-700 hover:text-zinc-400"} />
                    </button>
                  </div>

                  {/* ΟΙ ΤΕΛΕΙΕΣ (MENU) ΣΤΟ ΚΑΤΩ ΜΕΡΟΣ ΤΗΣ ΚΑΡΔΑΣ - ΑΡΙΣΤΕΡΑ */}
                  <div className="relative mt-auto pt-3 border-t border-white/5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeMenu === track.id ? 'text-indigo-400' : 'text-zinc-600 hover:text-indigo-400'}`}
                    >
                      <MoreVertical size={16} />
                      <span>Options</span>
                    </button>

                    {activeMenu === track.id && (
                      <div className="absolute top-full left-0 mt-2 w-52 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] p-2 backdrop-blur-2xl">
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-xl transition-all">
                          <Gauge size={14} className="text-indigo-500" /> Speed (Ταχύτητα)
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-xl transition-all">
                          <Download size={14} className="text-indigo-500" /> Download (Λήψη)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* OVERLAY ΓΙΑ ΤΟ MENU */}
      {activeMenu && <div className="fixed inset-0 z-[80]" onClick={() => setActiveMenu(null)} />}
    </div>
  );
};

export default MusicApp;
