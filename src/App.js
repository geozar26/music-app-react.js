import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Heart, Music, Library as LibraryIcon, MoreVertical, ChevronLeft, Pause, History, X, Download, Zap, Trash2, Menu, Plus, Upload, User, Lock } from 'lucide-react';
import axios from 'axios';

const MusicApp = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [view, setView] = useState('discover');
    const [playingTrack, setPlayingTrack] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [favorites, setFavorites] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [shouldShowSuggestions, setShouldShowSuggestions] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    const audioRef = useRef(new Audio());
    const searchRef = useRef(null);
    const progressBarRef = useRef(null);

    const API_CONFIG = {
        headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
    };

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("Η εφαρμογή είναι ήδη εγκατεστημένη ή δεν υποστηρίζεται.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleScrub(e);
    };

    const handleScrub = (e) => {
        if (!audioRef.current || !duration || !progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const newTime = (x / rect.width) * duration;
        setCurrentTime(newTime);
        audioRef.current.currentTime = newTime;
    };

    useEffect(() => {
        if (isDragging) {
            const onMouseMove = (e) => handleScrub(e);
            const onMouseUp = () => setIsDragging(false);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('touchend', onMouseUp);
            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('touchmove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('touchend', onMouseUp);
            };
        }
    }, [isDragging]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length > 0 && shouldShowSuggestions) {
                try {
                    const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${searchQuery}`, API_CONFIG);
                    setSuggestions(res.data.data?.slice(0, 6) || []);
                } catch (err) { console.error(err); }
            } else { setSuggestions([]); }
        };
        const timeoutId = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, shouldShowSuggestions]);

    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('beatstream_favs')) || [];
        const savedHist = JSON.parse(localStorage.getItem('beatstream_history')) || [];
        setFavorites(savedFavs);
        setSearchHistory(savedHist);
        fetchTrending();
        const audio = audioRef.current;
        const updateTime = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
        const updateDuration = () => setDuration(audio.duration || 0);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => {
            const currentList = view === 'library' ? favorites : tracks;
            const currentIndex = currentList.findIndex(t => t.id === playingTrack?.id);
            if (currentIndex !== -1 && currentList.length > 0) {
                const nextIndex = (currentIndex + 1) % currentList.length;
                const nextTrack = currentList[nextIndex];
                setPlayingTrack(nextTrack);
                audio.src = nextTrack.preview;
                audio.playbackRate = playbackRate;
                audio.play().catch(e => console.log("Auto-play error:", e));
                setIsPaused(false);
            }
        };
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [playingTrack, tracks, favorites, view, playbackRate]);

    const fetchTrending = async () => {
        try {
            const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=trending`, API_CONFIG);
            setTracks(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (e, queryOverride) => {
        if (e) e.preventDefault();
        const q = queryOverride || searchQuery;
        if (!q.trim()) return;
        setShouldShowSuggestions(false);
        setSuggestions([]);
        setIsSidebarOpen(false);
        try {
            const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, API_CONFIG);
            setTracks(res.data.data || []);
            setView('discover');
            const updatedHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 15);
            setSearchHistory(updatedHistory);
            localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
            setSearchQuery(q);
        } catch (err) { console.error(err); }
    };

    const removeHistoryItem = (e, itemToRemove) => {
        e.stopPropagation();
        const updatedHistory = searchHistory.filter(h => h !== itemToRemove);
        setSearchHistory(updatedHistory);
        localStorage.setItem('beatstream_history', JSON.stringify(updatedHistory));
    };

    const toggleFavorite = (track) => {
        const isLiked = favorites.some(f => f.id === track.id);
        const newF = isLiked ? favorites.filter(f => f.id !== track.id) : [track, ...favorites];
        setFavorites(newF);
        localStorage.setItem('beatstream_favs', JSON.stringify(newF));
    };

    const clearLibrary = () => {
        setFavorites([]);
        localStorage.removeItem('beatstream_favs');
    };

    const changeSpeed = (speed) => {
        setPlaybackRate(speed);
        audioRef.current.playbackRate = speed;
        setActiveMenu(null);
    };

    const handleNavClick = (newView) => {
        setView(newView);
        setIsSidebarOpen(false);
    };

    const currentList = view === 'library' ? favorites : tracks;

    return (
        <div className="flex w-full min-h-screen bg-[#020205] text-white font-sans select-none overflow-x-hidden" onClick={() => setActiveMenu(null)}>
            
            {/* LOGIN MODAL WITH CLICK-OUTSIDE TO CLOSE */}
            {isLoginOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 transition-all duration-300"
                    onClick={() => setIsLoginOpen(false)} // Closes on background click
                >
                    <div 
                        className="bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the form
                    >
                        <button onClick={() => setIsLoginOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-[#6366f1] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#6366f1]/20">
                                <Music size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Welcome Back</h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Enter your credentials</p>
                        </div>

                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#6366f1]/50 transition-all text-[11px] font-bold tracking-widest uppercase" />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input type="password" placeholder="PASSWORD" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#6366f1]/50 transition-all text-[11px] font-bold tracking-widest uppercase" />
                            </div>
                            
                            <button className="w-full bg-white text-black font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-[#6366f1] hover:text-white transition-all duration-300 shadow-lg mt-4">
                                Log In
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-[300] md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-[400] w-64 bg-black flex flex-col p-6 border-r border-white/5 h-screen transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0 md:shrink-0`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('discover')}>
                        <Music size={24} className="text-[#6366f1]" />
                        <span className="font-black text-xl italic tracking-tighter uppercase">Beatstream</span>
                    </div>
                    <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex flex-col gap-4 flex-1">
                    <button onClick={() => handleNavClick('library')} className={`flex items-center gap-3 transition-colors ${view === 'library' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <LibraryIcon size={16} />
                        <span className="font-bold text-[13px] tracking-widest uppercase">Library</span>
                    </button>
                    <button onClick={() => handleNavClick('history')} className={`flex items-center gap-3 transition-colors ${view === 'history' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <History size={16} />
                        <span className="font-bold text-[13px] tracking-widest uppercase">History</span>
                    </button>
                    
                    <button onClick={() => handleNavClick('discover')} className="mt-2 flex items-center justify-center gap-2 bg-white text-black py-2.5 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#6366f1] hover:text-white transition-all duration-300">
                        <Zap size={14} fill="currentColor" /> Explore
                    </button>

                    <div className="mt-6 mb-3 px-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Quick Access</span>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { name: '2026 Hits', query: '2026 hits', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&h=200&fit=crop', filter: 'hue-rotate-[280deg] brightness-75' },
                            { name: 'Lo-Fi', query: 'lofi', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=200&h=200&fit=crop', filter: 'hue-rotate-[150deg] brightness-75' },
                            { name: 'Trap', query: 'trap', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&h=200&fit=crop', filter: 'hue-rotate-[200deg] brightness-75' },
                            { name: 'Phonk', query: 'phonk', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&h=200&fit=crop', filter: 'hue-rotate-[100deg] brightness-75' }
                        ].map((cat) => (
                            <div key={cat.name} onClick={() => handleSearch(null, cat.query)} className="group relative h-20 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#6366f1]/50 transition-all duration-300">
                                <img src={cat.img} className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ${cat.filter}`} alt={cat.name} />
                                <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-tight text-white drop-shadow-xl">{cat.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 mb-6">
                        <button className="group flex items-center justify-between w-full bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                                    <Plus size={16} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-300 group-hover:text-white">Playlists</span>
                            </div>
                        </button>

                        <button className="group flex items-center gap-3 w-full bg-[#6366f1] hover:bg-[#4f46e5] p-3 rounded-xl transition-all duration-300 shadow-lg shadow-[#6366f1]/20">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                <Upload size={16} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Upload Music</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col w-full relative min-h-screen">
                <header className="p-3 md:p-6 flex items-center justify-between z-[200] bg-[#020205]/80 backdrop-blur-md sticky top-0 gap-2 md:gap-4">
                    <button className="md:hidden p-2 bg-white/5 rounded-xl text-zinc-400 shrink-0" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>

                    <div className="flex-1 min-w-0 max-w-2xl relative mr-2 md:mr-4" ref={searchRef}>
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input 
                            type="text" 
                            className="w-full bg-[#111111] rounded-2xl py-2 md:py-3 px-10 md:px-12 outline-none border border-white/5 focus:border-[#6366f1]/40 transition-all text-[14px] md:text-base" 
                            placeholder="Search..." 
                            value={searchQuery} 
                            onChange={(e) => { setSearchQuery(e.target.value); setShouldShowSuggestions(true); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                                <X size={16} />
                            </button>
                        )}

                        {suggestions.length > 0 && (
                            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[300] p-2">
                                {suggestions.map((track) => (
                                    <div key={track.id} onClick={() => handleSearch(null, track.title)} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                                        <img src={track.album.cover_small} className="w-10 h-10 rounded-lg" alt="" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-black text-white">{track.title}</span>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{track.artist.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-8 shrink-0 px-1">
                        <button onClick={handleInstallClick} className="text-white hover:text-[#6366f1] transition-colors font-black text-[9px] md:text-[11px] uppercase tracking-wider md:tracking-[0.2em] whitespace-nowrap shrink-0">
                            Install
                        </button>
                        <button onClick={() => setIsLoginOpen(true)} className="text-white hover:text-[#6366f1] transition-colors font-black text-[9px] md:text-[11px] uppercase tracking-wider md:tracking-[0.2em] whitespace-nowrap shrink-0">
                            Log In
                        </button>
                        <button className="bg-white text-black px-3 md:px-6 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-[11px] hover:bg-[#6366f1] hover:text-white transition-all uppercase tracking-wider md:tracking-[0.2em] whitespace-nowrap shrink-0">
                            Sign Up
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-10 flex-1">
                    <div className="flex items-end gap-6 mb-10 flex-wrap">
                        {view !== 'discover' && (
                            <button onClick={() => setView('discover')} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-[#6366f1] mb-2">
                                <ChevronLeft size={28} strokeWidth={3} />
                            </button>
                        )}
                        {/* ALIGNED HEADER TITLE */}
                        <h2 className="text-[40px] md:text-[60px] font-black italic tracking-tighter capitalize leading-none">
                            {view === 'library' ? 'My Library' : view === 'history' ? 'History' : 'Discover'}
                        </h2>
                        
                        {/* ONLY SHOW CLEAR ALL ON LIBRARY */}
                        {view === 'library' && favorites.length > 0 && (
                            <button onClick={clearLibrary} className="flex items-center gap-2 px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] rounded-full border border-[#6366f1]/20 text-[10px] font-black uppercase mb-1 md:mb-2 transition-transform hover:scale-105 active:scale-95">
                                <Trash2 size={14} /> CLEAR ALL
                            </button>
                        )}
                    </div>

                    {view === 'history' ? (
                        <div className="flex flex-col gap-3 max-w-2xl">
                            {searchHistory.map((h, i) => (
                                <div key={i} onClick={() => handleSearch(null, h)} className="flex items-center justify-between p-4 bg-[#111111]/40 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <History size={18} />
                                        <span className="font-bold text-lg">{h}</span>
                                    </div>
                                    <button onClick={(e) => removeHistoryItem(e, h)} className="text-white hover:text-[#6366f1]"><X size={20} /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-10">
                            {currentList.map(track => (
                                <div key={track.id} className="bg-[#111111]/40 p-4 rounded-[2.5rem] border border-white/5 group relative transition-all hover:bg-white/5">
                                    <div className="relative mb-5 aspect-square rounded-[2rem] overflow-hidden">
                                        <img src={track.album?.cover_medium} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" />
                                        <button 
                                            onClick={() => {
                                                if (playingTrack?.id === track.id) {
                                                    isPaused ? audioRef.current.play() : audioRef.current.pause();
                                                    setIsPaused(!isPaused);
                                                } else {
                                                    audioRef.current.src = track.preview;
                                                    audioRef.current.playbackRate = playbackRate;
                                                    setPlayingTrack(track);
                                                    audioRef.current.play();
                                                    setIsPaused(false);
                                                }
                                            }}
                                            className="absolute inset-0 m-auto w-14 h-14 bg-[#6366f1] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-2xl"
                                        >
                                            {playingTrack?.id === track.id && !isPaused ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-start px-1">
                                        <div className="truncate text-left flex-1">
                                            <h3 className="font-black truncate text-sm text-white mb-1">{track.title}</h3>
                                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{track.artist?.name}</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <Heart size={18} onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }} className={`cursor-pointer transition-colors ${favorites.some(f => f.id === track.id) ? "text-[#6366f1] fill-[#6366f1]" : "text-zinc-700 hover:text-white"}`} />
                                            <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track.id ? null : track.id); }} className="text-zinc-700 hover:text-white">
                                                < MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {activeMenu === track.id && (
                                        <div className="absolute top-[70%] right-4 w-40 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 z-[150] shadow-2xl animate-in fade-in zoom-in duration-200">
                                            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-[11px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest"><Download size={14} /> Download</button>
                                            <div className="h-[1px] bg-white/5 my-1" />
                                            <div className="px-3 py-1 text-[9px] font-black text-[#6366f1] uppercase tracking-[0.2em]">Speed</div>
                                            <div className="flex gap-1 px-2 pb-1">
                                                {[0.5, 1, 1.5].map(s => (
                                                    <button key={s} onClick={() => changeSpeed(s)} className={`flex-1 py-1 rounded-lg text-[10px] font-black ${playbackRate === s ? 'bg-[#6366f1] text-white' : 'bg-white/5 text-zinc-600'}`}>{s}x</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* PLAYER BAR */}
                {playingTrack && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[1000px] bg-black/80 backdrop-blur-3xl border border-white/10 p-4 md:p-6 rounded-[3rem] flex items-center justify-between z-[500] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-4 w-[30%]">
                            <img src={playingTrack.album?.cover_small} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shrink-0 shadow-lg" alt="" />
                            <div className="truncate text-left hidden sm:block">
                                <h4 className="text-sm font-black text-white truncate">{playingTrack.title}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest truncate">{playingTrack.artist?.name}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-3">
                            <button onClick={() => { isPaused ? audioRef.current.play() : audioRef.current.pause(); setIsPaused(!isPaused); }} className="bg-white p-3 rounded-full hover:scale-110 transition-all shadow-xl">
                                {isPaused ? <Play size={24} fill="black" className="ml-1" /> : <Pause size={24} fill="black" />}
                            </button>
                            <div className="w-full flex items-center gap-4 px-2 md:px-10">
                                <span className="text-[10px] font-black text-zinc-600 w-8 text-right">{Math.floor(currentTime)}s</span>
                                <div ref={progressBarRef} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative">
                                    <div className="h-full bg-[#6366f1] rounded-full transition-all duration-100 relative" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-zinc-600 w-8">{Math.floor(duration)}s</span>
                            </div>
                        </div>

                        <div className="w-[30%] flex justify-end items-center gap-4">
                            <button onClick={() => setPlayingTrack(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-[#6366f1] transition-all"><X size={20} /></button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MusicApp;