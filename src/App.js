{/* HEADER */}
<header className="p-4 flex items-center justify-between">
  
  {/* SEARCH BAR */}
  <div className="w-[450px] shrink-0">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
      <input 
        type="text" 
        className="w-full bg-[#111111] rounded-xl py-2 px-10 border-none outline-none text-zinc-300 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        placeholder="Αναζήτηση..." 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && searchTracks(e)}
      />
    </div>
  </div>

  {/* ΔΕΞΙΟ ΜΕΡΟΣ: INSTALL, LOG IN, SIGN UP */}
  <div className="flex items-center gap-8 pr-4">
    <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
      Install
    </button>
    
    <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">
      Log in
    </button>

    <button className="bg-[#6366f1] hover:bg-[#5558e3] px-8 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/10 active:scale-95">
      Sign up
    </button>
  </div>

</header>
