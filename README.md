Beatstream – High-End Music Streaming App
A modern, high-performance music streaming application built with React and Tailwind CSS. Beatstream leverages the Deezer API to provide users with a seamless discover-to-play experience, featuring advanced audio controls and state persistence.

🚀 Key Technical Features
1. Advanced Audio Engine
Audio API Integration: Built around a persistent HTML5 Audio instance managed via useRef for seamless playback.

Custom Scrubbing Logic: A manual "drag-to-scrub" progress bar implementation using mouse event listeners (mousemove, mouseup) and bounding box calculations for precise playback control.

Auto-Queue System: Smart logic that automatically detects the end of a track and triggers the next song based on the current context (Discover or Library).

Playback Speed Control: Real-time manipulation of the playbackRate property (0.5x, 1x, 1.5x).

2. Search & Discovery Logic
Real-time Suggestions: Implemented Debouncing logic on the search input to minimize API calls while providing live suggestions.

Search History Management: A persistent history system that allows users to revisit previous searches, stored via localStorage.

Dynamic API Integration: Connected to the Deezer RapidAPI host for fetching trending tracks and searching a global database.

3. User Experience (UX) & State
Library & Favorites: Integrated a "Like" system using Redundancy Storage (LocalStorage) so users' favorites persist after page refreshes.

Contextual Menus: Custom-built dropdown menus for track-specific actions (Download simulation, Speed control).

Responsive UI: A dark-themed, sleek interface using Tailwind CSS with backdrop-blur effects and fluid transitions.

 Tech Stack
 
 Technology Usage
 React (Hooks)Core Framework (useState, useEffect, useRef)
 Tailwind CSS  Premium UI Styling & Glassmorphism effects
 Axios Asynchronous API requests & Debouncing
 Lucide React High-quality iconography
 RapidAPI / Deezer Music metadata and audio previews source
 LocalStorage API Client-side data persistence
