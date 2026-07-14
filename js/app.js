/**
 * Umnik Core Application Router & Screen Manager
 * Coordinates profile creation, main dashboard navigation, game launches,
 * reward trophy room rendering, and full reactive state changes.
 */

const UmnikApp = (() => {
  // Navigation stack to support going back
  const navHistory = [];
  let currentScreen = "profile-select"; // profile-select, dashboard, difficulty, game, rewards
  let activeGameId = null; // crossword, sudoku, math

  // Global Audio Initialization trigger
  const ensureAudioInit = () => {
    if (window.UmnikAudio) {
      window.UmnikAudio.triggerInit();
    }
  };

  const navigateTo = (screen, state = {}) => {
    // Record history
    navHistory.push({ screen: currentScreen, gameId: activeGameId });
    currentScreen = screen;
    if (state.gameId) activeGameId = state.gameId;

    // Clean up active game key listeners if switching away from active game
    if (screen !== "game") {
      if (window.UmnikCrossword) window.UmnikCrossword.destroy();
      if (window.UmnikSudoku) window.UmnikSudoku.destroy();
      if (window.UmnikAnimalSudoku) window.UmnikAnimalSudoku.destroy();
    }

    renderCurrentScreen(state);
  };

  const goBack = () => {
    if (navHistory.length === 0) {
      navigateTo("profile-select");
      return;
    }
    const prev = navHistory.pop();
    currentScreen = prev.screen;
    activeGameId = prev.gameId;

    if (currentScreen !== "game") {
      if (window.UmnikCrossword) window.UmnikCrossword.destroy();
      if (window.UmnikSudoku) window.UmnikSudoku.destroy();
      if (window.UmnikAnimalSudoku) window.UmnikAnimalSudoku.destroy();
    }

    renderCurrentScreen();
  };

  const renderCurrentScreen = (state = {}) => {
    ensureAudioInit();
    
    const root = document.getElementById("umnik-app-root");
    if (!root) return;

    // Add standard fade-in animation to all screen mounts
    root.className = "min-h-screen bg-[#FFFBEB] p-4 md:p-6 font-sans animate-fade-in text-[#2D3748]";

    switch (currentScreen) {
      case "profile-select":
        renderProfileSelect(root);
        break;
      case "dashboard":
        renderDashboard(root);
        break;
      case "difficulty":
        renderDifficultySelect(root, activeGameId);
        break;
      case "game":
        renderGameStage(root, activeGameId, state.difficulty);
        break;
      case "rewards":
        renderRewardsRoom(root);
        break;
    }
    
    // Add audio control to corner if not in profile selection
    if (currentScreen !== "profile-select") {
      renderStickyControls();
    } else {
      const controls = document.getElementById("sticky-app-controls");
      if (controls) controls.remove();
    }
  };

  // Render Audio toggle widget
  const renderStickyControls = () => {
    let el = document.getElementById("sticky-app-controls");
    if (!el) {
      el = document.createElement("div");
      el.id = "sticky-app-controls";
      el.className = "fixed bottom-5 right-5 z-40 flex items-center gap-2";
      document.body.appendChild(el);
    }

    const isMuted = window.UmnikAudio ? window.UmnikAudio.isMuted() : false;
    el.innerHTML = `
      <button 
        id="btn-global-mute" 
        class="w-12 h-12 rounded-full ${isMuted ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer touch-target select-none"
        title="${isMuted ? 'Включи звука' : 'Спри звука'}"
      >
        ${isMuted ? "🔇" : "🔊"}
      </button>
    `;

    document.getElementById("btn-global-mute").addEventListener("click", () => {
      if (window.UmnikAudio) {
        const muted = window.UmnikAudio.toggleMute();
        renderStickyControls();
      }
    });
  };

  // 1. SCREEN: PROFILE SELECTOR
  const renderProfileSelect = (root) => {
    const profiles = window.UmnikProgress ? window.UmnikProgress.getProfiles() : [];
    
    let profilesHtml = "";
    profiles.forEach(p => {
      // Pick color theme based on index
      const colors = [
        "from-indigo-400 to-indigo-600 border-indigo-200",
        "from-emerald-400 to-emerald-600 border-emerald-200",
        "from-rose-400 to-rose-600 border-rose-200"
      ];
      const themeClass = colors[profiles.indexOf(p) % colors.length];

      profilesHtml += `
        <div class="group relative flex flex-col items-center">
          <button 
            class="profile-card-btn w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr ${themeClass} text-white font-black text-3xl md:text-4xl flex items-center justify-center border-4 border-slate-700 shadow-[4px_4px_0px_0px_rgba(45,55,72,0.9)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            data-id="${p.id}"
          >
            ${p.name.substring(0, 1).toUpperCase()}
          </button>
          
          <span class="mt-3 font-black text-slate-800 text-lg md:text-xl">${p.name}</span>
          <span class="text-yellow-600 font-bold text-xs flex items-center gap-1 mt-0.5">
            ⭐ ${p.stars} Звезди
          </span>

          <!-- Delete profile icon (only if more than 1) -->
          ${profiles.length > 1 ? `
            <button 
              class="btn-delete-profile absolute -top-1 -right-1 w-8 h-8 bg-white text-rose-500 rounded-full border-2 border-rose-100 font-bold flex items-center justify-center shadow hover:bg-rose-50 active:scale-90 transition-all cursor-pointer text-xs select-none"
              data-id="${p.id}"
              title="Изтрий профил"
            >
              ❌
            </button>
          ` : ""}
        </div>
      `;
    });

    // Add profile card placeholder if fewer than 3 profiles
    let addProfileBtnHtml = "";
    if (profiles.length < 3) {
      addProfileBtnHtml = `
        <div class="flex flex-col items-center">
          <button 
            id="btn-add-profile-trigger" 
            class="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border-4 border-dashed border-slate-400 hover:border-slate-500 text-slate-400 hover:text-slate-500 flex items-center justify-center font-bold text-4xl shadow-[4px_4px_0px_0px_rgba(45,55,72,0.1)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          >
            ＋
          </button>
          <span class="mt-3 font-bold text-slate-500 text-sm md:text-base">Нов профил</span>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[85vh] py-10 animate-fade-in">
        <!-- Logo Header -->
        <div class="text-center mb-10 flex flex-col items-center">
          <div class="w-20 h-20 bg-white border-4 border-[#FBBF24] text-[#F59E0B] rounded-3xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(45,55,72,0.9)] mb-4 animate-bounce">
            <span class="text-4xl font-black font-sans leading-none">У</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black text-[#F59E0B] font-sans tracking-tight uppercase">УМНИК</h1>
          <p class="text-slate-600 font-bold mt-2 text-sm md:text-base uppercase tracking-wider">Забавни образователни игри за деца</p>
        </div>

        <!-- Cards Panel -->
        <div class="bg-white p-8 md:p-12 rounded-[32px] border-4 border-[#E2E8F0] shadow-xl w-full flex flex-col items-center">
          <h2 class="text-xl md:text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-tight">Кой ще играе днес?</h2>
          
          <div class="flex flex-wrap items-center justify-center gap-10 md:gap-14">
            ${profilesHtml}
            ${addProfileBtnHtml}
          </div>
        </div>

        <!-- Add Profile Inline Form modal (hidden by default) -->
        <div id="add-profile-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-8 border-orange-400 shadow-2xl animate-fade-in">
            <span class="text-5xl block mb-2">👦👧</span>
            <h3 class="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Създай нов профил</h3>
            <p class="text-slate-500 text-xs font-bold mb-5">Напиши твоето име, за да пазим твоите звезди!</p>
            
            <form id="add-profile-form" class="flex flex-col gap-4">
              <input 
                type="text" 
                id="profile-name-input" 
                required 
                placeholder="Име на детето" 
                maxlength="15"
                class="px-4 py-3.5 border-4 border-[#E2E8F0] rounded-2xl text-center font-bold focus:border-[#F59E0B] focus:outline-none focus:ring-4 focus:ring-indigo-50 text-base"
              >
              <div class="flex gap-3">
                <button 
                  type="submit" 
                  class="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-white font-black rounded-2xl border-2 border-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  Създай! 🌟
                </button>
                <button 
                  type="button" 
                  id="btn-add-profile-cancel" 
                  class="flex-1 py-3 bg-[#EDF2F7] hover:bg-slate-200 text-[#2D3748] border-2 border-[#CBD5E0] font-black rounded-2xl cursor-pointer"
                >
                  Отказ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Bind selection events
    const cards = document.querySelectorAll(".profile-card-btn");
    cards.forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (window.UmnikProgress) {
          window.UmnikProgress.setActiveProfile(id);
        }
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        navigateTo("dashboard");
      });
    });

    // Delete profile action
    const deleteBtns = document.querySelectorAll(".btn-delete-profile");
    deleteBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        
        const id = btn.dataset.id;
        if (confirm("Сигурен ли си, че искаш да изтриеш този профил и всички негови звезди?")) {
          if (window.UmnikProgress) {
            window.UmnikProgress.deleteProfile(id);
          }
          navigateTo("profile-select");
        }
      });
    });

    // Add profile trigger
    const triggerBtn = document.getElementById("btn-add-profile-trigger");
    if (triggerBtn) {
      triggerBtn.addEventListener("click", () => {
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        document.getElementById("add-profile-modal").classList.remove("hidden");
        document.getElementById("profile-name-input").focus();
      });
    }

    const cancelBtn = document.getElementById("btn-add-profile-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        document.getElementById("add-profile-modal").classList.add("hidden");
      });
    }

    const form = document.getElementById("add-profile-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("profile-name-input");
        const name = input.value.trim();
        if (name) {
          if (window.UmnikAudio) window.UmnikAudio.playPop();
          if (window.UmnikProgress) {
            const res = window.UmnikProgress.addProfile(name);
            if (res.success) {
              navigateTo("dashboard");
            } else {
              alert(res.error);
            }
          }
        }
      });
    }
  };

  // 2. SCREEN: MAIN DASHBOARD
  const renderDashboard = (root) => {
    const profile = window.UmnikProgress ? window.UmnikProgress.getActiveProfile() : { name: "Ученик", stars: 0 };
    const games = window.UmnikGamesRegistry ? window.UmnikGamesRegistry.getGames() : [];

    let gamesHtml = "";
    games.forEach(g => {
      gamesHtml += `
        <div class="game-launch-card bg-white p-6 md:p-8 rounded-[32px] border-4 border-[#E2E8F0] hover:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(226,232,240,0.8)] hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.15)] transition-all cursor-pointer flex flex-col justify-between" data-id="${g.id}">
          <div>
            <div class="w-14 h-14 bg-gradient-to-tr ${g.color} text-white font-black rounded-2xl flex items-center justify-center text-2xl shadow-md mb-6 select-none border-2 border-slate-700">
              ${g.icon}
            </div>
            <h3 class="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight select-none">${g.title}</h3>
            <p class="text-slate-500 text-xs md:text-sm font-medium leading-relaxed mb-6 select-none">${g.description}</p>
          </div>
          <button class="w-full py-3.5 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FBBF24] hover:text-amber-950 border-2 border-[#FBBF24] active:scale-95 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-1 select-none">
            Играй сега! ➔
          </button>
        </div>
      `;
    });

    root.innerHTML = `
      <div class="max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
        
        <!-- Dashboard Top Bar Header -->
        <header class="bg-white border-b-4 border-[#FBBF24] rounded-3xl flex flex-wrap items-center justify-between gap-4 p-5 px-8 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="bg-[#FBBF24] p-2 rounded-xl border-2 border-slate-800">
              <span class="text-white text-3xl font-black leading-none">У</span>
            </div>
            <h1 class="text-3xl font-black text-[#F59E0B] tracking-tight uppercase">УМНИК</h1>
          </div>

          <!-- Stars & Badges counters -->
          <div class="flex items-center gap-3">
            <!-- Stars Count button -->
            <div class="flex items-center gap-2 bg-[#FEF3C7] px-4 py-2 rounded-full border-2 border-[#FBBF24] text-yellow-700 font-bold select-none">
              <span class="text-xl font-black">${profile.stars}</span>
              <span class="text-2xl">⭐</span>
            </div>

            <!-- Trophy Room Navigation -->
            <button id="btn-nav-rewards" class="px-4 py-2 bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-purple-800 font-bold rounded-full text-sm md:text-base flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <span>🏆</span>
              <span>Награди (${profile.badges.length})</span>
            </button>

            <!-- Switch Profile -->
            <button id="btn-switch-profile" class="w-10 h-10 flex items-center justify-center bg-white border-2 border-[#E2E8F0] text-slate-600 font-bold rounded-full shadow-sm hover:border-[#3B82F6] transition-all cursor-pointer" title="Смени профил">
              👤
            </button>
          </div>
        </header>

        <!-- Banner or welcome illustration with Owl -->
        <div class="bg-white p-6 md:p-8 rounded-[32px] border-4 border-[#3B82F6] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-44 h-44 bg-[#DBEAFE] rounded-full opacity-30 -mr-10 -mt-10"></div>
          <div class="flex flex-col md:flex-row items-center gap-6 z-10">
            <!-- Cute Owl Avatar -->
            <div class="w-20 h-20 md:w-24 md:h-24 select-none">
              ${window.UmnikCharacters.get("umko").getAvatarSvg()}
            </div>
            <div class="text-center md:text-left">
              <h3 class="text-2xl font-black text-blue-900 uppercase tracking-tight mb-1">Готов ли си за предизвикателства?</h3>
              <p class="text-blue-800 font-medium text-sm max-w-md leading-relaxed">
                Избери една от забавните образователни игри по-долу. Печели златни звезди и отключвай медали в залата на славата!
              </p>
            </div>
          </div>
        </div>

        <!-- Games Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${gamesHtml}
        </div>
      </div>
    `;

    // Bind event handlers
    const cards = document.querySelectorAll(".game-launch-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        navigateTo("difficulty", { gameId: id });
      });
    });

    document.getElementById("btn-nav-rewards").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      navigateTo("rewards");
    });

    document.getElementById("btn-switch-profile").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      navigateTo("profile-select");
    });
  };

  // 3. SCREEN: DIFFICULTY SELECTOR
  const renderDifficultySelect = (root, gameId) => {
    const game = window.UmnikGamesRegistry ? window.UmnikGamesRegistry.getGameById(gameId) : null;
    if (!game) {
      navigateTo("dashboard");
      return;
    }

    let diffHtml = "";
    game.difficulties.forEach(d => {
      let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
      if (d.level === "medium") badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
      if (d.level === "hard") badgeColor = "bg-rose-100 text-rose-800 border-rose-300";

      // Star display
      let starsHtml = "";
      for (let s = 0; s < game.difficulties.indexOf(d) + 1; s++) {
        starsHtml += "⭐";
      }

      diffHtml += `
        <button 
          class="btn-difficulty-card bg-white p-6 rounded-[32px] border-4 border-[#E2E8F0] hover:border-[#3B82F6] shadow-[4px_4px_0px_0px_rgba(226,232,240,0.8)] hover:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none active:scale-95"
          data-level="${d.level}"
        >
          <div class="px-4 py-1 rounded-full text-xs font-extrabold border-2 mb-3 uppercase ${badgeColor}">
            ${d.label}
          </div>
          <span class="text-slate-800 font-black text-base md:text-lg mb-2 uppercase tracking-tight">${d.desc}</span>
          <div class="text-sm font-bold text-yellow-500">${starsHtml}</div>
        </button>
      `;
    });

    root.innerHTML = `
      <div class="max-w-3xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
        
        <!-- Header Controls -->
        <div class="flex items-center gap-4 bg-white p-4 rounded-[32px] border-4 border-[#FBBF24] shadow-sm">
          <button id="btn-diff-back" class="px-5 py-2 bg-[#EDF2F7] border-4 border-[#CBD5E0] text-[#2D3748] font-black rounded-2xl hover:bg-gray-100 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 touch-target">
            ← Назад
          </button>
          <div>
            <p class="text-[10px] text-slate-400 uppercase font-black tracking-wide leading-none mb-1">Избор на ниво</p>
            <h1 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">${game.title} - ТРУДНОСТ</h1>
          </div>
        </div>

        <!-- Banner details -->
        <div class="bg-[#DBEAFE] border-4 border-[#3B82F6] p-6 md:p-8 rounded-[32px] flex items-center gap-4 text-blue-900 shadow-md">
          <span class="text-4xl md:text-5xl select-none bg-white p-2.5 rounded-2xl border-2 border-blue-300">${game.icon}</span>
          <div>
            <h3 class="font-black text-blue-950 uppercase tracking-tight text-base md:text-lg mb-1">Избери колко трудно да бъде!</h3>
            <p class="text-blue-800 font-medium text-xs md:text-sm leading-relaxed">Всяко ниво носи различна сложност на задачите и брой златни звезди при победа.</p>
          </div>
        </div>

        <!-- Difficulties list -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${diffHtml}
        </div>
      </div>
    `;

    // Event hooks
    document.getElementById("btn-diff-back").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      goBack();
    });

    const diffBtns = document.querySelectorAll(".btn-difficulty-card");
    diffBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const lvl = btn.dataset.level;
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        navigateTo("game", { gameId: gameId, difficulty: lvl });
      });
    });
  };

  // 4. SCREEN: GAME ACTIVE STAGE
  const renderGameStage = (root, gameId, difficulty) => {
    // Render game wrapper structure
    root.innerHTML = `
      <div id="active-game-container" class="max-w-5xl mx-auto animate-fade-in"></div>
    `;

    // Map to specific game scripts
    if (gameId === "crossword") {
      if (window.UmnikCrossword) {
        window.UmnikCrossword.init("active-game-container", difficulty);
      }
    } else if (gameId === "sudoku") {
      if (window.UmnikSudoku) {
        window.UmnikSudoku.init("active-game-container", difficulty);
      }
    } else if (gameId === "animalsudoku") {
      if (window.UmnikAnimalSudoku) {
        window.UmnikAnimalSudoku.init("active-game-container", difficulty);
      }
    } else if (gameId === "math") {
      if (window.UmnikMath) {
        window.UmnikMath.init("active-game-container", difficulty);
      }
    }
  };

  // 5. SCREEN: MY REWARDS (Trophy room)
  const renderRewardsRoom = (root) => {
    const profile = window.UmnikProgress ? window.UmnikProgress.getActiveProfile() : { name: "Ученик", stars: 0, badges: [] };
    const badges = window.UmnikProgress ? window.UmnikProgress.getAvailableBadges() : [];

    let badgesHtml = "";
    badges.forEach(b => {
      const earned = profile.badges.includes(b.id);
      
      if (earned) {
        badgesHtml += `
          <div class="bg-white p-5 rounded-[32px] border-4 border-[#10B981] shadow-[4px_4px_0px_0px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all select-none">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr ${b.color} text-white font-black flex items-center justify-center text-3xl shadow-md border-2 border-slate-700 mb-4 relative overflow-hidden animate-pulse">
              <div class="absolute inset-0 bg-white/10 rotate-12 -translate-y-5"></div>
              ${b.icon}
            </div>
            <h4 class="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base">${b.title}</h4>
            <p class="text-emerald-700 text-[11px] md:text-xs font-bold leading-relaxed mt-1">${b.description}</p>
            <span class="mt-3 px-3 py-1 bg-[#F0FDF4] text-emerald-800 border-2 border-emerald-300 rounded-full font-extrabold text-[10px] uppercase">
              ✓ Отключена
            </span>
          </div>
        `;
      } else {
        badgesHtml += `
          <div class="bg-slate-50 p-5 rounded-[32px] border-4 border-dashed border-[#CBD5E0] flex flex-col items-center justify-center text-center opacity-70 select-none">
            <div class="w-16 h-16 rounded-2xl bg-slate-200 border-2 border-[#CBD5E0] text-slate-400 flex items-center justify-center text-3xl mb-4">
              🔒
            </div>
            <h4 class="font-bold text-slate-400 text-sm md:text-base uppercase tracking-tight">${b.title}</h4>
            <p class="text-slate-400 text-[10px] md:text-xs font-semibold leading-relaxed mt-1">${b.description}</p>
            <span class="mt-3 px-3 py-1 bg-slate-200 text-slate-600 rounded-full font-extrabold text-[10px] uppercase">
              Заключена
            </span>
          </div>
        `;
      }
    });

    root.innerHTML = `
      <div class="max-w-4xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
        
        <!-- Header Controls -->
        <div class="flex items-center gap-4 bg-white p-4 rounded-[32px] border-4 border-[#FBBF24] shadow-sm">
          <button id="btn-rewards-back" class="px-5 py-2 bg-[#EDF2F7] border-4 border-[#CBD5E0] text-[#2D3748] font-black rounded-2xl hover:bg-gray-100 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 touch-target">
            ← Назад
          </button>
          <div>
            <p class="text-[10px] text-slate-400 uppercase font-black tracking-wide leading-none mb-1">Постижения</p>
            <h1 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">ЗАЛАТА НА СЛАВАТА НА ${profile.name.toUpperCase()}</h1>
          </div>
        </div>

        <!-- Trophy Stats card -->
        <div class="bg-white p-6 md:p-8 rounded-[32px] border-4 border-purple-500 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
          <div class="absolute bottom-0 right-0 w-36 h-36 bg-purple-50 rounded-full opacity-30 -mr-6 -mb-6"></div>
          
          <div class="text-center md:text-left z-10">
            <h3 class="text-2xl font-black text-purple-950 uppercase tracking-tight mb-1">Твоите съкровища</h3>
            <p class="text-purple-800 font-medium text-sm max-w-sm leading-relaxed">Тук се пазят всички спечелени отличия. Продължавай да играеш и отключи всички 5 значки!</p>
          </div>

          <div class="flex items-center gap-4 z-10">
            <!-- Stars -->
            <div class="bg-[#FEF3C7] px-5 py-3 rounded-2xl border-4 border-[#FBBF24] text-center shadow-md select-none text-amber-950 min-w-[100px]">
              <span class="text-2xl block mb-0.5">⭐</span>
              <span class="text-xl font-black leading-none">${profile.stars}</span>
              <p class="text-[9px] text-amber-700 uppercase font-bold tracking-wider mt-1">Звезди</p>
            </div>
            <!-- Medals -->
            <div class="bg-purple-100 px-5 py-3 rounded-2xl border-4 border-purple-400 text-center shadow-md select-none text-purple-950 min-w-[100px]">
              <span class="text-2xl block mb-0.5">🏆</span>
              <span class="text-xl font-black leading-none">${profile.badges.length} / 5</span>
              <p class="text-[9px] text-purple-700 uppercase font-bold tracking-wider mt-1">Значки</p>
            </div>
          </div>
        </div>

        <!-- Badges grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${badgesHtml}
        </div>
      </div>
    `;

    document.getElementById("btn-rewards-back").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      goBack();
    });
  };

  return {
    init: () => {
      // Boot strap on page load
      renderCurrentScreen();
    },
    goBack,
    navigateTo,
    renderStickyControls
  };
})();

// Assign to window for global access
window.UmnikApp = UmnikApp;

// Auto-run on window DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  UmnikApp.init();
});
