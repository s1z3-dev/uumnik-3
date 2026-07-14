/**
 * Umnik Crossword Game Engine
 * Generates interactive Bulgarian crosswords, handles input, tracks cell coordinates,
 * and renders a beautiful virtual keyboard and child-friendly confirmation modals.
 */

const UmnikCrossword = (() => {
  let activePuzzle = null;
  let activeDifficulty = "easy";
  let currentWordId = null; // currently focused word ID
  let selectedCell = { row: -1, col: -1 }; // currently focused cell coord
  let userValues = {}; // key: "row_col", value: "LETTER"
  let solvedWords = []; // array of word IDs that are fully solved correctly
  let isGameWon = false;

  // Phonetic/homoglyph transliteration helper to ensure typing works on English layouts
  const mapKeyToCyrillic = (key) => {
    if (!key) return "";
    const upperKey = key.toUpperCase();
    
    // Check if it's already a Bulgarian Cyrillic letter
    if (/^[А-Я]$/i.test(upperKey)) {
      return upperKey;
    }
    
    // Phonetic Latin-to-Cyrillic mapping for Bulgarian layout
    const map = {
      'A': 'А', 'B': 'Б', 'W': 'В', 'G': 'Г', 'D': 'Д', 'E': 'Е', 'V': 'Ж', 'Z': 'З',
      'I': 'И', 'J': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О', 'P': 'П',
      'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц',
      '`': 'Ч', '~': 'Ч', '[': 'Ш', ']': 'Щ', 'Y': 'Ъ', 'X': 'Ь', '\\': 'Ю', '|': 'Ю', 'Q': 'Я'
    };
    
    return map[upperKey] || "";
  };

  // ------------------------------------------------------------
  // DYNAMIC CROSSWORD LAYOUT GENERATOR FOR 100+ PUZZLES
  // ------------------------------------------------------------
  const getBounds = (words) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const w of words) {
      const len = w.text.length;
      const endX = w.x + (w.dir === 'H' ? len - 1 : 0);
      const endY = w.y + (w.dir === 'V' ? len - 1 : 0);
      if (w.x < minX) minX = w.x;
      if (endX > maxX) maxX = endX;
      if (w.y < minY) minY = w.y;
      if (endY > maxY) maxY = endY;
    }
    return { minX, maxX, minY, maxY };
  };

  const isValidPlacement = (cx, cy, cdir, wordText, placedWords) => {
    for (let i = 0; i < wordText.length; i++) {
      const px = cx + (cdir === 'H' ? i : 0);
      const py = cy + (cdir === 'V' ? i : 0);

      let cellOccupied = false;

      for (const placed of placedWords) {
        const plen = placed.text.length;
        const isWithinX = px >= placed.x && px <= placed.x + (placed.dir === 'H' ? plen - 1 : 0);
        const isWithinY = py >= placed.y && py <= placed.y + (placed.dir === 'V' ? plen - 1 : 0);

        if (isWithinX && isWithinY) {
          cellOccupied = true;
          const placedCharIdx = placed.dir === 'H' ? px - placed.x : py - placed.y;
          if (placed.text[placedCharIdx] !== wordText[i]) {
            return false; // Letter conflict!
          }
        }
      }

      if (!cellOccupied) {
        // Check immediate parallel neighbours
        const adjCheck = cdir === 'H' 
          ? [{ x: px, y: py - 1 }, { x: px, y: py + 1 }]
          : [{ x: px - 1, y: py }, { x: px + 1, y: py }];

        for (const adj of adjCheck) {
          for (const placed of placedWords) {
            const plen = placed.text.length;
            const isWithinX = adj.x >= placed.x && adj.x <= placed.x + (placed.dir === 'H' ? plen - 1 : 0);
            const isWithinY = adj.y >= placed.y && adj.y <= placed.y + (placed.dir === 'V' ? plen - 1 : 0);
            if (isWithinX && isWithinY) {
              return false; // Touching parallel letters from another word!
            }
          }
        }
      }
    }

    // Check cells right before and after the word to avoid run-on words
    const beforeCell = cdir === 'H' ? { x: cx - 1, y: cy } : { x: cx, y: cy - 1 };
    const afterCell = cdir === 'H' ? { x: cx + wordText.length, y: cy } : { x: cx, y: cy + wordText.length };

    for (const cell of [beforeCell, afterCell]) {
      for (const placed of placedWords) {
        const plen = placed.text.length;
        const isWithinX = cell.x >= placed.x && cell.x <= placed.x + (placed.dir === 'H' ? plen - 1 : 0);
        const isWithinY = cell.y >= placed.y && cell.y <= placed.y + (placed.dir === 'V' ? plen - 1 : 0);
        if (isWithinX && isWithinY) {
          return false; // Boundary overlap conflict!
        }
      }
    }

    return true;
  };

  const generateCrosswordLayout = (basePuzzle) => {
    const originalWords = basePuzzle.words.map((w, idx) => ({
      text: w.word.toUpperCase(),
      clue: w.clue,
      originalIndex: idx
    }));

    let bestLayout = null;
    let bestScore = -1;

    // Run 50 shuffles and choose the best layout
    for (let attempt = 0; attempt < 50; attempt++) {
      const placedWords = [];
      let remaining = [...originalWords];

      // Shuffle or sort
      if (attempt === 0) {
        remaining = remaining.sort((a, b) => b.text.length - a.text.length);
      } else {
        remaining = remaining.sort(() => Math.random() - 0.5);
      }

      // Start with the first word at (0, 0, 'H')
      const first = remaining.shift();
      placedWords.push({
        text: first.text,
        clue: first.clue,
        x: 0,
        y: 0,
        dir: 'H',
        originalIndex: first.originalIndex
      });

      const unplaced = [];

      for (const item of remaining) {
        const candidates = [];
        for (const placed of placedWords) {
          for (let i = 0; i < item.text.length; i++) {
            const char = item.text[i];
            for (let j = 0; j < placed.text.length; j++) {
              if (placed.text[j] === char) {
                const nextDir = placed.dir === 'H' ? 'V' : 'H';
                const ix = placed.x + (placed.dir === 'H' ? j : 0);
                const iy = placed.y + (placed.dir === 'V' ? j : 0);
                const sx = ix - (nextDir === 'H' ? i : 0);
                const sy = iy - (nextDir === 'V' ? i : 0);

                candidates.push({ x: sx, y: sy, dir: nextDir });
              }
            }
          }
        }

        let bestCand = null;
        let minArea = Infinity;

        for (const cand of candidates) {
          if (isValidPlacement(cand.x, cand.y, cand.dir, item.text, placedWords)) {
            const tempPlaced = [...placedWords, { ...cand, text: item.text }];
            const bounds = getBounds(tempPlaced);
            const area = (bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1);
            if (area < minArea) {
              minArea = area;
              bestCand = cand;
            }
          }
        }

        if (bestCand) {
          placedWords.push({
            text: item.text,
            clue: item.clue,
            x: bestCand.x,
            y: bestCand.y,
            dir: bestCand.dir,
            originalIndex: item.originalIndex
          });
        } else {
          unplaced.push(item);
        }
      }

      // If we couldn't place some words via standard intersections, apply fallback placements with spacing
      if (unplaced.length > 0) {
        for (const item of unplaced) {
          const currentBounds = getBounds(placedWords);
          // Place horizontally 2 rows below the current bottom
          const sx = currentBounds.minX;
          const sy = currentBounds.maxY + 2;
          placedWords.push({
            text: item.text,
            clue: item.clue,
            x: sx,
            y: sy,
            dir: 'H',
            originalIndex: item.originalIndex
          });
        }
      }

      // Evaluate score of this complete layout
      const bounds = getBounds(placedWords);
      const width = bounds.maxX - bounds.minX + 1;
      const height = bounds.maxY - bounds.minY + 1;
      const area = width * height;
      
      let connectedCount = 0;
      for (const w1 of placedWords) {
        let hasIntersection = false;
        for (const w2 of placedWords) {
          if (w1 === w2) continue;
          for (let i = 0; i < w1.text.length; i++) {
            const px1 = w1.x + (w1.dir === 'H' ? i : 0);
            const py1 = w1.y + (w1.dir === 'V' ? i : 0);
            for (let j = 0; j < w2.text.length; j++) {
              const px2 = w2.x + (w2.dir === 'H' ? j : 0);
              const py2 = w2.y + (w2.dir === 'V' ? j : 0);
              if (px1 === px2 && py1 === py2) {
                hasIntersection = true;
                break;
              }
            }
            if (hasIntersection) break;
          }
        }
        if (hasIntersection) connectedCount++;
      }

      const score = (connectedCount * 1000) - area;

      if (score > bestScore) {
        bestScore = score;
        bestLayout = {
          placedWords,
          bounds,
          width,
          height
        };
      }

      if (connectedCount === originalWords.length && width <= 15 && height <= 15 && attempt > 10) {
        break;
      }
    }

    const shiftX = -bestLayout.bounds.minX;
    const shiftY = -bestLayout.bounds.minY;

    const finalWords = bestLayout.placedWords.map((w, idx) => ({
      id: idx + 1,
      word: w.text,
      clue: w.clue,
      x: w.x + shiftX,
      y: w.y + shiftY,
      dir: w.dir
    }));

    return {
      id: basePuzzle.id,
      title: basePuzzle.title,
      theme: basePuzzle.theme,
      gridSize: {
        rows: bestLayout.height,
        cols: bestLayout.width
      },
      words: finalWords
    };
  };

  // Setup UI elements inside a container
  const init = (containerId, difficulty = "easy") => {
    activeDifficulty = difficulty;
    
    // Select a puzzle of this difficulty
    const list = window.UmnikPuzzles ? window.UmnikPuzzles.crosswords[difficulty] : [];
    if (!list || list.length === 0) {
      document.getElementById(containerId).innerHTML = "<div class='text-center p-6 text-red-500'>Възникна грешка при зареждане на играта!</div>";
      return;
    }

    // Pick a random puzzle from list, trying to avoid the current one if possible
    let availablePuzzles = list;
    if (activePuzzle && list.length > 1) {
      availablePuzzles = list.filter(p => p.id !== activePuzzle.id);
    }
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    const rawPuzzle = availablePuzzles[randomIndex];
    
    // Dynamically lay out the crossword!
    activePuzzle = generateCrosswordLayout(rawPuzzle);

    // Reset state
    userValues = {};
    solvedWords = [];
    isGameWon = false;
    currentWordId = activePuzzle.words[0].id;
    selectedCell = { row: activePuzzle.words[0].y, col: activePuzzle.words[0].x };

    render(containerId);
  };

  // Check if a word is fully solved and correct
  const checkWordSolved = (word) => {
    for (let i = 0; i < word.word.length; i++) {
      const col = word.x + (word.dir === 'H' ? i : 0);
      const row = word.y + (word.dir === 'V' ? i : 0);
      const val = userValues[`${row}_${col}`] || "";
      if (val !== word.word[i]) {
        return false;
      }
    }
    return true;
  };

  // Check entire crossword puzzle
  const checkCrosswordStatus = () => {
    if (isGameWon) return;

    let allSolved = true;
    const newSolvedWords = [];

    activePuzzle.words.forEach(word => {
      const isSolved = checkWordSolved(word);
      if (isSolved) {
        newSolvedWords.push(word.id);
      } else {
        allSolved = false;
      }
    });

    // See if any word just became solved
    let solvedWordsChanged = false;
    newSolvedWords.forEach(wId => {
      if (!solvedWords.includes(wId)) {
        solvedWords.push(wId);
        solvedWordsChanged = true;
      }
    });

    if (solvedWordsChanged) {
      if (window.UmnikAudio) window.UmnikAudio.playSuccess();
      updateGridStyles();
      updateClueListStyles();
    }

    if (allSolved) {
      isGameWon = true;
      triggerVictory();
    }
  };

  const setCellValue = (letter) => {
    if (selectedCell.row === -1 || selectedCell.col === -1) return;

    const keyCoord = `${selectedCell.row}_${selectedCell.col}`;
    
    // Save typed letter
    userValues[keyCoord] = letter.toUpperCase();

    // Update display on DOM directly to feel fast
    const cellEl = document.getElementById(`cw_cell_${selectedCell.row}_${selectedCell.col}`);
    if (cellEl) {
      const letterSpan = cellEl.querySelector(".cw-letter-span");
      if (letterSpan) {
        letterSpan.innerText = letter.toUpperCase();
      }
    }

    // Advance cursor to the next cell in the active word direction
    const word = activePuzzle.words.find(w => w.id === currentWordId);
    if (word) {
      const currentIndexInWord = word.dir === 'H' 
        ? selectedCell.col - word.x 
        : selectedCell.row - word.y;
        
      if (currentIndexInWord < word.word.length - 1) {
        // Move cursor forward
        selectedCell.col += (word.dir === 'H' ? 1 : 0);
        selectedCell.row += (word.dir === 'V' ? 1 : 0);
      }
    }

    updateGridStyles();
    checkCrosswordStatus();
  };

  const deleteCellValue = () => {
    if (selectedCell.row === -1 || selectedCell.col === -1) return;

    const keyCoord = `${selectedCell.row}_${selectedCell.col}`;
    
    // If the current cell is empty, let's step back first
    const currentVal = userValues[keyCoord] || "";
    const word = activePuzzle.words.find(w => w.id === currentWordId);

    if (!currentVal && word) {
      const currentIndexInWord = word.dir === 'H' 
        ? selectedCell.col - word.x 
        : selectedCell.row - word.y;

      if (currentIndexInWord > 0) {
        // Move cursor backward
        selectedCell.col -= (word.dir === 'H' ? 1 : 0);
        selectedCell.row -= (word.dir === 'V' ? 1 : 0);
      }
    }

    // Clear the value
    const targetCoord = `${selectedCell.row}_${selectedCell.col}`;
    delete userValues[targetCoord];

    const cellEl = document.getElementById(`cw_cell_${selectedCell.row}_${selectedCell.col}`);
    if (cellEl) {
      const letterSpan = cellEl.querySelector(".cw-letter-span");
      if (letterSpan) {
        letterSpan.innerText = "";
      }
    }

    updateGridStyles();
    checkCrosswordStatus();
  };

  const updateGridStyles = () => {
    const cells = document.querySelectorAll(".cw-cell-box");
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      
      // Clear all possible highlight and utility classes to prevent lingering styles
      cell.classList.remove(
        "bg-yellow-100", "bg-yellow-200", "bg-indigo-50", "bg-indigo-100", 
        "border-indigo-500", "border-yellow-500", "bg-emerald-100", "border-emerald-500",
        "ring-2", "ring-yellow-400", "text-emerald-800"
      );

      const wordIds = cell.dataset.words ? cell.dataset.words.split(",") : [];
      const belongsToSolvedWord = wordIds.some(id => solvedWords.includes(parseInt(id)));

      if (belongsToSolvedWord) {
        cell.classList.add("bg-emerald-100", "border-emerald-500", "text-emerald-800");
      } else if (row === selectedCell.row && col === selectedCell.col) {
        cell.classList.add("bg-yellow-200", "border-yellow-500", "ring-2", "ring-yellow-400");
      } else {
        const belongsToCurrentWord = wordIds.includes(String(currentWordId));
        if (belongsToCurrentWord) {
          cell.classList.add("bg-indigo-50");
        }
      }
    });
  };

  const updateClueListStyles = () => {
    const items = document.querySelectorAll(".clue-item");
    items.forEach(item => {
      const wId = parseInt(item.dataset.wordId);
      item.classList.remove("text-emerald-600", "line-through", "bg-indigo-50", "border-indigo-200", "font-bold");
      
      if (solvedWords.includes(wId)) {
        item.classList.add("text-emerald-600", "line-through", "opacity-75");
      } else if (wId === currentWordId) {
        item.classList.add("bg-indigo-50", "border-indigo-200", "font-bold");
      }
    });
  };

  const triggerVictory = () => {
    if (window.UmnikAudio) window.UmnikAudio.playLevelComplete();
    
    // Reward calculation: 5 stars per difficulty level + bonus
    let rewardStars = 5;
    if (activeDifficulty === "medium") rewardStars = 10;
    if (activeDifficulty === "hard") rewardStars = 15;

    // Save progress safely
    let newBadges = [];
    if (window.UmnikProgress) {
      newBadges = window.UmnikProgress.recordGameComplete("crossword", activePuzzle.id, rewardStars);
    }

    // Render Victory Overlay Modal
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in";
    
    const mascot = window.UmnikCharacters ? window.UmnikCharacters.get("umko") : null;
    const quote = window.UmnikCharacters ? window.UmnikCharacters.getRandomQuote("umko", "levelComplete") : "Страхотно!";
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
        <div class="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-100 rounded-full opacity-40 blur-xl"></div>
        
        <div class="mb-4 bg-amber-50 p-3 rounded-3xl border-2 border-[#FEF3C7] inline-block">${avatarHtml}</div>
        
        <h2 class="text-2xl font-black text-amber-950 uppercase tracking-tight mb-2">Честито, умнико!</h2>
        
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

        <button id="btn-cw-victory-close" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 border-4 border-slate-800 text-white font-black text-lg rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer">
          Страхотно, благодаря!
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btn-cw-victory-close").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      overlay.remove();
      // Route back to game select dashboard
      if (window.UmnikApp) window.UmnikApp.goBack();
    });
  };

  // Render the whole view
  const render = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Generate Grid Matrix
    const rows = activePuzzle.gridSize.rows;
    const cols = activePuzzle.gridSize.cols;
    
    // Create matrix representing letters with support for multiple start numbers per cell
    const cellMatrix = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => ({
        active: false,
        letter: "",
        words: [],
        displayNums: []
      }))
    );

    activePuzzle.words.forEach((word) => {
      // Set the number on first cell of the word safely
      if (word.y < rows && word.x < cols) {
        if (!cellMatrix[word.y][word.x].displayNums.includes(word.id)) {
          cellMatrix[word.y][word.x].displayNums.push(word.id);
        }
      }
      
      for (let i = 0; i < word.word.length; i++) {
        const col = word.x + (word.dir === 'H' ? i : 0);
        const row = word.y + (word.dir === 'V' ? i : 0);
        
        if (row < rows && col < cols) {
          cellMatrix[row][col].active = true;
          cellMatrix[row][col].letter = word.word[i];
          if (!cellMatrix[row][col].words.includes(word.id)) {
            cellMatrix[row][col].words.push(word.id);
          }
        }
      }
    });

    // Determine dynamic styling based on grid columns to avoid cramped cells
    let borderStyle = "border-2 rounded-xl";
    let cellFontSize = "text-xl md:text-2xl";
    let numFontSize = "text-[9px] md:text-[10px]";
    if (cols > 12) {
      borderStyle = "border rounded-lg";
      cellFontSize = "text-sm md:text-lg";
      numFontSize = "text-[7px] md:text-[8px]";
    } else if (cols > 9) {
      borderStyle = "border-2 rounded-lg";
      cellFontSize = "text-base md:text-xl";
      numFontSize = "text-[8px] md:text-[9px]";
    }

    // Calculate maximum width of the grid container in pixels so it maintains a perfect ratio 
    // and fits within any responsive viewport without ever stretching into a giant square or overflowing.
    const maxGridHeight = 440;
    const calculatedMaxWidth = Math.min(440, Math.round(maxGridHeight * (cols / rows)));
    const gridStyle = `grid-template-columns: repeat(${cols}, minmax(0, 1fr)); max-width: ${calculatedMaxWidth}px; width: 100%;`;

    let gridCellsHtml = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cellMatrix[r][c];
        if (cell.active) {
          const key = `${r}_${c}`;
          const currentVal = userValues[key] || "";
          const displayNumStr = cell.displayNums && cell.displayNums.length > 0 ? cell.displayNums.join(",") : "";
          
          gridCellsHtml += `
            <div 
              class="cw-cell-box aspect-square ${borderStyle} border-slate-700 relative flex items-center justify-center font-black ${cellFontSize} text-slate-800 select-none cursor-pointer bg-white transition-all shadow-sm"
              data-row="${r}" 
              data-col="${c}"
              data-words="${cell.words.join(",")}"
              id="cw_cell_${r}_${c}"
            >
              ${displayNumStr ? `<span class="absolute top-0.5 left-1 text-indigo-500 font-black leading-none ${numFontSize}">${displayNumStr}</span>` : ""}
              <span class="cw-letter-span uppercase">${currentVal}</span>
            </div>
          `;
        } else {
          gridCellsHtml += `
            <div class="aspect-square bg-slate-50 ${borderStyle} border-dashed border-slate-200"></div>
          `;
        }
      }
    }

    // Separate Horizontal and Vertical clues
    const horizClues = activePuzzle.words.filter(w => w.dir === "H");
    const vertClues = activePuzzle.words.filter(w => w.dir === "V");

    let horizCluesHtml = "";
    horizClues.forEach(w => {
      horizCluesHtml += `
        <div class="clue-item p-2.5 rounded-xl border border-transparent text-slate-700 text-xs md:text-sm cursor-pointer transition-all hover:bg-slate-50 flex items-start gap-2 select-none" data-word-id="${w.id}">
          <span class="bg-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-md text-xs">${w.id}</span>
          <span class="leading-relaxed flex-1">${w.clue}</span>
        </div>
      `;
    });

    let vertCluesHtml = "";
    vertClues.forEach(w => {
      vertCluesHtml += `
        <div class="clue-item p-2.5 rounded-xl border border-transparent text-slate-700 text-xs md:text-sm cursor-pointer transition-all hover:bg-slate-50 flex items-start gap-2 select-none" data-word-id="${w.id}">
          <span class="bg-purple-500 text-white font-extrabold px-2 py-0.5 rounded-md text-xs">${w.id}</span>
          <span class="leading-relaxed flex-1">${w.clue}</span>
        </div>
      `;
    });

    // Virtual Keyboard rows
    const keysRow1 = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "Й"];
    const keysRow2 = ["К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У"];
    const keysRow3 = ["Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ь", "Ю", "Я"];

    const renderKeyboardRow = (rowKeys) => {
      return rowKeys.map(k => `
        <button class="kbd-key flex-1 py-2.5 md:py-3.5 bg-white border border-slate-300 rounded-lg font-bold text-sm md:text-base text-slate-700 shadow-sm active:scale-95 hover:bg-slate-50 transition-all select-none cursor-pointer">
          ${k}
        </button>
      `).join("");
    };

    const mascot = window.UmnikCharacters ? window.UmnikCharacters.get("umko") : null;
    const avatarHtml = mascot ? mascot.getAvatarSvg("w-14 h-14") : "🦉";
    const isMuted = window.UmnikAudio ? window.UmnikAudio.isMuted() : true;

    // Setup overall container layout
    container.innerHTML = `
      <div class="flex flex-col gap-6 max-w-5xl mx-auto">
        <!-- Header Controls -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-[32px] border-4 border-[#FBBF24] shadow-sm">
          <div class="flex items-center gap-3">
            <button id="btn-cw-back" class="px-5 py-2 bg-[#EDF2F7] border-4 border-[#CBD5E0] text-[#2D3748] font-black rounded-2xl hover:bg-gray-100 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 touch-target">
              ← Назад
            </button>
            <div>
              <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-wide leading-none mb-1 block">Кръстословица</span>
              <h1 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">${activePuzzle.title}</h1>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-cw-regenerate" class="px-5 py-2 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FBBF24] hover:text-amber-950 border-2 border-[#FBBF24] active:scale-95 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-sm touch-target">
              🔄 Нова игра
            </button>
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- LEFT SIDE: Grid -->
          <div class="lg:col-span-7 flex flex-col items-center justify-center bg-white p-4 md:p-6 rounded-[32px] border-4 border-[#E2E8F0] shadow-md min-h-[300px] md:min-h-[460px]">
            <div class="grid gap-1 md:gap-1.5 mb-2 animate-fade-in" style="${gridStyle}">
              ${gridCellsHtml}
            </div>
          </div>

          <!-- RIGHT SIDE: Clues and Mascots -->
          <div class="lg:col-span-5 flex flex-col gap-6">
            <!-- Mascot Panel -->
            <div class="flex items-start gap-4 p-4 bg-white border-4 border-[#3B82F6] rounded-[32px] shadow-md">
              <div class="bg-blue-50 p-2.5 rounded-2xl border-2 border-blue-300">${avatarHtml}</div>
              <div class="flex-1">
                <h4 class="font-black text-blue-900 text-sm uppercase tracking-tight">Умко казва:</h4>
                <p id="cw-mascot-speech" class="text-blue-800 text-xs md:text-sm font-bold italic leading-relaxed mt-0.5">
                  "${window.UmnikCharacters.getRandomQuote("umko", "welcome")}"
                </p>
              </div>
            </div>

            <!-- Clues Panel -->
            <div class="bg-white p-4 md:p-5 rounded-[32px] border-4 border-[#CBD5E0] shadow-md flex-1 flex flex-col min-h-[220px]">
              <h3 class="font-black text-slate-800 uppercase tracking-tight text-sm md:text-base mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <span>📝 Подсказки за думите</span>
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[240px] pr-1">
                <!-- Horizontal Clues -->
                <div>
                  <h4 class="text-xs font-black text-indigo-600 uppercase tracking-wide mb-2">➡️ Хоризонтално</h4>
                  <div class="flex flex-col gap-1.5">${horizCluesHtml}</div>
                </div>
                <!-- Vertical Clues -->
                <div>
                  <h4 class="text-xs font-black text-purple-600 uppercase tracking-wide mb-2">⬇️ Вертикално</h4>
                  <div class="flex flex-col gap-1.5">${vertCluesHtml}</div>
                </div>
              </div>
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
              <!-- Sound Toggle -->
              <label class="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer select-none shadow-sm">
                <div>
                  <h4 class="font-black text-slate-800 text-xs md:text-sm">Звукови ефекти</h4>
                  <p class="text-slate-500 text-[11px] md:text-xs">Включи симпатичните звукови ефекти при игра.</p>
                </div>
                <div class="relative inline-block w-11 h-6">
                  <input type="checkbox" id="toggle-cw-sound" class="peer sr-only" ${!isMuted ? "checked" : ""}>
                  <div class="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                </div>
              </label>

              <!-- Prompt on how to play -->
              <div class="p-4 bg-violet-50 rounded-2xl border-2 border-violet-200 flex items-start gap-2.5">
                <span class="text-lg">⭐</span>
                <p class="text-[11px] md:text-xs text-violet-800 leading-relaxed font-bold">
                  <strong>Как се играе:</strong> Избери празна клетка от кръстословицата, след това напиши буква от клавиатурата отдолу, за да я попълниш. Попълни всички думи хоризонтално и вертикално според подсказките!
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Confirmation Modal (Hidden by default) -->
      <div id="cw-confirm-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-8 border-orange-400 shadow-2xl animate-fade-in">
          <span class="text-5xl block mb-3">🤔</span>
          <h3 class="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Нова игра?</h3>
          <p class="text-slate-600 text-xs font-bold leading-relaxed mb-6">
            Сигурен ли си, че искаш да започнеш нова игра? Сегашният ти прогрес в това раздаване ще се загуби!
          </p>
          <div class="flex gap-3">
            <button id="btn-cw-confirm-yes" class="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-white font-black rounded-2xl border-2 border-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Да, давай!
            </button>
            <button id="btn-cw-confirm-no" class="flex-1 py-3 bg-[#EDF2F7] hover:bg-slate-200 text-[#2D3748] border-2 border-[#CBD5E0] font-black rounded-2xl cursor-pointer">
              Остани
            </button>
          </div>
        </div>
      </div>
    `;

    // Apply styles to initial highlights
    updateGridStyles();
    updateClueListStyles();

    // Initialize the Unified Input Panel
    if (window.UmnikInputPanel) {
      window.UmnikInputPanel.init("unified-input-panel-container", "crossword");
    }

    // Attach Event Listeners
    attachEventListeners(containerId);
  };

  const attachEventListeners = (containerId) => {
    // 1. Back button
    document.getElementById("btn-cw-back").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      if (window.UmnikApp) window.UmnikApp.goBack();
    });

    // 2. Regenerate button (shows confirm modal)
    document.getElementById("btn-cw-regenerate").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("cw-confirm-modal").classList.remove("hidden");
    });

    // 3. Confirm modal "No"
    document.getElementById("btn-cw-confirm-no").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("cw-confirm-modal").classList.add("hidden");
    });

    // 4. Confirm modal "Yes" -> Regenerates with confirmation!
    document.getElementById("btn-cw-confirm-yes").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("cw-confirm-modal").classList.add("hidden");
      // Pick a completely different puzzle
      init(containerId, activeDifficulty);
    });

    // Sound Toggle Switch
    const soundToggle = document.getElementById("toggle-cw-sound");
    if (soundToggle) {
      soundToggle.addEventListener("change", (e) => {
        if (window.UmnikAudio) {
          window.UmnikAudio.setMute(!e.target.checked);
          if (e.target.checked) {
            window.UmnikAudio.playPop();
          }
          if (window.UmnikApp && window.UmnikApp.renderStickyControls) {
            window.UmnikApp.renderStickyControls();
          }
        }
      });
    }

    // 5. Grid Cell Click
    const cells = document.querySelectorAll(".cw-cell-box");
    cells.forEach(cell => {
      cell.addEventListener("click", () => {
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const wordIds = cell.dataset.words.split(",").map(Number);
        
        const isAlreadySelected = (selectedCell.row === row && selectedCell.col === col);
        selectedCell = { row, col };
        
        // Pick the first associated wordId as the focused one, or toggle direction if clicking an intersection
        if (wordIds.length > 0) {
          if (isAlreadySelected && wordIds.length > 1) {
            const idx = wordIds.indexOf(currentWordId);
            currentWordId = wordIds[(idx + 1) % wordIds.length];
          } else if (!wordIds.includes(currentWordId)) {
            currentWordId = wordIds[0];
          }
        }

        updateGridStyles();
        updateClueListStyles();
      });
    });

    // 6. Clue Item Click
    const clues = document.querySelectorAll(".clue-item");
    clues.forEach(clue => {
      clue.addEventListener("click", () => {
        if (window.UmnikAudio) window.UmnikAudio.playPop();
        
        const wId = parseInt(clue.dataset.wordId);
        currentWordId = wId;

        // Find the word info
        const word = activePuzzle.words.find(w => w.id === wId);
        if (word) {
          // Focus the first empty or first cell of this word
          selectedCell = { row: word.y, col: word.x };
          
          // Let's see if we can find the first uncompleted letter
          for (let i = 0; i < word.word.length; i++) {
            const c = word.x + (word.dir === 'H' ? i : 0);
            const r = word.y + (word.dir === 'V' ? i : 0);
            if (!userValues[`${r}_${c}`]) {
              selectedCell = { row: r, col: c };
              break;
            }
          }
        }

        updateGridStyles();
        updateClueListStyles();
      });
    });

    // 7. Input handlers are now driven by window.UmnikInputPanel or physical keys.


    // 9. Physical Keyboard integration (Cyrillic-friendly with phonetic mapping fallback)
    const handleKeyDown = (e) => {
      if (selectedCell.row === -1 || selectedCell.col === -1) return;

      const mappedCyrillic = mapKeyToCyrillic(e.key);
      
      if (mappedCyrillic) {
        e.preventDefault();
        // Trigger simulated key press
        const keyCoord = `${selectedCell.row}_${selectedCell.col}`;
        userValues[keyCoord] = mappedCyrillic;
        
        const cellEl = document.getElementById(`cw_cell_${selectedCell.row}_${selectedCell.col}`);
        if (cellEl) {
          const letterSpan = cellEl.querySelector(".cw-letter-span");
          if (letterSpan) letterSpan.innerText = mappedCyrillic;
        }

        const word = activePuzzle.words.find(w => w.id === currentWordId);
        if (word) {
          const currentIndexInWord = word.dir === 'H' ? selectedCell.col - word.x : selectedCell.row - word.y;
          if (currentIndexInWord < word.word.length - 1) {
            selectedCell.col += (word.dir === 'H' ? 1 : 0);
            selectedCell.row += (word.dir === 'V' ? 1 : 0);
          }
        }
        updateGridStyles();
        checkCrosswordStatus();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteCellValue();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        let newRow = selectedCell.row;
        let newCol = selectedCell.col;
        if (e.key === "ArrowUp") newRow--;
        if (e.key === "ArrowDown") newRow++;
        if (e.key === "ArrowLeft") newCol--;
        if (e.key === "ArrowRight") newCol++;
        
        const targetCell = document.getElementById(`cw_cell_${newRow}_${newCol}`);
        if (targetCell) {
          selectedCell = { row: newRow, col: newCol };
          const targetWordIds = targetCell.dataset.words.split(",").map(Number);
          if (targetWordIds.length > 0) {
            if (!targetWordIds.includes(currentWordId)) {
              currentWordId = targetWordIds[0];
            }
          }
          updateGridStyles();
          updateClueListStyles();
        }
      }
    };

    // Remove previous keydown listener if any
    if (window._cwKeyListener) {
      window.removeEventListener("keydown", window._cwKeyListener);
    }
    // Store listener to detach when leaving
    window._cwKeyListener = handleKeyDown;
    window.addEventListener("keydown", handleKeyDown);
  };

  // Safe cleaner
  const destroy = () => {
    if (window._cwKeyListener) {
      window.removeEventListener("keydown", window._cwKeyListener);
      delete window._cwKeyListener;
    }
  };

  return {
    init,
    destroy,
    setCellValue,
    deleteCellValue
  };
})();

// Assign to window for global access
window.UmnikCrossword = UmnikCrossword;
