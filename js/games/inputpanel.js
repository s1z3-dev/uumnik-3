/**
 * Umnik Unified Kids Input Panel
 * A beautiful, tactile, multi-tab on-screen panel for children.
 * Features:
 *  1. Cyrillic Letters Keyboard (Букви)
 *  2. Numbers Pad (Цифри)
 *  3. Cute Emojis Pad (Емоджита)
 *  4. Working Children's Calculator (Калкулатор) with "Insert into game" capability.
 */

const UmnikInputPanel = (() => {
  let currentTab = "letters"; // letters, numbers, emojis, calculator
  let activeGameId = null;
  let targetContainerId = null;
  
  // Calculator state
  let calcExpression = "";
  let calcResultShown = false;

  const defaultTabs = {
    crossword: "letters",
    sudoku: "numbers",
    animalsudoku: "emojis",
    math: "calculator"
  };

  const init = (containerId, gameId) => {
    targetContainerId = containerId;
    activeGameId = gameId;
    
    // Auto-select most relevant tab on load
    currentTab = defaultTabs[gameId] || "letters";
    
    // Reset calculator
    calcExpression = "";
    calcResultShown = false;

    render();
  };

  const setActiveTab = (tabName) => {
    currentTab = tabName;
    if (window.UmnikAudio) window.UmnikAudio.playPop();
    render();
  };

  // Safe game control bridges
  const handleLetterInput = (letter) => {
    if (window.UmnikAudio) window.UmnikAudio.playPop();

    if (activeGameId === "crossword" && window.UmnikCrossword && typeof window.UmnikCrossword.setCellValue === "function") {
      window.UmnikCrossword.setCellValue(letter);
    } else {
      // General input typing fallback (e.g. if any standard text input is focused)
      const focusedInput = document.activeElement;
      if (focusedInput && (focusedInput.tagName === "INPUT" || focusedInput.tagName === "TEXTAREA")) {
        const start = focusedInput.selectionStart;
        const end = focusedInput.selectionEnd;
        const text = focusedInput.value;
        focusedInput.value = text.substring(0, start) + letter + text.substring(end);
        focusedInput.selectionStart = focusedInput.selectionEnd = start + letter.length;
        // Trigger input event
        focusedInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const handleNumberInput = (num) => {
    if (window.UmnikAudio) window.UmnikAudio.playPop();

    if (activeGameId === "sudoku" && window.UmnikSudoku && typeof window.UmnikSudoku.setCellValue === "function") {
      window.UmnikSudoku.setCellValue(num);
    } else if (activeGameId === "animalsudoku" && window.UmnikAnimalSudoku && typeof window.UmnikAnimalSudoku.setCellValue === "function") {
      window.UmnikAnimalSudoku.setCellValue(num);
    } else if (activeGameId === "math") {
      const inputEl = document.getElementById("math-answer-input");
      if (inputEl) {
        inputEl.focus();
        if (num === 0 && inputEl.value === "") return; // avoid leading zero
        inputEl.value = inputEl.value + num;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      // Fallback input
      const focusedInput = document.activeElement;
      if (focusedInput && (focusedInput.tagName === "INPUT" || focusedInput.tagName === "TEXTAREA")) {
        const start = focusedInput.selectionStart;
        const end = focusedInput.selectionEnd;
        focusedInput.value = focusedInput.value.substring(0, start) + num + focusedInput.value.substring(end);
        focusedInput.selectionStart = focusedInput.selectionEnd = start + String(num).length;
        focusedInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const handleEmojiInput = (emoji, idx = null) => {
    if (window.UmnikAudio) window.UmnikAudio.playPop();

    if (activeGameId === "animalsudoku" && window.UmnikAnimalSudoku && typeof window.UmnikAnimalSudoku.setCellValue === "function") {
      // In animal sudoku, if idx (1-6) is passed, we set that numeric value
      if (idx !== null) {
        window.UmnikAnimalSudoku.setCellValue(idx);
      }
    } else if (activeGameId === "sudoku" && window.UmnikSudoku && typeof window.UmnikSudoku.setCellValue === "function") {
      // If it's an emoji sudoku template
      if (idx !== null) {
        window.UmnikSudoku.setCellValue(idx);
      }
    } else {
      // Fallback: paste emoji into focused text input
      const focusedInput = document.getElementById("math-answer-input") || document.activeElement;
      if (focusedInput && (focusedInput.tagName === "INPUT" || focusedInput.tagName === "TEXTAREA")) {
        const start = focusedInput.selectionStart || focusedInput.value.length;
        const end = focusedInput.selectionEnd || focusedInput.value.length;
        focusedInput.value = focusedInput.value.substring(0, start) + emoji + focusedInput.value.substring(end);
        focusedInput.selectionStart = focusedInput.selectionEnd = start + emoji.length;
        focusedInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const handleBackspace = () => {
    if (window.UmnikAudio) window.UmnikAudio.playPop();

    if (activeGameId === "crossword" && window.UmnikCrossword && typeof window.UmnikCrossword.deleteCellValue === "function") {
      window.UmnikCrossword.deleteCellValue();
    } else if (activeGameId === "sudoku" && window.UmnikSudoku && typeof window.UmnikSudoku.deleteCellValue === "function") {
      window.UmnikSudoku.deleteCellValue();
    } else if (activeGameId === "animalsudoku" && window.UmnikAnimalSudoku && typeof window.UmnikAnimalSudoku.deleteCellValue === "function") {
      window.UmnikAnimalSudoku.deleteCellValue();
    } else if (activeGameId === "math") {
      const inputEl = document.getElementById("math-answer-input");
      if (inputEl) {
        inputEl.focus();
        inputEl.value = inputEl.value.slice(0, -1);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      const focusedInput = document.activeElement;
      if (focusedInput && (focusedInput.tagName === "INPUT" || focusedInput.tagName === "TEXTAREA")) {
        const start = focusedInput.selectionStart;
        const end = focusedInput.selectionEnd;
        if (start === end && start > 0) {
          focusedInput.value = focusedInput.value.substring(0, start - 1) + focusedInput.value.substring(end);
          focusedInput.selectionStart = focusedInput.selectionEnd = start - 1;
        } else {
          focusedInput.value = focusedInput.value.substring(0, start) + focusedInput.value.substring(end);
          focusedInput.selectionStart = focusedInput.selectionEnd = start;
        }
        focusedInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  // Calculator operations
  const handleCalcPress = (btn) => {
    if (window.UmnikAudio) window.UmnikAudio.playPop();

    if (btn === "C") {
      calcExpression = "";
      calcResultShown = false;
    } else if (btn === "=") {
      if (!calcExpression) return;
      try {
        // Sanitize and safely evaluate basic math arithmetic expression
        const sanitized = calcExpression.replace(/×/g, "*").replace(/÷/g, "/");
        if (/^[0-9+\-*/().\s]+$/.test(sanitized)) {
          const result = eval(sanitized);
          // Keep it to clean integer or simple float decimals
          const roundedResult = Math.round(result * 100) / 100;
          calcExpression = String(roundedResult);
          calcResultShown = true;
        } else {
          calcExpression = "Грешка";
          calcResultShown = true;
        }
      } catch (err) {
        calcExpression = "Грешка";
        calcResultShown = true;
      }
    } else {
      if (calcResultShown || calcExpression === "Грешка") {
        calcExpression = "";
        calcResultShown = false;
      }
      calcExpression += btn;
    }
    renderCalculatorDisplay();
  };

  const insertCalcResultIntoGame = () => {
    if (window.UmnikAudio) window.UmnikAudio.playSparkle();
    
    // Evaluate if not already evaluated
    if (!calcResultShown) {
      handleCalcPress("=");
    }

    const valueToInsert = parseInt(calcExpression);
    if (!isNaN(valueToInsert)) {
      if (activeGameId === "math") {
        const inputEl = document.getElementById("math-answer-input");
        if (inputEl) {
          inputEl.value = valueToInsert;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.focus();
        }
      } else if (activeGameId === "sudoku" && window.UmnikSudoku && typeof window.UmnikSudoku.setCellValue === "function") {
        window.UmnikSudoku.setCellValue(valueToInsert);
      }
    }
  };

  const renderCalculatorDisplay = () => {
    const screenEl = document.getElementById("calc-screen-display");
    if (screenEl) {
      screenEl.innerText = calcExpression || "0";
    }
  };

  // Rendering logic
  const render = () => {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    // Tabs headers with beautiful styling
    const tabs = [
      { id: "letters", label: "✍️ Букви", color: "border-indigo-400 bg-indigo-50 text-indigo-900" },
      { id: "numbers", label: "🔢 Цифри", color: "border-purple-400 bg-purple-50 text-purple-900" },
      { id: "emojis", label: "🐼 Емоджита", color: "border-amber-400 bg-amber-50 text-amber-900" },
      { id: "calculator", label: "🧮 Калкулатор", color: "border-emerald-400 bg-emerald-50 text-emerald-900" }
    ];

    const tabHeadersHtml = tabs.map(t => {
      const active = currentTab === t.id;
      const activeStyle = active 
        ? "bg-amber-400 border-b-transparent text-slate-900 -translate-y-1 shadow-[2px_2px_0px_0px_rgba(45,55,72,0.9)] z-10 font-black" 
        : "bg-white hover:bg-slate-50 text-slate-600 font-bold border-b-4";

      return `
        <button 
          class="flex-1 py-2 text-xs md:text-sm border-2 md:border-4 border-slate-700 rounded-t-2xl transition-all cursor-pointer select-none ${activeStyle}"
          onclick="UmnikInputPanel.setActiveTab('${t.id}')"
        >
          ${t.label}
        </button>
      `;
    }).join("");

    // Render contents based on active tab
    let bodyHtml = "";

    if (currentTab === "letters") {
      // Bulgarian Alphabet
      const keysRow1 = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "Й"];
      const keysRow2 = ["К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У"];
      const keysRow3 = ["Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ь", "Ю", "Я"];

      const renderKbdRow = (rowKeys) => {
        return rowKeys.map(k => `
          <button 
            class="flex-1 py-2 md:py-3.5 bg-white border-2 border-slate-700 rounded-xl font-black text-sm md:text-base text-slate-800 shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all select-none cursor-pointer touch-target"
            onclick="UmnikInputPanel.handleLetterInput('${k}')"
          >
            ${k}
          </button>
        `).join("");
      };

      bodyHtml = `
        <div class="flex flex-col gap-1.5 md:gap-2 max-w-xl mx-auto py-2">
          <div class="flex gap-1 md:gap-1.5">${renderKbdRow(keysRow1)}</div>
          <div class="flex gap-1 md:gap-1.5">${renderKbdRow(keysRow2)}</div>
          <div class="flex gap-1 md:gap-1.5">${renderKbdRow(keysRow3)}</div>
          <div class="flex gap-1 md:gap-1.5">
            <button 
              class="flex-1 py-3 bg-rose-100 text-rose-800 hover:bg-rose-200 border-2 border-slate-700 rounded-xl font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 transition-all select-none cursor-pointer"
              onclick="UmnikInputPanel.handleBackspace()"
            >
              Изтрий ⌫
            </button>
          </div>
        </div>
      `;

    } else if (currentTab === "numbers") {
      // 0-9 number pad
      let numKeysHtml = "";
      for (let i = 1; i <= 9; i++) {
        numKeysHtml += `
          <button 
            class="w-12 h-12 md:w-16 md:h-16 bg-white border-2 md:border-4 border-slate-700 rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl text-slate-800 shadow-[3px_3px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all select-none cursor-pointer"
            onclick="UmnikInputPanel.handleNumberInput(${i})"
          >
            ${i}
          </button>
        `;
      }
      
      bodyHtml = `
        <div class="flex flex-col items-center gap-3 py-2">
          <div class="grid grid-cols-5 gap-2 md:gap-3 justify-center items-center">
            <button 
              class="w-12 h-12 md:w-16 md:h-16 bg-rose-50 border-2 md:border-4 border-slate-700 rounded-2xl flex items-center justify-center font-black text-base md:text-xl text-rose-700 shadow-[3px_3px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 transition-all select-none cursor-pointer hover:bg-rose-100"
              onclick="UmnikInputPanel.handleBackspace()"
              title="Изтрий"
            >
              ❌
            </button>
            ${numKeysHtml}
            <button 
              class="w-12 h-12 md:w-16 md:h-16 bg-white border-2 md:border-4 border-slate-700 rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl text-slate-800 shadow-[3px_3px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all select-none cursor-pointer"
              onclick="UmnikInputPanel.handleNumberInput(0)"
            >
              0
            </button>
          </div>
        </div>
      `;

    } else if (currentTab === "emojis") {
      // Animal and funny emojis
      let animals = [
        { emoji: "🐼", idx: 1 },
        { emoji: "🦁", idx: 2 },
        { emoji: "🐸", idx: 3 },
        { emoji: "🐰", idx: 4 },
        { emoji: "🐯", idx: 5 },
        { emoji: "🐨", idx: 6 },
        { emoji: "🦊", idx: 7 },
        { emoji: "🐻", idx: 8 },
        { emoji: "🐵", idx: 9 },
        { emoji: "🐷", idx: 10 }
      ];

      let labelText = "Горски Животни (🐼=1, 🦁=2, 🐸=3...)";

      if (activeGameId === "animalsudoku" && window.UmnikAnimalSudoku && typeof window.UmnikAnimalSudoku.getActivePuzzle === "function") {
        const puzzle = window.UmnikAnimalSudoku.getActivePuzzle();
        if (puzzle && puzzle.symbols) {
          animals = puzzle.symbols.map((sym, i) => ({ emoji: sym, idx: i + 1 }));
          labelText = `Животните за тази игра (${puzzle.symbols.map((sym, i) => `${sym}=${i+1}`).join(", ")})`;
        }
      }

      const funRewards = ["⭐", "🏆", "🎉", "❤️", "☀️", "🎈", "🍕", "🍦", "🚗", "🚀"];

      const animalKeysHtml = animals.map(a => `
        <button 
          class="w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-slate-700 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all select-none cursor-pointer"
          onclick="UmnikInputPanel.handleEmojiInput('${a.emoji}', ${a.idx})"
        >
          ${a.emoji}
        </button>
      `).join("");

      const rewardKeysHtml = funRewards.map(emoji => `
        <button 
          class="w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-slate-700 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all select-none cursor-pointer"
          onclick="UmnikInputPanel.handleEmojiInput('${emoji}')"
        >
          ${emoji}
        </button>
      `).join("");

      bodyHtml = `
        <div class="flex flex-col gap-3 py-2 max-w-xl mx-auto">
          <div>
            <span class="text-[10px] text-slate-500 uppercase font-black tracking-wide block mb-1">${labelText}</span>
            <div class="flex flex-wrap justify-center gap-2">
              <button 
                class="w-12 h-12 md:w-14 md:h-14 bg-rose-50 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 transition-all select-none cursor-pointer hover:bg-rose-100"
                onclick="UmnikInputPanel.handleBackspace()"
              >
                ❌
              </button>
              ${animalKeysHtml}
            </div>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase font-black tracking-wide block mb-1">Забавни Стикери</span>
            <div class="flex flex-wrap justify-center gap-2">
              ${rewardKeysHtml}
            </div>
          </div>
        </div>
      `;

    } else if (currentTab === "calculator") {
      // Working kids calculator
      const rows = [
        ["7", "8", "9", "÷"],
        ["4", "5", "6", "×"],
        ["1", "2", "3", "-"],
        ["C", "0", "=", "+"]
      ];

      const keysHtml = rows.map(r => `
        <div class="flex gap-2">
          ${r.map(btn => {
            let btnClass = "bg-white text-slate-800 hover:bg-slate-50";
            if (["+", "-", "×", "÷"].includes(btn)) {
              btnClass = "bg-amber-100 text-amber-900 hover:bg-amber-200";
            } else if (btn === "C") {
              btnClass = "bg-rose-100 text-rose-800 hover:bg-rose-200";
            } else if (btn === "=") {
              btnClass = "bg-indigo-600 text-white hover:bg-indigo-700";
            }

            return `
              <button 
                class="flex-1 py-3 md:py-4 border-2 border-slate-700 rounded-2xl font-black text-base md:text-xl shadow-[2px_2px_0px_0px_rgba(45,55,72,0.15)] active:translate-y-0.5 active:shadow-none transition-all select-none cursor-pointer ${btnClass}"
                onclick="UmnikInputPanel.handleCalcPress('${btn}')"
              >
                ${btn}
              </button>
            `;
          }).join("")}
        </div>
      `).join("");

      bodyHtml = `
        <div class="flex flex-col md:flex-row gap-4 py-2 max-w-lg mx-auto">
          <!-- Left: Calculator Core -->
          <div class="flex-1 flex flex-col gap-2 bg-slate-200 p-3 rounded-2xl border-2 border-slate-700 shadow-inner">
            <!-- Screen -->
            <div class="bg-indigo-950 text-emerald-400 p-3.5 rounded-xl border-2 border-slate-700 text-right font-mono text-xl md:text-2xl font-black tracking-widest min-h-[56px] select-none shadow-inner break-all flex items-center justify-end">
              <span id="calc-screen-display">${calcExpression || "0"}</span>
            </div>
            <!-- Grid -->
            <div class="flex flex-col gap-2">
              ${keysHtml}
            </div>
          </div>
          
          <!-- Right: Helper & Bridge -->
          <div class="w-full md:w-44 flex flex-col justify-center items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center">
            <span class="text-3xl">🧮</span>
            <h4 class="font-black text-emerald-900 text-xs uppercase tracking-tight">Помощник за Смятане</h4>
            <p class="text-[10px] text-emerald-800 leading-relaxed font-bold">
              Реши трудна задача на калкулатора и постави резултата като отговор в играта!
            </p>
            <button 
              class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white border-2 border-slate-800 font-black text-xs rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer select-none"
              onclick="UmnikInputPanel.insertCalcResultIntoGame()"
            >
              ✍️ Постави резултат
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="bg-[#FFFBEB] rounded-b-[32px] border-x-4 border-b-4 border-slate-700 p-3 md:p-5 shadow-lg max-w-2xl mx-auto w-full">
        <!-- Tab Headers -->
        <div class="flex gap-1 border-b-2 border-slate-700 -mx-3 md:-mx-5 px-3 md:px-5 pb-0">
          ${tabHeadersHtml}
        </div>
        <!-- Tab Content Body -->
        <div class="pt-4 bg-white/70 p-3 rounded-2xl border-2 border-dashed border-slate-400/40 mt-3">
          ${bodyHtml}
        </div>
      </div>
    `;
  };

  return {
    init,
    setActiveTab,
    handleLetterInput,
    handleNumberInput,
    handleEmojiInput,
    handleBackspace,
    handleCalcPress,
    insertCalcResultIntoGame
  };
})();

// Assign to window for global access
window.UmnikInputPanel = UmnikInputPanel;
