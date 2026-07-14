/**
 * Umnik Sudoku Game Engine
 * Manages 4x4 (Emoji/Number), 6x6, and 9x9 grids.
 * Provides selected cell highlighting, conflict marking (red highlights),
 * helper hints (up to 3 per game), custom number/emoji selector pads, and confirmation modals.
 */

const UmnikSudoku = (() => {
  let activePuzzle = null;
  let activeDifficulty = "easy";
  let gridState = []; // 2D array of current player values
  let selectedCell = { row: -1, col: -1 };
  let hintCount = 3;
  let showErrors = true; // kid-friendly toggle to highlight conflicts in red
  let isGameWon = false;

  // Procedural Sudoku Solved Board Generator (relabeling and shuffling validity-preserving operations)
  const generateSudokuBoard = (size) => {
    let base;
    let boxWidth, boxHeight;
    if (size === 4) {
      boxWidth = 2;
      boxHeight = 2;
      base = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 1],
        [4, 1, 2, 3]
      ];
    } else if (size === 6) {
      boxWidth = 3;
      boxHeight = 2;
      base = [
        [1, 2, 3, 4, 5, 6],
        [4, 5, 6, 1, 2, 3],
        [2, 3, 4, 5, 6, 1],
        [5, 6, 1, 2, 3, 4],
        [3, 4, 5, 6, 1, 2],
        [6, 1, 2, 3, 4, 5]
      ];
    } else {
      boxWidth = 3;
      boxHeight = 3;
      base = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 1, 5, 6, 4, 8, 9, 7],
        [5, 6, 4, 8, 9, 7, 2, 3, 1],
        [8, 9, 7, 2, 3, 1, 5, 6, 4],
        [3, 1, 2, 6, 4, 5, 9, 7, 8],
        [6, 4, 5, 9, 7, 8, 3, 1, 2],
        [9, 7, 8, 3, 1, 2, 6, 4, 5]
      ];
    }

    let grid = base.map(row => [...row]);

    // 1. Swap digits (relabeling digits 1..size)
    const digits = Array.from({ length: size }, (_, i) => i + 1);
    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid[r][c] = digits[grid[r][c] - 1];
      }
    }

    // 2. Swap rows within block bands
    for (let b = 0; b < size; b += boxHeight) {
      const indices = Array.from({ length: boxHeight }, (_, i) => b + i);
      for (let i = boxHeight - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const origRows = indices.map(idx => [...grid[idx]]);
      for (let i = 0; i < boxHeight; i++) {
        grid[b + i] = origRows[i];
      }
    }

    // 3. Swap columns within block columns
    for (let b = 0; b < size; b += boxWidth) {
      const indices = Array.from({ length: boxWidth }, (_, i) => b + i);
      for (let i = boxWidth - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let r = 0; r < size; r++) {
        const origRow = [...grid[r]];
        for (let i = 0; i < boxWidth; i++) {
          grid[r][b + i] = origRow[indices[i]];
        }
      }
    }

    // 4. Random transpositions
    if (Math.random() < 0.5) {
      const transposed = Array.from({ length: size }, () => Array(size).fill(0));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          transposed[c][r] = grid[r][c];
        }
      }
      grid = transposed;
    }

    return grid;
  };

  // Procedural Empty Cells Cleaver
  const createPuzzleGrid = (solution, size) => {
    const start = solution.map(row => [...row]);
    let cellsToRemove;
    if (size === 4) {
      cellsToRemove = 6 + Math.floor(Math.random() * 3); // 6, 7, 8 cells out
    } else if (size === 6) {
      cellsToRemove = 16 + Math.floor(Math.random() * 5); // 16-20 cells out
    } else {
      if (activeDifficulty === "easy") {
        cellsToRemove = 30 + Math.floor(Math.random() * 5); // 30-34 cells out (easy)
      } else if (activeDifficulty === "medium") {
        cellsToRemove = 42 + Math.floor(Math.random() * 5); // 42-46 cells out (medium)
      } else {
        cellsToRemove = 52 + Math.floor(Math.random() * 6); // 52-57 cells out (hard)
      }
    }

    const positions = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        positions.push({ r, c });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < cellsToRemove; i++) {
      const pos = positions[i];
      start[pos.r][pos.c] = 0;
    }

    return start;
  };

  // Setup UI elements inside a container
  const init = (containerId, difficulty = "easy") => {
    activeDifficulty = difficulty;
    hintCount = 3;
    isGameWon = false;
    
    const list = window.UmnikPuzzles ? window.UmnikPuzzles.sudokus[difficulty] : [];
    if (!list || list.length === 0) {
      document.getElementById(containerId).innerHTML = "<div class='text-center p-6 text-red-500'>Възникна грешка при зареждане на играта!</div>";
      return;
    }

    // Pick a random template puzzle to keep title and emojis matches, avoiding the current one if possible
    let availableTemplates = list;
    if (activePuzzle && list.length > 1) {
      availableTemplates = list.filter(p => p.id !== activePuzzle.id);
    }
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    const template = availableTemplates[randomIndex];
    
    // Deep copy template structure
    activePuzzle = JSON.parse(JSON.stringify(template));

    // Generatively build unique solved and starting boards dynamically
    const solutionGrid = generateSudokuBoard(activePuzzle.size);
    const startGrid = createPuzzleGrid(solutionGrid, activePuzzle.size);

    activePuzzle.solution = solutionGrid;
    activePuzzle.start = startGrid;

    // Initialize gridState from puzzle starting layout
    gridState = activePuzzle.start.map(row => [...row]);
    
    // Find first empty cell to select initially
    selectedCell = { row: -1, col: -1 };
    let found = false;
    for (let r = 0; r < activePuzzle.size; r++) {
      for (let c = 0; c < activePuzzle.size; c++) {
        if (gridState[r][c] === 0) {
          selectedCell = { row: r, col: c };
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // If fully pre-solved for some reason, default selection to first cell
    if (selectedCell.row === -1) {
      selectedCell = { row: 0, col: 0 };
    }

    render(containerId);
  };

  // Safe checks
  const isCellImmutable = (row, col) => {
    return activePuzzle.start[row][col] !== 0;
  };

  // Provide a hint
  const triggerHint = () => {
    if (hintCount <= 0) return;

    // Find all empty or incorrect cells
    const targetCells = [];
    for (let r = 0; r < activePuzzle.size; r++) {
      for (let c = 0; c < activePuzzle.size; c++) {
        if (!isCellImmutable(r, c) && gridState[r][c] !== activePuzzle.solution[r][c]) {
          targetCells.push({ r, c });
        }
      }
    }

    if (targetCells.length === 0) return; // Already solved or perfect

    // Choose random incorrect/empty cell
    const randomCell = targetCells[Math.floor(Math.random() * targetCells.length)];
    const correctVal = activePuzzle.solution[randomCell.r][randomCell.c];
    
    gridState[randomCell.r][randomCell.c] = correctVal;
    hintCount--;

    if (window.UmnikAudio) window.UmnikAudio.playSparkle();

    // Update UI
    document.getElementById("btn-sd-hint-label").innerText = `💡 Подсказака (${hintCount})`;
    if (hintCount <= 0) {
      document.getElementById("btn-sd-hint").disabled = true;
      document.getElementById("btn-sd-hint").classList.add("opacity-50", "cursor-not-allowed");
    }

    // Re-render cell values
    updateGridDisplay();
    checkSudokuComplete();
  };

  const updateGridDisplay = () => {
    for (let r = 0; r < activePuzzle.size; r++) {
      for (let c = 0; c < activePuzzle.size; c++) {
        const cellEl = document.getElementById(`sd_cell_${r}_${c}`);
        if (!cellEl) continue;

        // Clear all potential background, text, and border state classes to prevent Tailwind cascade conflicts
        cellEl.classList.remove(
          "bg-white",
          "bg-slate-100",
          "bg-yellow-200",
          "bg-rose-100",
          "bg-indigo-50",
          "bg-indigo-50/40",
          "text-rose-500",
          "text-indigo-700",
          "text-slate-900",
          "ring-2",
          "ring-yellow-400"
        );

        const val = gridState[r][c];
        const displayVal = val > 0 
          ? (activePuzzle.type === "emoji" ? activePuzzle.symbols[val - 1] : val) 
          : "";

        const valSpan = cellEl.querySelector(".sd-val-span");
        if (valSpan) {
          valSpan.innerText = displayVal;
        }

        const isImmutable = isCellImmutable(r, c);

        // Apply the single correct style block deterministically
        if (r === selectedCell.row && c === selectedCell.col) {
          cellEl.classList.add("bg-yellow-200", "ring-2", "ring-yellow-400");
          cellEl.classList.add(isImmutable ? "text-slate-900" : "text-indigo-700");
        } else if (!isImmutable && showErrors && val > 0 && val !== activePuzzle.solution[r][c]) {
          cellEl.classList.add("text-rose-500", "bg-rose-100");
        } else if (r === selectedCell.row || c === selectedCell.col) {
          cellEl.classList.add("bg-indigo-50");
          cellEl.classList.add(isImmutable ? "text-slate-900" : "text-indigo-700");
        } else {
          if (isImmutable) {
            cellEl.classList.add("bg-slate-100", "text-slate-900");
          } else {
            cellEl.classList.add("bg-white", "text-indigo-700");
          }
        }
      }
    }
  };

  // Apply value selection
  const setCellValue = (value) => {
    if (selectedCell.row === -1 || selectedCell.col === -1) return;
    if (isCellImmutable(selectedCell.row, selectedCell.col)) return;

    gridState[selectedCell.row][selectedCell.col] = value;

    if (window.UmnikAudio) window.UmnikAudio.playPop();
    
    updateGridDisplay();
    checkSudokuComplete();
  };

  const checkSudokuComplete = () => {
    if (isGameWon) return;

    let completed = true;
    for (let r = 0; r < activePuzzle.size; r++) {
      for (let c = 0; c < activePuzzle.size; c++) {
        if (gridState[r][c] !== activePuzzle.solution[r][c]) {
          completed = false;
          break;
        }
      }
      if (!completed) break;
    }

    if (completed) {
      isGameWon = true;
      triggerVictory();
    }
  };

  const triggerVictory = () => {
    if (window.UmnikAudio) window.UmnikAudio.playLevelComplete();

    let rewardStars = 5;
    if (activeDifficulty === "medium") rewardStars = 10;
    if (activeDifficulty === "hard") rewardStars = 15;

    let newBadges = [];
    if (window.UmnikProgress) {
      newBadges = window.UmnikProgress.recordGameComplete("sudoku", activePuzzle.id, rewardStars);
    }

    // Render Victory Overlay Modal
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in";
    
    const mascot = window.UmnikCharacters ? window.UmnikCharacters.get("umko") : null;
    const quote = window.UmnikCharacters ? window.UmnikCharacters.getRandomQuote("umko", "levelComplete") : "Браво!";
    const avatarHtml = mascot ? mascot.getAvatarSvg("w-28 h-28 mx-auto") : "🦉";

    let badgeNotificationHtml = "";
    if (newBadges.length > 0) {
      newBadges.forEach(bId => {
        const badge = window.UmnikProgress.getBadgeInfo(bId);
        if (badge) {
          badgeNotificationHtml += `
            <div class="mt-4 p-3 bg-indigo-50 rounded-2xl flex items-center gap-3 border border-indigo-100 animate-bounce">
              <span class="text-3xl">${badge.icon}</span>
              <div class="text-left">
                <p class="text-xs text-indigo-500 font-bold">Нова значка!</p>
                <p class="text-sm font-bold text-indigo-900">${badge.title}</p>
              </div>
            </div>
          `;
        }
      });
    }

    overlay.innerHTML = `
      <div class="bg-white rounded-[40px] p-8 max-w-md w-full text-center border-8 border-[#FBBF24] shadow-2xl relative overflow-hidden transform scale-100 transition-transform animate-fade-in">
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-[#FEF3C7] rounded-full opacity-40 blur-xl"></div>
        
        <div class="mb-4 bg-amber-50 p-3 rounded-3xl border-2 border-[#FEF3C7] inline-block">${avatarHtml}</div>
        
        <h2 class="text-2xl font-black text-amber-950 uppercase tracking-tight mb-2">Супер судоку майстор!</h2>
        
        <p class="text-blue-900 bg-blue-50 p-4 rounded-2xl border-2 border-blue-200 mb-6 font-bold leading-relaxed">
          "${quote}"
        </p>

        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="text-center bg-[#FEF3C7] px-5 py-3 rounded-2xl border-4 border-[#FBBF24] shadow-md select-none">
            <span class="text-xl font-black text-yellow-700 leading-none">+${rewardStars} Звезди</span>
            <span class="text-2xl">⭐</span>
          </div>
        </div>

        ${badgeNotificationHtml}

        <button id="btn-sd-victory-close" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 border-4 border-slate-800 text-white font-black text-lg rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer">
          Страхотно, благодаря!
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btn-sd-victory-close").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      overlay.remove();
      if (window.UmnikApp) window.UmnikApp.goBack();
    });
  };

  const render = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = activePuzzle.size;
    
    // Determine grid borders based on size (4x4, 6x6, 9x9 box divisions)
    let gridColsClass = "grid-cols-4";
    if (size === 6) gridColsClass = "grid-cols-6";
    if (size === 9) gridColsClass = "grid-cols-9";

    let gridCellsHtml = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = gridState[r][c];
        const isImmutable = isCellImmutable(r, c);
        const displayVal = val > 0 
          ? (activePuzzle.type === "emoji" ? activePuzzle.symbols[val - 1] : val) 
          : "";

        // Detect box borders for visual thick lines
        let borders = "border border-slate-300";
        
        // 4x4 has 2x2 boxes
        if (size === 4) {
          if (r === 1) borders += " border-b-4 border-b-slate-500";
          if (c === 1) borders += " border-r-4 border-r-slate-500";
        }
        // 6x6 has 2 rows of 3 cols boxes
        else if (size === 6) {
          if (r === 1 || r === 3) borders += " border-b-4 border-b-slate-500";
          if (c === 2) borders += " border-r-4 border-r-slate-500";
        }
        // 9x9 has 3x3 boxes
        else if (size === 9) {
          if (r === 2 || r === 5) borders += " border-b-4 border-b-slate-500";
          if (c === 2 || c === 5) borders += " border-r-4 border-r-slate-500";
        }

        const bgClass = isImmutable ? "bg-slate-100 font-black text-slate-900" : "bg-white font-black text-indigo-700";
        const fontSizeClass = size === 9 ? "text-base md:text-lg" : "text-xl md:text-2xl";

        gridCellsHtml += `
          <div 
            class="sd-cell-box aspect-square relative flex items-center justify-center select-none cursor-pointer rounded-xl transition-all ${borders} ${bgClass} ${fontSizeClass}"
            data-row="${r}"
            data-col="${c}"
            id="sd_cell_${r}_${c}"
          >
            <span class="sd-val-span">${displayVal}</span>
          </div>
        `;
      }
    }

    // Number selector pad for bottom interface
    let numberPadHtml = "";
    
    // Add "X" or "Eraser" button first
    numberPadHtml += `
      <button 
        class="sd-pad-key w-12 h-12 md:w-14 md:h-14 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center justify-center font-black text-rose-700 shadow-sm active:translate-y-0.5 transition-all select-none cursor-pointer hover:bg-rose-100"
        data-val="0"
        title="Изтрий"
      >
        ❌
      </button>
    `;

    for (let i = 1; i <= size; i++) {
      const displaySym = activePuzzle.type === "emoji" ? activePuzzle.symbols[i - 1] : i;
      numberPadHtml += `
        <button 
          class="sd-pad-key w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-indigo-300 rounded-xl flex items-center justify-center font-black text-lg md:text-xl text-indigo-900 shadow-sm active:translate-y-0.5 transition-all select-none cursor-pointer hover:bg-indigo-50"
          data-val="${i}"
        >
          ${displaySym}
        </button>
      `;
    }

    const mascot = window.UmnikCharacters ? window.UmnikCharacters.get("umko") : null;
    const avatarHtml = mascot ? mascot.getAvatarSvg("w-14 h-14") : "🦉";

    container.innerHTML = `
      <div class="flex flex-col gap-6 max-w-5xl mx-auto">
        <!-- Header Controls -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-[32px] border-4 border-[#FBBF24] shadow-sm">
          <div class="flex items-center gap-3">
            <button id="btn-sd-back" class="px-5 py-2 bg-[#EDF2F7] border-4 border-[#CBD5E0] text-[#2D3748] font-black rounded-2xl hover:bg-gray-100 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 touch-target">
              ← Назад
            </button>
            <div>
              <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wide leading-none mb-1 block">Судоку</span>
              <h1 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">${activePuzzle.title}</h1>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-sd-regenerate" class="px-5 py-2 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FBBF24] hover:text-amber-950 border-2 border-[#FBBF24] active:scale-95 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-sm touch-target">
              🔄 Нова игра
            </button>
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="flex flex-col gap-6 max-w-lg mx-auto w-full">
          <!-- Mascot Advice -->
          <div class="flex items-start gap-4 p-4 bg-white border-4 border-[#3B82F6] rounded-[32px] shadow-md w-full">
            <div class="bg-blue-50 p-2.5 rounded-2xl border-2 border-blue-300">${avatarHtml}</div>
            <div class="flex-1">
              <h4 class="font-black text-blue-900 text-sm uppercase tracking-tight">Умко казва:</h4>
              <p class="text-blue-800 text-xs md:text-sm font-bold italic leading-relaxed mt-0.5">
                "${window.UmnikCharacters.getRandomQuote("umko", "welcome")}"
              </p>
            </div>
          </div>

          <!-- Board Grid -->
          <div class="flex flex-col items-center justify-center bg-white p-4 md:p-6 rounded-[32px] border-4 border-[#E2E8F0] shadow-md w-full">
            <!-- Board container with adaptive sizing max-w -->
            <div class="w-full max-w-sm md:max-w-md aspect-square grid gap-1 border-4 border-slate-700 bg-slate-300 p-1.5 rounded-2xl shadow-md ${gridColsClass}">
              ${gridCellsHtml}
            </div>
          </div>
        </div>

        <!-- Unified Input Panel Container -->
        <div id="unified-input-panel-container"></div>

        <!-- Helpers Dropdown Menu at the End of the Page -->
        <div class="max-w-lg mx-auto w-full mt-2">
          <details class="group bg-white rounded-[24px] border-4 border-[#CBD5E0] shadow-md overflow-hidden transition-all duration-300">
            <summary class="flex items-center justify-between p-4 font-black text-slate-800 uppercase tracking-tight text-sm md:text-base cursor-pointer select-none hover:bg-slate-50 active:bg-slate-100 list-none [&::-webkit-details-marker]:hidden">
              <span class="flex items-center gap-2">⚙️ Помощници и настройки</span>
              <span class="transition-transform duration-300 group-open:rotate-180">▼</span>
            </summary>
            <div class="p-5 border-t-4 border-[#CBD5E0] flex flex-col gap-5 bg-slate-50/50">
              <!-- Help Hint Button -->
              <div class="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                  <h4 class="font-black text-slate-800 text-xs md:text-sm">Търсиш отговор?</h4>
                  <p class="text-slate-500 text-[11px] md:text-xs">Умко ще попълни една вярна клетка за теб!</p>
                </div>
                <button 
                  id="btn-sd-hint" 
                  class="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 select-none"
                  ${hintCount <= 0 ? "disabled class='opacity-50 cursor-not-allowed'" : ""}
                >
                  <span id="btn-sd-hint-label">💡 Подсказка (${hintCount})</span>
                </button>
              </div>

              <!-- Errors Toggle -->
              <label class="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer select-none shadow-sm">
                <div>
                  <h4 class="font-black text-slate-800 text-xs md:text-sm">Показвай грешките</h4>
                  <p class="text-slate-500 text-[11px] md:text-xs">Грешно въведените клетки ще се оцветят в червено.</p>
                </div>
                <div class="relative inline-block w-11 h-6">
                  <input type="checkbox" id="toggle-sd-errors" class="peer sr-only" ${showErrors ? "checked" : ""}>
                  <div class="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                </div>
              </label>

              <!-- Prompt on how to play -->
              <div class="p-4 bg-violet-50 rounded-2xl border-2 border-violet-200 flex items-start gap-2.5">
                <span class="text-lg">⭐</span>
                <p class="text-[11px] md:text-xs text-violet-800 leading-relaxed font-bold">
                  <strong>Как се играе:</strong> Избери празна клетка от мрежата вляво, след това избери символ от цифрите или емоджитата отдолу, за да я попълниш. Всеки символ трябва да се среща само по веднъж на всеки ред, стълб и блок!
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div id="sd-confirm-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-8 border-orange-400 shadow-2xl animate-fade-in">
          <span class="text-5xl block mb-3">🤔</span>
          <h3 class="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Нова игра?</h3>
          <p class="text-slate-600 text-xs font-bold leading-relaxed mb-6">
            Сигурен ли си, че искаш да започнеш нова игра? Сегашният ти прогрес в това раздаване ще се загуби!
          </p>
          <div class="flex gap-3">
            <button id="btn-sd-confirm-yes" class="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-white font-black rounded-2xl border-2 border-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Да, давай!
            </button>
            <button id="btn-sd-confirm-no" class="flex-1 py-3 bg-[#EDF2F7] hover:bg-slate-200 text-[#2D3748] border-2 border-[#CBD5E0] font-black rounded-2xl cursor-pointer">
              Остани
            </button>
          </div>
        </div>
      </div>
    `;

    // Apply initial highlighting
    updateGridDisplay();

    // Initialize the Unified Input Panel
    if (window.UmnikInputPanel) {
      window.UmnikInputPanel.init("unified-input-panel-container", "sudoku");
    }

    // Attach Event Listeners
    attachEventListeners(containerId);
  };

  const attachEventListeners = (containerId) => {
    // 1. Back button
    document.getElementById("btn-sd-back").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      if (window.UmnikApp) window.UmnikApp.goBack();
    });

    // 2. Regenerate button
    document.getElementById("btn-sd-regenerate").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("sd-confirm-modal").classList.remove("hidden");
    });

    // 3. Confirm modal "No"
    document.getElementById("btn-sd-confirm-no").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("sd-confirm-modal").classList.add("hidden");
    });

    // 4. Confirm modal "Yes"
    document.getElementById("btn-sd-confirm-yes").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("sd-confirm-modal").classList.add("hidden");
      init(containerId, activeDifficulty);
    });

    // 5. Grid Cell Selection Click
    const cells = document.querySelectorAll(".sd-cell-box");
    cells.forEach(cell => {
      cell.addEventListener("click", () => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        selectedCell = { row, col };
        updateGridDisplay();
      });
    });

    // 6. Number Pad Button Click
    const keys = document.querySelectorAll(".sd-pad-key");
    keys.forEach(key => {
      key.addEventListener("click", () => {
        const val = parseInt(key.dataset.val);
        setCellValue(val);
      });
    });

    // 7. Hint Button Click
    document.getElementById("btn-sd-hint").addEventListener("click", () => {
      triggerHint();
    });

    // 8. Errors Toggle Switch
    document.getElementById("toggle-sd-errors").addEventListener("change", (e) => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      showErrors = e.target.checked;
      updateGridDisplay();
    });

    // 9. Physical Keyboard Inputs (1-9 and Backspace/Delete/0)
    const handleKeyDown = (e) => {
      if (selectedCell.row === -1 || selectedCell.col === -1) return;
      if (isCellImmutable(selectedCell.row, selectedCell.col)) return;

      const numVal = parseInt(e.key);
      if (!isNaN(numVal) && numVal >= 1 && numVal <= activePuzzle.size) {
        e.preventDefault();
        setCellValue(numVal);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        setCellValue(0); // clear
      }
    };

    window._sdKeyListener = handleKeyDown;
    window.addEventListener("keydown", handleKeyDown);
  };

  const destroy = () => {
    if (window._sdKeyListener) {
      window.removeEventListener("keydown", window._sdKeyListener);
      delete window._sdKeyListener;
    }
  };

  return {
    init,
    destroy,
    setCellValue,
    deleteCellValue: () => setCellValue(0)
  };
})();

// Assign to window for global access
window.UmnikSudoku = UmnikSudoku;
