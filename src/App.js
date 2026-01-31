import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Heart, Clock, Music, Pause } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());

  // Queries από τη βάση - Προσθήκη default τιμών [] για αποφυγή σφαλμάτων
  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];
  const searches = useLiveQuery(() => db.searches.orderBy("id").reverse().limit(6).toArray()) || [];

  // Καθαρισμός audio event listeners
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
    const query = searchQuery.trim();
    if (!query) return;

    try {
      // Αποθήκευση στο ιστορικό
      await db.searches.add({ query: query, timestamp: Date.now() });
      
      const response = await axios.get("https://deezerdevs-deezer.p.rapidapi.com/search", {
        params: { q: query },
        headers: {
          'x-rapidapi-key': 'ΣΥΜΠΛΗΡΩΣΕ_ΤΟ_ΚΛΕΙΔΙ_ΣΟΥ', // ΠΡΟΣΟΧΗ: Βάλε το δικό σου κλειδί εδώ
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
    <div className="flex h-screen bg-black text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 text-green-500 mb-10">
            <Music size={28} strokeWidth={3} />
            <h1 className="font-black text-xl tracking-tighter italic text-white">BEATSTREAM</h1>
          </div>

          {/* ΠΡΟΣΦΑΤΑ (ΙΣΤΟΡΙΚΟ) */}
          <div className="mb-10">
            <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-4 flex items-center gap-2">
              <Clock size={12} className="text-green-500" /> Πρόσφατα
            </h2>
            <div className="space-y-1">
              {searches.map((s) => (
                <button 
                  key={s.id}
                  onClick={() => { setSearchQuery(s.query); }}
                  className="w-full text-left p-2 rounded text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white truncate transition"
                >
                  {s.query}
                </button>
              ))}
            </div>
          </div>

          {/* ΑΓΑΠΗΜΕΝΑ */}
          <div className="flex-1 overflow-hidden">
            <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[2px] mb-4 flex items-center gap-2">
              <Heart size={12} className="text-green-500" /> Αγαπημένα
            </h2>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {favorites.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <img src={track.albumArt} alt="" className="w-8 h-8 rounded object-cover shadow-lg" />
                  <div className="flex-1 truncate">
                    <p className="text-[13px] font-medium truncate group-hover:text-green-500 transition">{track.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col bg-zinc-900/20">
        
        {/* TOP BAR */}
        <header className="p-4 flex justify-center items-center bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <form onSubmit={searchTracks} className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              className="w-full bg-zinc-800/50 rounded-full py-2.5 px-12 border border-zinc-700/50 focus:border-green-500 outline-none transition text-sm"
              placeholder="Αναζήτηση μουσικής..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </header>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto p-8">
          <h2 className="text-2xl font-bold mb-6">Discover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-zinc-900/60 p-4 rounded-xl hover:bg-zinc-800 transition-all group relative border border-white/5 shadow-xl">
                <div className="relative mb-4 aspect-square">
                  <img src={track.album.cover_medium} alt="" className="w-full h-full rounded-lg object-cover shadow-2xl" />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute bottom-2 right-2 bg-green-500 p-3 rounded-full text-black shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  >
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                  </button>
                </div>
                
                <div className="flex justify-between items-start gap-2">
                  <div className="truncate">
                    <h3 className="font-bold text-sm truncate">{track.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">{track.artist.name}</p>
                  </div>
                  <button onClick={() => toggleFavorite(track)} className="shrink-0 pt-1 transition-transform active:scale-125">
                    <Heart 
                      size={18} 
                      className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-600 hover:text-zinc-400"} 
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
