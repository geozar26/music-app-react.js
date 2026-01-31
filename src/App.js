
import React, { useState, useRef } from 'react';
import { Search, Play, Heart, Clock, Music } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());

  // Queries από τη βάση
  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];
  const searches = useLiveQuery(() => db.searches.orderBy("id").reverse().limit(8).toArray()) || [];

  const searchTracks = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await db.searches.add({ query: searchQuery.trim(), timestamp: Date.now() });
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
      setIsPlaying(!isPlaying);
      return;
    }
    audioRef.current.src = track.preview;
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);
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
    <div className="flex h-screen bg-black text-white font-sans">
      
      {/* SIDEBAR - Εδώ μπαίνουν όλα */}
      <aside className="w-72 bg-black border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-white font-black text-2xl tracking-tighter flex items-center gap-2 mb-8">
            <Music className="text-green-500" /> BEATSTREAM
          </h1>

          {/* ΠΡΟΣΦΑΤΑ ΑΝΑΖΗΤΗΣΕΙΣ */}
          <div className="mb-10">
            <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} /> Πρόσφατα
            </h2>
            <div className="space-y-2">
              {searches.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => { setSearchQuery(s.query); searchTracks(); }}
                  className="bg-zinc-900/50 p-2 rounded text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer truncate transition"
                >
                  {s.query}
                </div>
              ))}
            </div>
          </div>

          {/* ΑΓΑΠΗΜΕΝΑ */}
          <div>
            <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart size={14} /> Αγαπημένα
            </h2>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {favorites.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <img src={track.albumArt} alt="" className="w-10 h-10 rounded-md object-cover" />
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate group-hover:text-green-500 transition">
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        
        {/* TOP SEARCH BAR */}
        <header className="p-4 flex justify-center items-center">
          <form onSubmit={searchTracks} className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              className="w-full bg-zinc-900 rounded-full py-2.5 px-12 border border-zinc-800 focus:border-green-500 outline-none transition"
              placeholder="Τι θέλετε να ακούσετε;"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </header>

        {/* TRACKS GRID */}
        <section className="flex-1 overflow-y-auto p-8">
          <h2 className="text-3xl font-bold mb-6">Discover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-zinc-900/40 p-4 rounded-xl hover:bg-zinc-900 transition-colors group">
                <div className="relative mb-4">
                  <img src={track.album.cover_medium} alt="" className="w-full aspect-square rounded-lg shadow-2xl" />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute bottom-2 right-2 bg-green-500 p-3 rounded-full text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play size={20} fill="black" />
                  </button>
                </div>
                <div className="flex justify-between items-start">
                  <div className="truncate pr-2">
                    <h3 className="font-bold text-sm truncate">{track.title}</h3>
                    <p className="text-xs text-zinc-400 truncate">{track.artist.name}</p>
                  </div>
                  <button onClick={() => toggleFavorite(track)}>
                    <Heart 
                      size={20} 
                      className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-600"} 
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MusicApp;
