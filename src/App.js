import React, { useState, useEffect } from 'react';
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
      if (db.searches) {
        const exists = await db.searches.where('query').equals(q.toLowerCase()).count();
        if (!exists) { await db.searches.add({ query: q.toLowerCase(), timestamp: Date.now() }); }
      }
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
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm relative">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer group" onClick={() => setView('discover')}>
            <Music className="text-indigo-500 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all" size={24} />
            <span className="font-black text-xl tracking-tighter uppercase italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Beatstream</span>
          </div>
          <button 
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 ${
              view === 'library' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="font-black uppercase tracking-widest text-[11px]">Library</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-[#0d0d1a] to-[#020205]">
        <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5 z-50">
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text"
                className="w-full bg-white/5 rounded-xl py-2 px-10 border border-white/10 focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setShowHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0d0d1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[60]">
                <div className="p-2">
                  {searchHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer group" onClick={() => { setSearchQuery(item.query); searchTracks(null, item.query); }}>
                      <div className="flex items-center gap-3">
                        <Search size={14} className="text-zinc-500" />
                        <span className="text-zinc-300">{item.query}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); db.searches.delete(item.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-indigo-400 transition"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-10 ml-6 mr-12 shrink-0">
            <div className="flex items-center gap-7">
              <button className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-lg border border-indigo-500/20 font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-500/20 transition-all">Install</button>
              <button className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">Log In</button>
            </div>
            <button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105 transition-all">Sign Up</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => { setShowHistory(false); setActiveMenu(null); }}>
          
          {/* LIBRARY TITLE & BACK BUTTON */}
          <div className="flex items-center gap-4 mb-8">
            {view === 'library' && (
              <button 
                onClick={() => setView('discover')}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-indigo-400 transition-all border border-white/5 group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            <h2 className="text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">
              {view === 'discover' ? 'Discover' : 'Library'}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="bg-white/[0.03] p-4 rounded-2xl hover:bg-white/[0.07] transition-all group border border-white/5 relative hover:border-indigo-500/30">
                
                {/* Image */}
                <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
                  <img src={track.album?.cover_medium || track.albumArt} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <button className="absolute inset-0 m-auto w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg">
                    <Play size={24} fill="white" className="ml-1" />
                  </button>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="truncate flex-1">
                      <h3 className="font-bold truncate text-zinc-100 group-hover:text-white">{track.title}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{track.artist?.name || track.artist}</p>
                    </div>
                  </div>

                  {/* BUTTONS BAR - ΠΑΝΤΑ ΟΡΑΤΑ */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    
                    {/* ΤΕΛΙΕΣ (Menu) */}
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                        className={`p-1 transition-colors ${activeMenu === track.id ? 'text-indigo-400' : 'text-zinc-600 hover:text-indigo-400'}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenu === track.id && (
                        <div className="absolute bottom-full left-0 mb-3 w-48 bg-[#0d0d1a] border border-white/10 rounded-xl shadow-2xl z-[100] p-1 backdrop-blur-xl">
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-lg">
                            <Gauge size={14} /> Ταχύτητα Αναπαραγωγής
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-lg">
                            <Download size={14} /> Λήψη Τραγουδιού
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ΚΑΡΔΙΑ */}
                    <button onClick={() => toggleFavorite(track)} className="p-1 transition-transform hover:scale-125">
                      <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-600 hover:text-zinc-400"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {activeMenu && <div className="fixed inset-0 z-[80]" onClick={() => setActiveMenu(null)} />}
    </div>
  );
};

export default MusicApp;
