import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, SkipForward, SkipBack, Heart, History, Volume2, Music2 } from 'lucide-react';
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

  // Ανάκτηση Αγαπημένων και Ιστορικού από τη βάση Dexie
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
      
      {/* --- ΑΡΙΣΤΕΡΗ ΜΠΑΡΑ (SIDEBAR) - ΕΔΩ ΑΠΟΘΗΚΕΥΟΝΤΑΙ ΤΑ ΤΡΑΓΟΥΔΙΑ ΜΕ ΤΗΝ ΚΑΡΔΙΑ --- */}
      <div className="w-64 bg-zinc-950 flex flex-col border-r border-zinc-900 hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold text-green-500 flex items-center gap-2">
            <Music2 /> BEATSTREAM
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
             <Heart size={14} className="fill-green-500 text-green-500" /> ΑΓΑΠΗΜΕΝΑ
          </h2>
          
          <div className="space-y-1">
            {favorites.length === 0 ? (
              <p className="text-zinc-600 text-xs px-2 italic">Πατήστε την καρδιά σε ένα τραγούδι.</p>
            ) : (
              favorites.map(track => (
                <div 
                  key={track.id} 
                  className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900 cursor-pointer transition"
                  onClick={() => playTrack(track)}
                >
                  <img src={track.albumArt} className="w-8 h-8 rounded" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-8 mb-4 px-2 flex items-center gap-2">
             <History size={14} /> ΠΡΟΣΦΑΤΑ
          </h2>
          <div className="space-y-1 opacity-60">
            {history.map(item => (
              <div key={item.id + item.timestamp} className="text-xs px-2 truncate py-1 text-zinc-400">
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ΚΥΡΙΩΣ ΠΕΡΙΕΧΟΜΕΝΟ --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
        <header className="p-4 flex justify-center bg-black/20">
          <form onSubmit={searchTracks} className="w-full max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Αναζήτηση..."
              className="w-full bg-zinc-800 border-none rounded-full py-2 px-12 focus:ring-1 focus:ring-green-500 text-sm"
            />
          </form>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-800 to-black">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {tracks.map(track => (
              <div key={track.id} className="bg-zinc-900/60 p-4 rounded-lg group relative">
                <img src={track.album.cover_medium} className="w-full rounded-md mb-3" alt="" />
                <h3 className="text-sm font-bold truncate">{track.title}</h3>
                <p className="text-xs text-zinc-400 mb-3">{track.artist.name}</p>
                <div className="flex justify-between items-center">
                   <button onClick={() => toggleFavorite(track)}>
                    <Heart size={20} className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-500"} />
                  </button>
                  <button onClick={() => playTrack(track)} className="bg-green-500 text-black p-2 rounded-full">
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* --- PLAYER BAR (ΚΑΤΩ) --- */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 w-1/3">
            <img src={currentTrack.album?.cover_medium || currentTrack.albumArt} className="w-12 h-12 rounded" alt="" />
            <div className="truncate"><div className="text-sm font-bold">{currentTrack.title}</div></div>
          </div>
          <button onClick={() => playTrack(currentTrack)} className="bg-white text-black p-3 rounded-full"><Pause /></button>
          <div className="w-1/3 flex justify-end items-center gap-2"><Volume2 size={18}/><div className="w-20 h-1 bg-zinc-700 rounded-full"></div></div>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
