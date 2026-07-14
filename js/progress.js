/**
 * Umnik Progress and Multi-Profile System
 * Handles child profiles (up to 3), star collections, and motivational achievement badges.
 * Built with full local persistence via UmnikStorage.
 */

const UmnikProgress = (() => {
  const STORAGE_KEY = "umnik_profiles_data";
  const ACTIVE_PROFILE_KEY = "umnik_active_profile_id";

  // List of all awardable child badges
  const AVAILABLE_BADGES = [
    {
      id: "first_game",
      title: "Първи стъпки",
      description: "Завърши първата си игра в Умник!",
      icon: "🏅",
      color: "from-pink-400 to-rose-500"
    },
    {
      id: "crossword_explorer",
      title: "Ловец на думи",
      description: "Разкри първата си кръстословица!",
      icon: "📚",
      color: "from-purple-400 to-indigo-500"
    },
    {
      id: "sudoku_wizard",
      title: "Судоку магьосник",
      description: "Подреди правилно судоку мрежа!",
      icon: "🧩",
      color: "from-amber-400 to-amber-600"
    },
    {
      id: "math_champion",
      title: "Цар на числата",
      description: "Реши 10 математически задачи без нито една грешка!",
      icon: "⚡",
      color: "from-emerald-400 to-teal-600"
    },
    {
      id: "star_collector",
      title: "Звезден герой",
      description: "Събери общо 30 звезди в профила си!",
      icon: "⭐",
      color: "from-yellow-400 to-orange-500"
    }
  ];

  let profiles = {};
  let activeProfileId = "";

  // Load profiles from safe local storage
  const loadFromStorage = () => {
    try {
      if (window.UmnikStorage) {
        const raw = window.UmnikStorage.getItem(STORAGE_KEY);
        if (raw) {
          profiles = JSON.parse(raw);
        }
        
        const activeId = window.UmnikStorage.getItem(ACTIVE_PROFILE_KEY);
        if (activeId && profiles[activeId]) {
          activeProfileId = activeId;
        }
      }
    } catch (e) {
      console.error("Failed to load profiles from UmnikStorage", e);
    }

    // If no profiles exist, seed a default one
    if (Object.keys(profiles).length === 0) {
      createProfile("Умник");
    }
  };

  // Save profiles to local storage safely
  const saveToStorage = () => {
    try {
      if (window.UmnikStorage) {
        window.UmnikStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        window.UmnikStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
      }
    } catch (e) {
      console.error("Failed to save profiles to UmnikStorage", e);
    }
  };

  // Helper to create a new profile
  const createProfile = (name) => {
    const cleanName = name.trim().substring(0, 15) || "Ученик";
    const id = "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    
    profiles[id] = {
      id: id,
      name: cleanName,
      stars: 0,
      completedGames: {
        crossword: [], // list of crossword ids completed
        sudoku: [],    // list of sudoku ids completed
        animalsudoku: [], // list of animalsudoku ids completed
        math: 0        // count of complete math sessions
      },
      badges: [],      // list of badge ids earned
      createdAt: new Date().toISOString()
    };

    if (!activeProfileId) {
      activeProfileId = id;
    }

    saveToStorage();
    return id;
  };

  // Initialize
  loadFromStorage();

  return {
    getProfiles: () => Object.values(profiles),
    
    getActiveProfile: () => {
      if (!activeProfileId || !profiles[activeProfileId]) {
        const keys = Object.keys(profiles);
        if (keys.length > 0) {
          activeProfileId = keys[0];
        } else {
          activeProfileId = createProfile("Умник");
        }
      }
      return profiles[activeProfileId];
    },

    setActiveProfile: (id) => {
      if (profiles[id]) {
        activeProfileId = id;
        saveToStorage();
        return true;
      }
      return false;
    },

    addProfile: (name) => {
      const all = Object.values(profiles);
      if (all.length >= 3) {
        return { success: false, error: "Може да има най-много 3 детски профила!" };
      }
      const newId = createProfile(name);
      activeProfileId = newId;
      saveToStorage();
      return { success: true, id: newId };
    },

    deleteProfile: (id) => {
      const keys = Object.keys(profiles);
      if (keys.length <= 1) {
        return { success: false, error: "Трябва да има поне един профил!" };
      }
      
      delete profiles[id];
      if (activeProfileId === id) {
        activeProfileId = Object.keys(profiles)[0];
      }
      saveToStorage();
      return { success: true };
    },

    // Award star points to active profile
    addStars: (count) => {
      const profile = UmnikProgress.getActiveProfile();
      if (!profile) return 0;

      profile.stars += count;
      
      // Check for star collector badge
      if (profile.stars >= 30 && !profile.badges.includes("star_collector")) {
        UmnikProgress.awardBadge("star_collector");
      }

      saveToStorage();
      return profile.stars;
    },

    // Record game completion
    recordGameComplete: (gameType, gameId, starsEarned) => {
      const profile = UmnikProgress.getActiveProfile();
      if (!profile) return [];

      UmnikProgress.addStars(starsEarned);
      
      const newBadges = [];

      // Award first_game badge if it's the very first completion
      if (!profile.badges.includes("first_game")) {
        profile.badges.push("first_game");
        newBadges.push("first_game");
      }

      if (gameType === "crossword") {
        if (!profile.completedGames.crossword.includes(gameId)) {
          profile.completedGames.crossword.push(gameId);
        }
        if (!profile.badges.includes("crossword_explorer")) {
          profile.badges.push("crossword_explorer");
          newBadges.push("crossword_explorer");
        }
      } else if (gameType === "sudoku") {
        if (!profile.completedGames.sudoku.includes(gameId)) {
          profile.completedGames.sudoku.push(gameId);
        }
        if (!profile.badges.includes("sudoku_wizard")) {
          profile.badges.push("sudoku_wizard");
          newBadges.push("sudoku_wizard");
        }
      } else if (gameType === "animalsudoku") {
        if (!profile.completedGames.animalsudoku) {
          profile.completedGames.animalsudoku = [];
        }
        if (!profile.completedGames.animalsudoku.includes(gameId)) {
          profile.completedGames.animalsudoku.push(gameId);
        }
        if (!profile.badges.includes("sudoku_wizard")) {
          profile.badges.push("sudoku_wizard");
          newBadges.push("sudoku_wizard");
        }
      } else if (gameType === "math") {
        profile.completedGames.math += 1;
        if (starsEarned === 15 && !profile.badges.includes("math_champion")) { // 15 stars is perfect score (10 correct + 5 bonus)
          profile.badges.push("math_champion");
          newBadges.push("math_champion");
        }
      }

      saveToStorage();
      return newBadges; // Return list of newly earned badge IDs during this game
    },

    // Explicit badge awarder
    awardBadge: (badgeId) => {
      const profile = UmnikProgress.getActiveProfile();
      if (!profile) return false;

      if (!profile.badges.includes(badgeId)) {
        profile.badges.push(badgeId);
        saveToStorage();
        return true;
      }
      return false;
    },

    getAvailableBadges: () => AVAILABLE_BADGES,
    
    getBadgeInfo: (badgeId) => {
      return AVAILABLE_BADGES.find(b => b.id === badgeId) || null;
    }
  };
})();

// Assign to window for global access
window.UmnikProgress = UmnikProgress;
