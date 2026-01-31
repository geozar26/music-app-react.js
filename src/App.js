
import React, { useState, useRef } from 'react';
import { Search, Play, Heart } from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const audioRef = useRef(new Audio());

  const favorites =
    useLiveQuery(() => db.favorites.toArray()) || [];

  const searches =
    useLiveQuery(() =>
      db.searches.orderBy("id").reverse().limit(5).toArray()
    ) || [];

  const searchTracks = async (e) => {
    e.preventDefault();

    // 🔴 DEBUG
    console.log("SEARCH SUBMIT", searchQuery);

    if (searchQuery.trim()) {
      await db.searches.add({ query: searchQuery.trim() });
      console.log("SAVED TO DB");
    }

    try {
      const response = await axios.get(
        "https://deezerdevs-deezer.p.rapidapi.com/search",
        {
          params: { q: searchQuery },
          headers: {
            'x-rapidapi-key': 'ΒΑΛΕ_ΕΔΩ_ΤΟ_ΚΛΕΙΔΙ_ΣΟΥ',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        }
      );

      setTracks(response.data.data || []);
      setShowHistory(false);
    } catch (error) {
      console.error(error);
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
    <div className="flex h-screen bg-black text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col p-4">
        <h1 className="text-green-500 font-bold mb-8 px-2 tracking-tighter italic text-2xl">
          BEATSTREAM
        </h1>

        <h2 className="text-xs font-bold text-zinc-500 mb-4 px-2 uppercase">
          Αγαπημένα Τραγούδια
        </h2>

        <div className="flex-1 overflow-y-auto">
          {favorites.map(track => (
            <div
              key={track.id}
              onClick={() => playTrack(track)}
              className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer transition"
            >
              <img src={track.albumArt} className="w-8 h-8 rounded" alt="" />
              <div className="flex-1 truncate text-sm">
                {track.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">

        {/* SEARCH */}
        <header className="p-4 flex justify-center">
          <form
            onSubmit={searchTracks}
            className="w-full max-w-lg relative"
          >
            <Search
              className="absolute left-4 top-2.5 text-zinc-400"
              size={18}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(true)}
              placeholder="Αναζήτηση..."
              className="w-full bg-zinc-800 rounded-full py-2 px-12 border-none"
            />

            {showHistory && searches.length > 0 && (
              <div className="absolute top-12 w-full bg-zinc-900 rounded-xl shadow-lg z-20">
                {searches.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSearchQuery(s.query);
                      setShowHistory(false);
                    }}
                    className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm"
                  >
                    {s.query}
                  </div>
                ))}
              </div>
            )}
          </form>
        </header>

        {/* RESULTS */}
        <
