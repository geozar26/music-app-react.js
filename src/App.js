import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, SkipForward, SkipBack, Heart, History, Volume2, Music2, ListMusic } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(new Audio());

  // Σύνδεση με τη βάση δεδομένων για Αγαπημένα και Ιστορικό
  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];
  const history = useLiveQuery(() => db.history.orderBy('timestamp').reverse().limit(10).toArray()) || [];

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const searchTracks = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const response = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search`, {
        params: { q: searchQuery },
        headers: {
          'x-rapidapi-key': 'ΣΥΜΠΛΗΡΩΣΕ_ΤΟ_KEY_ΣΟΥ', 
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    audioRef.current.src = track.preview || track.link; 
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);

    await db.history.put({
      id: track.id,
      title: track.title,
      artist: track.artist.name || track.artist,
      albumArt: track.album?.cover_medium || track.albumArt,
      preview: track.preview || track.link,
      timestamp: Date.now()
    });
  };

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      await db.favorites.delete(track.id);
    } else {
      await db.favorites.put({
        id: track.id,
        title: track.title,
        artist: track.artist.name || track.artist,
        albumArt: track.album?.cover_medium || track.albumArt,
        preview: track.preview || track.link
      });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      
      {/* --- ΑΡΙΣΤΕΡΗ ΜΠΑΡΑ (SIDEBAR) --- */}
      <div className="w-72 bg-zinc-950 flex flex-col border-r border-zinc-900 hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-black text-green-500 tracking-tighter flex items-center gap-2">
            <Music2 /> BEATSTREAM
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4">
          <div className="mb-8">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">
              Τα Αγαπημένα σου
            </h2>
            <div className="space-y-1">
              {favorites.length === 0 ? (
                <p className="text-zinc-600 text-xs px-2">Καρδιά σε ένα τραγούδι για να φανεί εδώ.</p>
              ) : (
                favorites.map(track => (
                  <div 
                    key={track.id} 
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900 cursor-pointer transition"
                    onClick={() => playTrack(track)}
                  >
                    <img src={track.albumArt} className="w-10 h-10 rounded shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                    </div>
                    <button className="text-green-500 opacity-0 group-hover:opacity-100 transition">
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* --- ΚΥΡΙΩΣ ΠΕΡΙΕΧΟΜΕΝΟ --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        
        {/* Search Bar (Πάνω) */}
        <header className="p-4 flex justify-center">
          <form onSubmit={searchTracks} className="w-full max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση στην BeatStream..."
              className="w-full bg-zinc-800/50 border-none rounded-full py-3 px-12 focus:ring-2 focus:ring-green-500 text-sm"
            />
          </form>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-3xl font-bold mb-6">Ανακάλυψη</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map(track => (
              <div key={track.id} className="bg-zinc-900/40 p-4 rounded-xl hover:bg-zinc-800/60 transition group relative">
                <div className="relative mb-4">
                  <img src={track.album.cover_medium} alt={track.title} className="w-full aspect-square object-cover rounded-lg shadow-lg" />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute bottom-2 right-2 bg-green-500 text-black p-3 rounded-full shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                  >
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                  </button>
                </div>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate text-sm mb-1">{track.title}</h3>
                    <p className="text-xs text-zinc-400 truncate">{track.artist.name}</p>
                  </div>
                  <button onClick={() => toggleFavorite(track)} className="ml-2">
                    <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-500 hover:text-white"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* --- PLAYER BAR (ΚΑΤΩ) --- */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 p-4 z-50">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentTrack.album?.cover_medium || currentTrack.albumArt} alt="" className="w-14 h-14 rounded-md shadow-2xl" />
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{currentTrack.title}</div>
                <div className="text-xs text-zinc-400 truncate">{currentTrack.artist.name || currentTrack.artist}</div>
              </div>
              <button onClick={() => toggleFavorite(currentTrack)}>
                <Heart size={16} className={favorites.some(f => f.id === currentTrack.id) ? "fill-green-500 text-green-500" : "text-zinc-400"} />
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-6">
                <button className="text-zinc-400 hover:text-white"><SkipBack size={20} /></button>
                <button onClick={() => playTrack(currentTrack)} className="bg-white text-black rounded-full p-2 hover:scale-105 transition">
                  {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
                </button>
                <button className="text-zinc-400 hover:text-white"><SkipForward size={20} /></button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-1/3 text-zinc-400">
              <Volume2 size={18} />
              <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-green-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
