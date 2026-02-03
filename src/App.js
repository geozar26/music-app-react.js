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
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setView('discover')}>
            <Music className="text-indigo-500" size={24} />
            <span className="font-black text-xl tracking-tighter uppercase italic">Beatstream</span>
          </div>
          <button 
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === 'library' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="font-bold uppercase tracking-widest text-[11px]">Library</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#0d0d1a] relative">
        
        {/* HEADER */}
        <header className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/5 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* ΕΠΑΓΓΕΛΜΑΤΙΚΟ ΚΟΥΜΠΙ ΕΠΙΣΤΡΟΦΗΣ */}
            {view === 'library' && (
              <button 
                onClick={() => setView('discover')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-indigo-400 transition-all group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
              </button>
            )}

            <div className="flex-1 max-w-md relative">
              <form onSubmit={searchTracks} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text"
                  className="w-full bg-white/5 rounded-lg py-2 pl-10 pr-4 border border-white/10 focus:border-indigo-500/50 outline-none"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          </div>

          <div className="flex items-center gap-6 ml-4">
            <button className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest">Install</button>
            <button className="bg-indigo-600 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">Sign Up</button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setActiveMenu(null)}>
          <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter italic">
            {view === 'discover' ? 'Discover' : 'Library'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="group relative bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all">
                
                {/* IMAGE CONTAINER */}
                <div className="relative aspect-square mb-4 rounded-xl overflow-hidden shadow-xl">
                  <img src={track.album?.cover_medium || track.albumArt} alt="" className="w-full h-full object-cover" />
                  
                  {/* OVERLAY BUTTONS ON IMAGE */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <Play size={20} fill="white" />
                    </button>
                  </div>

                  {/* ΟΙ ΤΡΕΙΣ ΤΕΛΕΙΕΣ - ΠΑΝΩ ΑΡΙΣΤΕΡΑ ΣΤΗΝ ΕΙΚΟΝΑ ΓΙΑ ΝΑ ΦΑΙΝΟΝΤΑΙ ΠΑΝΤΑ */}
                  <div className="absolute top-2 left-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }}
                      className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-indigo-400 border border-white/10 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenu === track.id && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[#12121a] border border-white/10 rounded-xl shadow-2xl z-[100] p-1 overflow-hidden">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase text-zinc-300 hover:bg-indigo-500 hover:text-white rounded-lg transition-all">
                          <Gauge size={14} /> Ταχύτητα Αναπαραγωγής
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase text-zinc-300 hover:bg-indigo-500 hover:text-white rounded-lg transition-all">
                          <Download size={14} /> Λήψη Τραγουδιού
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Η ΚΑΡΔΙΑ - ΠΑΝΩ ΔΕΞΙΑ ΣΤΗΝ ΕΙΚΟΝΑ */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10"
                  >
                    <Heart size={16} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-white"} />
                  </button>
                </div>

                {/* INFO */}
                <div className="truncate">
                  <h3 className="font-bold text-sm truncate">{track.title}</h3>
                  <p className="text-[11px] text-zinc-500 truncate">{track.artist?.name || track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* GLOBAL CLICK OVERLAY */}
      {activeMenu && <div className="fixed inset-0 z-[90]" onClick={() => setActiveMenu(null)} />}
    </div>
  );
};

export default MusicApp;
