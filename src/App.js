import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Play, Heart, Music, Library as LibraryIcon,
  X, MoreVertical, Download, Gauge, ChevronLeft, Pause
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover');
  const [showHistory, setShowHistory] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(
    () => db.searches?.orderBy('timestamp').reverse().toArray()
  ) || [];

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => setPlayingTrack(null);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    const fetchDefault = async () => {
      try {
        const res = await axios.get(
          "https://deezerdevs-deezer.p.rapidapi.com/search?q=top-hits",
          {
            headers: {
              'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
              'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
            }
          }
        );
        setTracks(res.data.data || []);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };

    fetchDefault();

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  // ✅ ΜΟΝΗ ΛΟΓΙΚΗ ΑΛΛΑΓΗ
  const handlePlay = (track) => {
    if (!track.preview) return; // ⛔ χωρίς preview δεν παίζει

    const audio = audioRef.current;

    if (playingTrack?.id === track.id) {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
        setPlayingTrack(null);
      }
    } else {
      audio.pause();
      audio.src = track.preview.replace(/^http:\/\//, 'https://');
      audio.load();
      audio.play()
        .then(() => setPlayingTrack(track))
        .catch(() => {});
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
        const exists = await db.searches
          .where('query')
          .equals(q.toLowerCase())
          .count();

        if (!exists) {
          await db.searches.add({
            query: q.toLowerCase(),
            timestamp: Date.now()
          });
        }
      }

      const response = await axios.get(
        `https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`,
        {
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        }
      );

      setTracks(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans text-sm relative">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 flex flex-col h-full">
          <div
            className="flex items-center gap-2 mb-10 px-2 cursor-pointer"
            onClick={() => setView('discover')}
          >
            <Music className="text-indigo-500" size={24} />
            <span className="font-black text-xl tracking-tighter uppercase italic bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Beatstream
            </span>
          </div>

          <button
            onClick={() => setView('library')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === 'library'
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LibraryIcon size={20} />
            <span className="font-black uppercase tracking-widest text-[11px]">
              Library
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-[#0d0d1a] to-[#020205] relative pb-24">

        <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5 z-50">
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={searchTracks} className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                className="w-full bg-white/5 rounded-xl py-2 px-10 border border-white/10 outline-none"
                placeholder="Search..."
                value={searchQuery}
                onFocus={() => setShowHistory(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl z-[60] p-2">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer group"
                    onClick={() => {
                      setSearchQuery(item.query);
                      searchTracks(null, item.query);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Search size={14} className="text-zinc-500" />
                      <span className="text-zinc-300">{item.query}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        db.searches.delete(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg">
            Sign Up
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto p-8"
          onClick={() => {
            setShowHistory(false);
            setActiveMenu(null);
          }}
        >
          <div className="flex items-center gap-4 mb-8">
            {view === 'library' && (
              <button
                onClick={() => setView('discover')}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-indigo-400 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">
              {view === 'discover' ? 'Discover' : 'Library'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div
                key={track.id}
                className="bg-white/[0.03] p-4 rounded-2xl group border border-white/5 relative hover:bg-white/[0.07] transition-all"
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
                  <img
                    src={track.album?.cover_medium || track.albumArt}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <button
                    onClick={() => handlePlay(track)}
                    className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                  >
                    {playingTrack?.id === track.id
                      ? <Pause size={20} fill="white" />
                      : <Play size={20} fill="white" className="ml-1" />}
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="truncate flex-1 pr-2">
                    <h3 className="font-bold truncate text-zinc-100">
                      {track.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {track.artist?.name || track.artist}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === track.id ? null : track.id);
                        }}
                        className="p-1 text-zinc-600 hover:text-indigo-400"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenu === track.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0d0d1a] border border-white/10 rounded-xl shadow-2xl z-[100] p-1 backdrop-blur-xl">
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-lg">
                            <Gauge size={14} /> Ταχύτητα Ήχου
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase text-zinc-400 hover:bg-white/5 hover:text-indigo-400 rounded-lg">
                            <Download size={14} /> Λήψη Τραγουδιού
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        favorites.some(f => f.id === track.id)
                          ? db.favorites.delete(track.id)
                          : db.favorites.add({
                              id: track.id,
                              title: track.title,
                              artist: track.artist?.name || track.artist,
                              albumArt: track.album?.cover_medium || track.albumArt,
                              preview: track.preview
                            });
                      }}
                      className="p-1"
                    >
                      <Heart
                        size={18}
                        className={
                          favorites.some(f => f.id === track.id)
                            ? "fill-red-500 text-red-500"
                            : "text-zinc-700"
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#080810]/95 backdrop-blur-2xl border-t border-white/10 px-6 py-4 z-[100] flex items-center gap-6">
            <div className="flex items-center gap-4 w-72 shrink-0">
              <img
                src={playingTrack.album?.cover_medium || playingTrack.albumArt}
                className="w-12 h-12 rounded-lg"
                alt=""
              />
              <div className="truncate">
                <div className="font-bold text-sm truncate">
                  {playingTrack.title}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase">
                  {playingTrack.artist?.name || playingTrack.artist}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 w-full">
                <span className="text-[10px] font-mono text-zinc-500">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-500"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="w-72 flex justify-end">
              <button
                onClick={() => handlePlay(playingTrack)}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all"
              >
                <Pause size={20} fill="black" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;

