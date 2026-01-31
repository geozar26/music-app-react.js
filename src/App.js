
import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Heart, Music2, Volume2 } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  const favorites = useLiveQuery(() => db.favorites.toArray()) || [];

  const searchTracks = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search`, {
        params: { q: searchQuery },
        headers: {
          'x-rapidapi-key': 'ΒΑΛΕ_ΤΟ_ΚΛΕΙΔΙ_ΣΟΥ_ΕΔΩ',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(response.data.data || []);
    } catch (error) { console.error(error); }
  };

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
      return;
    }
    audioRef.current.src = track.preview || track.link;
    audioRef.current.play();
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) { await db.favorites.delete(track.id); } 
    else { 
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
    <div className="flex h-screen bg-black text-white">
      {/* ΕΔΩ ΕΙΝΑΙ Η ΑΛΛΑΓΗ: Η SIDEBAR ΔΕΙΧΝΕΙ ΤΑ ΤΡΑΓΟΥΔΙΑ ΜΕ ΚΑΡΔΙΑ */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col p-4">
        <h1 className="text-green-500 font-bold mb-8 flex items-center gap-2 px-2"><Music2 /> BEATSTREAM</h1>
        <h2 className="text-xs font-bold text-zinc-500 mb-4 px-2 tracking-widest uppercase">ΑΓΑΠΗΜΕΝΑ ΤΡΑΓΟΥΔΙΑ</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {favorites.map(track => (
            <div key={track.id} onClick={() => playTrack(track)} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer group transition">
              <img src={track.albumArt} className="w-8 h-8 rounded" alt="" />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
        <header className="p-4 flex justify-center">
          <form onSubmit={searchTracks} className="w-full max-w-lg relative">
            <Search className="absolute left-4 top-2.5 text-zinc-400" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Αναζήτηση..." className="w-full bg-zinc-800 rounded-full py-2 px-12 border-none focus:ring-1 focus:ring-green-500" />
          </form>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-800 to-black">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {tracks.map(track => (
              <div key={track.id} className="bg-zinc-900/40 p-4 rounded-xl relative group">
                <img src={track.album.cover_medium} className="w-full aspect-square rounded-lg mb-3" alt="" />
                <h3 className="text-sm font-bold truncate">{track.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <button onClick={() => toggleFavorite(track)}>
                    <Heart size={20} className={favorites.some(f => f.id === track.id) ? "fill-green-500 text-green-500" : "text-zinc-500"} />
                  </button>
                  <button onClick={() => playTrack(track)} className="bg-green-500 text-black p-2 rounded-full"><Play size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MusicApp;
