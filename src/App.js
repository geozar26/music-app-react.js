import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Heart, Music, Pause, Trash2 } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());

  // Παίρνουμε μόνο τα Αγαπημένα από τη βάση
  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];

  useEffect(() => {
    const audio = audioRef.current;
    const setPlay = () => setIsPlaying(true);
    const setPause = () => setIsPlaying(false);
    audio.addEventListener('play', setPlay);
    audio.addEventListener('pause', setPause);
    audio.addEventListener('ended', setPause);
    return () => {
      audio.removeEventListener('play', setPlay);
      audio.removeEventListener('pause', setPause);
      audio.removeEventListener('ended', setPause);
    };
  }, []);

  const searchTracks = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
        params: { q: searchQuery },
        headers: {
          'x-rapidapi-key': 'ΒΑΛΕ_ΕΔΩ_ΤΟ_ΚΛΕΙΔΙ_ΣΟΥ',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const playTrack = (track) => {
    if (!track.preview) return;
    if (currentTrack?.id === track.id) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    } else {
      audioRef.current.src = track.preview;
      audioRef.current.play();
      setCurrentTrack(track);
    }
  };

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      await db.favorites.delete(track.id);
    } else {
      await db.favorites.put({
        id: track.id,
        title: track.title,
        artist: track.artist?.name || track.artist,
        albumArt: track.album?.cover_medium || track.albumArt,
        preview: track.preview
      });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* SIDEBAR - ΤΩΡΑ ΜΟΝΟ ΜΕ ΑΓΑΠΗΜΕΝΑ */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 text-green-500 mb-10">
            <Music size={28} />
            <h1 className="font-black text-xl tracking-tighter italic text-white uppercase">Beatstream</h1>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart size={14} className="text-red-500 fill-red-500" /> Τα Αγαπημένα μου
            </h2>
            
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {favorites.length === 0 ? (
                <div className="text-zinc-600 text-xs py-4 text-center border border-dashed border-zinc-800 rounded-lg">
                  Δεν έχεις προσθέσει <br/> τραγούδια ακόμα.
                </div>
              ) : (
                favorites.map((track) => (
                  <div 
                    key={track.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition group cursor-pointer"
                  >
                    <div className="relative w-10 h-10 shrink-0" onClick={() => playTrack(track)}>
                      <img src={track.albumArt} alt="" className="w-full h-full rounded object-cover" />
                      {currentTrack?.id === track.id && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 truncate" onClick={() => playTrack(track)}>
                      <p className="text-[13px] font-medium truncate group-hover:text-green-500 transition">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                    </div>

                    <button 
                      onClick={() => db.favorites.delete(track.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-500 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-zinc-900/20">
        <header className="p-4 flex justify-center items-center bg-black/40 backdrop-blur-md border-b border-white/5">
          <form onSubmit={searchTracks} className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              className="w-full bg-zinc-800/40 rounded-full py-2.5 px-12 border border-zinc-700/50 focus:border-green-500 outline-none transition text-sm"
              placeholder="Αναζήτησε τραγούδια..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <h2 className="text-2xl font-bold mb-6">Discover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-zinc-900/40 p-4 rounded-xl hover:bg-zinc-900/80 transition-all group border border-white/5">
                <div className="relative mb-4 aspect-square">
                  <img src={track.album.cover_medium} alt="" className="w-full h-full rounded-lg object-cover" />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute bottom-2 right-2 bg-green-500 p-3 rounded-full text-black shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                  </button>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div className="truncate">
                    <h3 className="font-bold text-sm truncate">{track.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">{track.artist.name}</p>
                  </div>
                  <button onClick={() => toggleFavorite(track)}>
                    <Heart 
                      size={20} 
                      className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-600 hover:text-white"} 
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MusicApp;
// test change for vercel build