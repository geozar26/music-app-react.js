import React, { useState } from "react";
import axios from "axios";

export default function MusicApp() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);

  // 🔍 Συνάρτηση για αναζήτηση τραγουδιών
  const searchSongs = async () => {
    if (!query.trim()) return;

    try {
      const response = await axios.get("https://itunes.apple.com/search", {
        params: {
          term: query,
          media: "music",
          limit: 10,
        },
      });
      setTracks(response.data.results);
    } catch (error) {
      console.error("Σφάλμα κατά την αναζήτηση:", error);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #87CEEB, #1e90ff)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "20px",
          width: "400px",
          textAlign: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <h2>🎵 Music Search App</h2>

        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Αναζήτησε τραγούδι..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
          <button
            onClick={searchSongs}
            style={{
              padding: "10px 15px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#1e90ff",
              color: "white",
              cursor: "pointer",
            }}
          >
            🔍
          </button>
        </div>

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            textAlign: "left",
          }}
        >
          {tracks.map((track) => (
            <div
              key={track.trackId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
                background: "#f8f8f8",
                borderRadius: "10px",
                padding: "8px",
              }}
            >
              <img
                src={track.artworkUrl100}
                alt={track.trackName}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "10px",
                }}
              />
              <div>
                <strong>{track.trackName}</strong>
                <p style={{ margin: 0 }}>{track.artistName}</p>
                <audio
                  controls
                  src={track.previewUrl}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}