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

  // ✅ ΟΧΙ new Audio()
  const audioRef = useRef(null);

  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(
    () => db.searches?.orderBy('timestamp').reverse().toArray()
  ) || [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
        console.error(e);
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

  // ✅ ΔΟΥΛΕΥΕΙ ΣΕ ΟΛΟΥΣ ΤΟΥΣ BROWSERS
  const handlePlay = (track) => {
    if (!track.preview) return;

    const audio = audioRef.current;
    if (!audio) return;

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

      const res = await axios.get(
        `https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`,
        {
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        }
      );

      setTracks(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (t) => {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

        {/* … ΟΛΟ ΤΟ ΥΠΟΛΟΙΠΟ J*


