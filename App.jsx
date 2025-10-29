
import React, { useState, useRef, useEffect } from "react";

export default function MusicPlayer() {
  const songs = [
    { title: "Song 1", src: "/music/Song1.mp3" },
    { title: "Song 2", src: "/music/Song2.mp3" },
    { title: "Song 3", src: "/music/Song3.mp3" },
  ];

  const [currentSong, setCurrentSong] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Αυτόματα play όταν αλλάζει τραγούδι και είναι σε play mode
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentSong, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    setCurrentSong((currentSong + 1) % songs.length);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#87CEEB",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          textAlign: "center",
          width: "350px",
        }}
      >
        <h2>🎵 Now Playing: {songs[currentSong].title}</h2>

        {/* Προσθέτουμε key για να ξαναφορτώνει όταν αλλάζει */}
        <audio
          key={currentSong}
          ref={audioRef}
          src={songs[currentSong].src}
        />

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={togglePlay}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {isPlaying ? "⏸ Pause" : "▶️ Play"}
          </button>

          <button
            onClick={nextSong}
            style={{
              marginLeft: "10px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2196F3",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ⏭ Next
          </button>
        </div>
      </div>
    </div>
  );
}