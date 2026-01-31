import React, { useState, useEffect, useRef } from 'react';
// Αφαιρέθηκαν τα αχρησιμοποίητα ChevronLeft, ChevronRight για να περάσει το build της Vercel
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

  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];
  const history = useLiveQuery(() => db.history.orderBy('timestamp').reverse().limit(20).toArray()) || [];

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
          'x-rapidapi-key': 'ΣΥΜΠΛΗΡΩΣΕ_ΤΟ_KEY_ΣΟΥ', // Βάλε το δικό σου key εδώ
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

    audioRef.current.src = track.preview;
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);

    await db.history.put({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      albumArt: track.album.cover_medium,
      preview: track.preview,
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
        artist: track.artist.name,
        albumArt: track.album.cover_medium,
        preview: track.preview
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      {/* Search Bar */}
      <form onSubmit={searchTracks} className="max-w-2xl mx-auto mb-8 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Αναζήτηση τραγουδιών..."
          className="w-full bg-zinc-900 border-none rounded-full py-3 px-12 focus:ring-2 focus:ring-green-500"
        />
        <Search className="absolute left-4 top-3 text-zinc-400" size={20} />
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Results */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Αποτελέσματα</h2>
          <div className="space-y-2">
            {tracks.map(track => (
              <div key={track.id} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg hover:bg-zinc-800 transition">
                <div className="flex items-center gap-4">
                  <img src={track.album.cover_small} alt={track.title} className="w-12 h-12 rounded" />
                  <div>
                    <div className="font-medium">{track.title}</div>
                    <div className="text-sm text-zinc-400">{track.artist.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleFavorite(track)}>
                    <Heart size={20} className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-400"} />
                  </button>
                  <button onClick={() => playTrack(track)} className="bg-green-500 rounded-full p-2">
                    {currentTrack?.id === track.id && isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Favorites & History */}
        <div className="space-y-8">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-green-500">
              <Heart size={20} /> Αγαπημένα
            </h2>
            <div className="space-y-2">
              {favorites.map(track => (
                <div key={track.id} className="flex items-center gap-3 bg-zinc-900/30 p-2 rounded">
                  <img src={track.albumArt} className="w-10 h-10 rounded" alt="" />
                  <div className="text-sm truncate flex-1">{track.title}</div>
                  <button onClick={() => playTrack(track)}><Play size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-blue-500">
              <History size={20} /> Ιστορικό
            </h2>
            <div className="space-y-2">
              {history.map(track => (
                <div key={`${track.id}-${track.timestamp}`} className="flex items-center gap-3 bg-zinc-900/30 p-2 rounded">
                  <img src={track.albumArt} className="w-10 h-10 rounded" alt="" />
                  <div className="text-sm truncate flex-1">{track.title}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Player Bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={currentTrack.album.cover_medium} alt="" className="w-14 h-14 rounded shadow-lg" />
              <div>
                <div className="font-bold">{currentTrack.title}</div>
                <div className="text-sm text-zinc-400">{currentTrack.artist.name}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                <button className="text-zinc-400 hover:text-white"><SkipBack /></button>
                <button onClick={() => playTrack(currentTrack)} className="bg-white text-black rounded-full p-3 hover:scale-105 transition">
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                <button className="text-zinc-400 hover:text-white"><SkipForward /></button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-zinc-400">
              <Volume2 size={20} />
              <div className="w-24 h-1 bg-zinc-700 rounded-full">
                <div className="w-2/3 h-full bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
