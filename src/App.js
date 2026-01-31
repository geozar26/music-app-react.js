import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Heart, ChevronLeft, Music, PlayCircle } from "lucide-react";
import Dexie from "dexie";

// Database Setup
const db = new Dexie("MusicDatabase");
db.version(1).stores({
  favorites: "trackId, trackName, artistName, artworkUrl100, previewUrl" 
});

export default function MusicApp() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      const allFavs = await db.favorites.toArray();
      setFavorites(allFavs);
    };
    loadFavorites();
  }, []);

  const handleBack = () => {
    setQuery("");
    setTracks([]);
    setShowFavorites(false);
  };

  const searchSongs = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get("https://itunes.apple.com/search", {
        params: { term: query, media: "music", limit: 20 },
      });
      setTracks(response.data.results);
      setShowFavorites(false);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.trackId === track.trackId);
    if (isFav) {
      await db.favorites.delete(track.trackId);
    } else {
      await db.favorites.add(track);
    }
    const updatedFavs = await db.favorites.toArray();
    setFavorites(updatedFavs);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0f172a", 
      color: "white",
      display: "flex", 
      justifyContent: "center", 
      fontFamily: "'Inter', system-ui, sans-serif" 
    }}>
      {/* RESPONSIVE CONTAINER */}
      <div style={{ 
        width: "100%", 
        maxWidth: "1200px", // Απλώνει μέχρι τα 1200px
        background: "rgba(30, 41, 59, 0.3)",
        backdropFilter: "blur(20px)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0 20px"
      }}>
        
        {/* HEADER */}
        <div style={{ padding: "30px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ background: "#38bdf8", padding: "8px", borderRadius: "10px", cursor: "pointer" }} onClick={handleBack}>
              <Music size={24} color="#0f172a" />
            </div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>BEATSTREAM</h1>
          </div>
          
          <button 
            onClick={() => setShowFavorites(!showFavorites)}
            style={{ border: "none", background: "rgba(255,255,255,0.05)", padding: "10px 15px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "white" }}
          >
            <Heart fill={showFavorites ? "#ef4444" : "none"} color={showFavorites ? "#ef4444" : "white"} size={22} />
            <span style={{ fontWeight: "600" }}>Library</span>
          </button>
        </div>

        {/* SEARCH BAR (Center Aligned for Desktop) */}
        <div style={{ maxWidth: "600px", margin: "0 auto 40px", width: "100%" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={20} style={{ position: "absolute", left: "15px", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search for tracks, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
              style={{ 
                width: "100%", padding: "16px 16px 16px 50px", borderRadius: "18px", 
                border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", 
                color: "white", outline: "none", fontSize: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}
            />
          </div>
        </div>

        <h2 style={{ fontSize: "28px", marginBottom: "25px", fontWeight: "700" }}>
          {showFavorites ? "Saved to Library" : query ? `Results for "${query}"` : "New Releases"}
        </h2>

        {/* RESPONSIVE GRID LAYOUT  */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "20px", 
          paddingBottom: "60px" 
        }}>
          {loading ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "#38bdf8" }}>Tuning in...</div>
          ) : (showFavorites ? favorites : tracks).length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px" }}>
              <PlayCircle size={60} color="#1e293b" style={{ marginBottom: "15px" }} />
              <p style={{ color: "#64748b", fontSize: "18px" }}>Search for a track to start the stream.</p>
            </div>
          ) : (showFavorites ? favorites : tracks).map((track) => {
            const isFav = favorites.some(f => f.trackId === track.trackId);
            return (
              <div 
                key={track.trackId} 
                style={{ 
                  display: "flex", alignItems: "center", gap: "15px", 
                  padding: "15px", borderRadius: "20px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)", transition: "0.2s hover"
                }}
              >
                <img src={track.artworkUrl100} alt="" style={{ width: "70px", height: "70px", borderRadius: "14px", objectFit: "cover" }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {track.trackName}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "10px" }}>{track.artistName}</div>
                  
                  <audio 
                    src={track.previewUrl} 
                    controls 
                    style={{ width: "100%", height: "28px", filter: "invert(100%) brightness(1.5)" }} 
                  />
                </div>

                <button 
                  onClick={() => toggleFavorite(track)}
                  style={{ border: "none", background: "none", cursor: "pointer" }}
                >
                  <Heart 
                    size={24} 
                    color={isFav ? "#ef4444" : "#475569"} 
                    fill={isFav ? "#ef4444" : "none"} 
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}