import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Heart, ChevronLeft } from "lucide-react";
import Dexie from "dexie";

const db = new Dexie("MusicDatabase");
db.version(1).stores({
  favorites: "trackId, trackName, artistName, artworkUrl100, previewUrl" 
});

export default function MusicApp() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      const allFavs = await db.favorites.toArray();
      setFavorites(allFavs);
    };
    loadFavorites();
  }, []);

  // Λειτουργία επιστροφής (καθαρίζει την αναζήτηση)
  const handleBack = () => {
    setQuery("");
    setTracks([]);
    setShowFavorites(false);
  };

  const searchSongs = async () => {
    if (!query.trim()) return;
    try {
      const response = await axios.get("https://itunes.apple.com/search", {
        params: { term: query, media: "music", limit: 10 },
      });
      setTracks(response.data.results);
      setShowFavorites(false);
    } catch (error) {
      console.error("Error searching:", error);
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #87CEEB, #1e90ff)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "20px", width: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        
        {/* Header με Βελάκι και Music App */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              onClick={handleBack}
              style={{ border: "none", background: "#f0f0f0", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ChevronLeft size={20} color="#333" />
            </button>
            <h2 style={{ margin: 0, fontSize: "22px" }}>🎵 Music App</h2>
          </div>
          
          <button 
            onClick={() => setShowFavorites(!showFavorites)}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <Heart fill={showFavorites ? "red" : "none"} color={showFavorites ? "red" : "#666"} size={28} />
          </button>
        </div>

        {/* Μπάρα Αναζήτησης */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Αναζήτησε τραγούδι..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #ddd", fontSize: "15px", outline: "none" }}
          />
          <button onClick={searchSongs} style={{ padding: "10px", borderRadius: "12px", border: "none", backgroundColor: "#1e90ff", color: "white", cursor: "pointer" }}>
            <Search size={20} />
          </button>
        </div>

        <h3 style={{ textAlign: "left", marginBottom: "15px" }}>
          {showFavorites ? "Τα Αγαπημένα μου" : "Αποτελέσματα"}
        </h3>

        {/* Λίστα Τραγουδιών */}
        <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "5px" }}>
          {(showFavorites ? favorites : tracks).map((track) => {
            const isFav = favorites.some(f => f.trackId === track.trackId);
            return (
              <div key={track.trackId} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", background: "#f9f9f9", borderRadius: "15px", padding: "10px" }}>
                <img src={track.artworkUrl100} alt="" style={{ width: "50px", height: "50px", borderRadius: "8px" }} />
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.trackName}</div>
                  <audio src={track.previewUrl} controls style={{ width: "100%", height: "25px", marginTop: "5px" }} />
                </div>
                <button 
                  onClick={() => toggleFavorite(track)}
                  style={{ border: "none", background: "none", cursor: "pointer" }}
                >
                  <Heart size={20} color={isFav ? "red" : "#ccc"} fill={isFav ? "red" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}