
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

  // 🔧 ΜΟΝΗ ΑΛΛΑΓΗ: HTTP → HTTPS
  const handlePlay = (track) => {
    const audio = audioRef.current;

    if (playingTrack?.id === track.id) {
      if (audio.paused) {
        audio.play().catch(e => console.log("Playback failed:", e));
      } else {
        audio.pause();
        setPlayingTrack(null);
      }
    } else {
      audio.pause();
      audio.src = track.preview.replace('http://', 'https://');
      audio.load();
      audio.play()
        .then(() => setPlayingTrack(track))
        .catch(e => console.log("Playback failed:", e));
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
      {/* ΟΛΟ ΤΟ UI ΣΟΥ ΜΕΝΕΙ ΑΚΡΙΒΩΣ ΙΔΙΟ */}
      {/* ... */}
    </div>
  );
};

export default MusicApp;
