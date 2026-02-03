
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Heart, Music, Library as LibraryIcon, 
  MoreVertical, ChevronLeft, Pause, History 
} from 'lucide-react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db"; 
import axios from 'axios';

const MusicApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [view, setView] = useState('discover'); // 'discover' ή 'library'
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const audioRef = useRef(new Audio());

  // 1. ΔΙΑΧΕΙΡΙΣΗ ΒΑΣΗΣ (DEXIE) - Εδώ αποθηκεύονται τα πάντα
  const favoriteTracks = useLiveQuery(() => db.tracks.toArray()) || [];
  const searchHistory = useLiveQuery(() => db.history.reverse().toArray()) || [];

  // 2. ΦΙΛΤΡΑΡΙΣΜΑ ΙΣΤΟΡΙΚΟΥ: Δείχνει μόνο όσα ξεκινούν με το γράμμα που πάτησες
  const filteredHistory = searchHistory.filter(item => 
    item.term.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Αρχικά hits για το Discover
    const fetchInitial = async () => {
      try {
        const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=hits`, {
          headers: {
            'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
          }
        });
        setTracks(res.data.data || []);
      } catch (err) {}
    };
    fetchInitial();

    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  // ΛΕΙΤΟΥΡΓΙΑ ΑΝΑΖΗΤΗΣΗΣ & ΑΠΟΘΗΚΕΥΣΗΣ ΙΣΤΟΡΙΚΟΥ
  const handleSearch = async (e, termOverride) => {
    if (e) e.preventDefault();
    const q = termOverride || searchQuery;
    if (!q.trim()) return;

    try {
      const res = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search?q=${q}`, {
        headers: {
          'x-rapidapi-key': '84e121a50dmsh4650b0d1f6e44fep1ebe78jsn56932706b2b1',
          'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
        }
      });
      setTracks(res.data.data || []);
      setView('discover');
      setShowSearchHistory(false);
      // Αποθήκευση στη βάση για το ιστορικό
      await db.history.put({ id: q.toLowerCase(), term: q });
    } catch (err) {}
  };

  // ΛΕΙΤΟΥΡΓΙΑ ΚΑΡΔΙΑΣ & LIBRARY
  const toggleLike = async (track) => {
    const isFav = favoriteTracks.some(t => t.id === track.id);
    if (isFav) {
      await db.tracks.delete(track.id);
    } else {
      await db.tracks.put(track);
    }
  };

  const handlePlay = (track) => {
    const audio = audioRef.current;
    if (playingTrack?.id === track.id) {
      audio.paused ? audio.play() : audio.pause();
    } else {
      audio.src = track.preview;
      audio.play();
      setPlayingTrack(track);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#050505] p-6 flex flex-col border-r border-white/5">
        <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => setView('discover')}>
          <Music className="text-indigo-500" />
          <span className="text-xl font-black italic uppercase">Beatstream</span>
        </div>
        
        <div className="space-y-6">
          <button onClick={() => setView('discover')} className={`flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest ${view === 'discover' ? 'text-indigo-500' : 'text-zinc-500'}`}>
            <Search size={18} /> Discover
          </button>
          <button onClick={() => setView('library')} className={`flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest ${view === 'library' ? 'text-indigo-500' : 'text-zinc-500'}`}>
            <LibraryIcon size={18} /> My Library
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto pb-32">
        <header className="p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              className="w-full bg-[#111] rounded-full py-3 px-12 outline-none border border-white/5 focus:border-indigo-500"
              placeholder="Αναζήτηση..."
              value={searchQuery}
              onFocus={() => setShowSearchHistory(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            {/* DROPDOWN ΙΣΤΟΡΙΚΟΥ */}
            {showSearchHistory && filteredHistory.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-50">
                {filteredHistory.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSearchQuery(item.term); handleSearch(null, item.term); }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 cursor-pointer text-zinc-400 text-xs font-bold uppercase"
                  >
                    <History size={14} /> {item.term}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="px-8" onClick={() => setShowSearchHistory(false)}>
          <h2 className="text-4xl font-black uppercase italic mb-8">
            {view === 'discover' ? 'Discover' : 'My Library'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {(view === 'discover' ? tracks : favoriteTracks).map(track => {
              // ΕΛΕΓΧΟΣ ΑΝ ΕΙΝΑΙ ΗΔΗ ΣΤΑ ΑΓΑΠΗΜΕΝΑ ΓΙΑ ΤΗΝ ΚΑΡΔΙΑ
              const isLiked = favoriteTracks.some(t => t.id === track.id);
              
              return (
                <div key={track.id} className="bg-[#111]/50 p-4 rounded-3xl border border-white/5 group relative transition-all hover:bg-[#111]">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                    <img src={track.album?.cover_medium} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => handlePlay(track)} className="absolute inset-0 m-auto w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      {playingTrack?.id === track.id && !audioRef.current.paused ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                    </button>
                  </div>
                  
                  <h3 className="font-bold truncate">{track.title}</h3>
                  <p className="text-xs text-zinc-500 truncate mb-4">{track.artist?.name}</p>
                  
                  <div className="flex justify-between items-center">
                    <MoreVertical size={16} className="text-zinc-700" />
                    
                    {/* ΤΟ ΚΟΥΜΠΙ ΤΗΣ ΚΑΡΔΙΑΣ */}
                    <button onClick={() => toggleLike(track)}>
                      <Heart 
                        size={20} 
                        className={`transition-all ${isLiked ? "text-red-500 fill-red-500" : "text-zinc-800"}`} 
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MINI PLAYER */}
      {playingTrack && (
        <div className="fixed bottom-0 w-full bg-black/90 backdrop-blur-md p-4 border-t border-white/10 flex items-center justify-between px-10">
          <div className="flex items-center gap-4">
            <img src={playingTrack.album?.cover_small} className="rounded-md" alt="" />
            <div>
              <div className="text-sm font-bold">{playingTrack.title}</div>
              <div className="text-[10px] text-zinc-500 uppercase">{playingTrack.artist?.name}</div>
            </div>
          </div>
          <button onClick={() => handlePlay(playingTrack)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black">
            {audioRef.current.paused ? <Play fill="black" size={18} /> : <Pause fill="black" size={18} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
