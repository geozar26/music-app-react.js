import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Heart, Music, Library as LibraryIcon, X, MoreVertical, Download, Gauge, ChevronLeft, Pause } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Σταθερό Audio Object
  const audioRef = useRef(new Audio());

  const favorites = useLiveQuery(() => db.favorites?.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.searches?.orderBy('timestamp').reverse().toArray()) || [];

  useEffect(() => {
    const audio = audioRef.current;
    
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onEnded = () => setPlayingTrack(null);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);

    // Αρχική φόρτωση
    searchTracks(null, 'top hits');

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const handlePlay = async (track) => {
    if (!track.preview) {
        alert("Αυτό το τραγούδι δεν έχει προεπισκόπηση");
        return;
    }
    
    const audio = audioRef.current;
    // ✅ Μετατροπή σε HTTPS για να παίζει παντού
    const secureUrl = track.preview.replace("http://", "https://");

    if (playingTrack?.id === track.id) {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
        setPlayingTrack(null);
      }
    } else {
      setIsLoading(true);
      audio.pause();
      audio.src = secureUrl;
      try {
        await audio.play();
        setPlayingTrack(track);
      } catch (err) {
        console.error("Playback error:", err);
        setIsLoading(false);
      }
    }
  };

  const searchTracks = async (e, queryOverride) => {
    if (e) e.preventDefault();
    const q = queryOverride || searchQuery;
    if (!q.trim()) return;

    setView('discover');
    setShowHistory(false);

    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      
      if (res.data.data) {
        setTracks(res.data.data);
        // Αποθήκευση στο ιστορικό μόνο αν βρέθηκαν αποτελέσματα
        if (db.searches && !queryOverride) {
          await db.searches.add({ query: q.toLowerCase(), timestamp: Date.now() });
        }
      }
    } catch (e) { 
        console.error("Search error:", e);
        alert("Πρόβλημα σύνδεσης με τη μουσική βιβλιοθήκη.");
    }
  };

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans">
      <aside className="w-64 bg-[#080810] border-r border-white/5 flex flex-col shrink-0 p-5">
        <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" size={24} />
          <span className="font-black text-xl tracking-tighter uppercase italic text-white">Beatstream</span>
        </div>
        <button onClick={() => setView('library')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'library' ? 'bg-indigo-500/15 text-indigo-400' : 'text-zinc-500 hover:text-white'}`}>
          <LibraryIcon size={20} /> <span className="font-black uppercase text-[11px]">Library</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col bg-[#020205] relative pb-24">
        <header className="p-4 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={searchTracks} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" className="w-full bg-white/5 rounded-xl py-2 px-10 border border-white/10 outline-none focus:border-indigo-500"
                placeholder="Αναζήτηση τραγουδιών..." value={searchQuery} onFocus={() => setShowHistory(true)} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl z-50 p-2">
                {searchHistory.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer" onClick={() => { setSearchQuery(item.query); searchTracks(null, item.query); }}>
                    <span className="text-zinc-300">{item.query}</span>
                    <button onClick={(e) => { e.stopPropagation(); db.searches.delete(item.id); }}><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" onClick={() => setShowHistory(false)}>
          <div className="flex items-center gap-4 mb-8">
            {view === 'library' && <button onClick={() => setView('discover')} className="p-2 bg-white/5 rounded-full"><ChevronLeft /></button>}
            <h2 className="text-3xl font-black uppercase italic">{view === 'discover' ? 'Discover' : 'Library'}</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favorites).map((track) => (
              <div key={track.id} className="bg-white/[0.03] p-4 rounded-2xl group hover:bg-white/[0.06] transition-all border border-white/5">
                <div className="relative mb-4 aspect-square rounded-xl overflow-hidden">
                  <img src={track.album?.cover_medium || track.albumArt} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => handlePlay(track)} className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    {playingTrack?.id === track.id ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                  </button>
                </div>
                <h3 className="font-bold truncate">{track.title}</h3>
                <p className="text-xs text-zinc-500 truncate">{track.artist?.name || track.artist}</p>
                <div className="flex justify-between mt-3">
                    <button onClick={() => {
                        const isFav = favorites.some(f => f.id === track.id);
                        isFav ? db.favorites.delete(track.id) : db.favorites.add({id: track.id, title: track.title, artist: track.artist?.name, albumArt: track.album?.cover_medium, preview: track.preview});
                    }}>
                        <Heart size={18} className={favorites.some(f => f.id === track.id) ? "fill-red-500 text-red-500" : "text-zinc-600"} />
                    </button>
                    <MoreVertical size={18} className="text-zinc-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {playingTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 flex items-center gap-6 z-[100]">
            <div className="w-64 flex items-center gap-3">
                <img src={playingTrack.album?.cover_medium || playingTrack.albumArt} className="w-12 h-12 rounded" alt="" />
                <div className="truncate"><p className="font-bold text-sm truncate">{playingTrack.title}</p></div>
            </div>
            <div className="flex-1 max-w-xl mx-auto flex flex-col items-center">
                <div className="flex items-center gap-3 w-full">
                    <span className="text-[10px] text-zinc-500">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{width: `${(currentTime/duration)*100}%`}}></div>
                    </div>
                    <span className="text-[10px] text-zinc-500">0:30</span>
                </div>
            </div>
            <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center">
                {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"></div> : <Pause fill="black" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicApp;
