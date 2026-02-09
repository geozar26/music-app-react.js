import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History, X, Download, Zap, 
  Music2, Music3, Trash2
} from 'lucide-react';
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover'); 
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef(new Audio());
  const searchRef = useRef(null);
  const progressBarRef = useRef(null);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
    const savedHist = JSON.parse(localStorage.getItem('beatstream_history')) || [];
    setFavorites(savedFavs);
    setSearchHistory(savedHist);
    fetchTrending();

    const audio = audioRef.current;
    const updateTime = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
    };
    const updateDuration = () => setDuration(audio.duration || 0);
    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleEnded = () => {
      const currentList = view === 'library' ? favorites : tracks;
      const currentIndex = currentList.findIndex(t => t.id === playingTrack?.id);
      if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
        const nextTrack = currentList[currentIndex + 1];
        audioRef.current.src = nextTrack.preview;
        setPlayingTrack(nextTrack);
        audioRef.current.play();
      }
    };
    audioRef.current.onended = handleEnded;
  }, [playingTrack, tracks, favorites, view]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrub(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) handleScrub(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScrub = (e) => {
    if (!audioRef.current || !duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercentage = x / rect.width;
    const newTime = newPercentage * duration;
    
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
