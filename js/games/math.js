/**
 * Umnik Mathematics Trainer Engine
 * Procedurally generates 10-problem child-friendly arithmetic sets.
 * Handles: Easy (addition/subtraction to 20 + visual counting aid emojis),
 * Medium (numbers to 100, multiplication table, division, 15% word problems),
 * Hard (combined expressions to 1000, 40% custom Bulgarian word problems).
 * Integrates "Сметачко" mascot comments, progress bar, error handling, and restart safety.
 */

const UmnikMath = (() => {
  let activeDifficulty = "easy";
  let currentProblemIndex = 0; // 0 to 9
  let correctCount = 0;
  let sessionProblems = []; // Array of 10 pre-generated problems
  let attemptCount = 0; // Tracks if they made mistakes on current question
  let isPerfectSession = true; // Tracks if solved everything first try

  // Procedural generator
  const generateProblemSet = (difficulty) => {
    const problems = [];
    const settings = window.UmnikPuzzles ? window.UmnikPuzzles.mathSettings[difficulty] : null;
    if (!settings) return [];

    for (let i = 0; i < 10; i++) {
      // Check for Word Problem chance
      const rand = Math.random();
      const wordProblemList = window.UmnikPuzzles.mathWordProblems[difficulty] || [];
      
      if (wordProblemList.length > 0 && rand < settings.wordProblemsChance) {
        // Grab a word problem and ensure we don't repeat too much if possible
        const randIndex = Math.floor(Math.random() * wordProblemList.length);
        const p = wordProblemList[randIndex];
        
        problems.push({
          text: p.clue,
          answer: p.answer,
          isWordProblem: true,
          visualAid: null
        });
      } else {
        // Generate procedural arithmetic expression
        let problemText = "";
        let problemAnswer = 0;
        let visualAidHtml = "";

        if (difficulty === "easy") {
          // Easy (Addition / Subtraction to 20)
          const op = settings.operations[Math.floor(Math.random() * settings.operations.length)];
          const emojis = ["🍎", "🍓", "🍊", "🎈", "⭐️", "🍪", "🍭", "⚽️", "🐱", "🦁"];
          const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

          if (op === "+") {
            const num1 = Math.floor(Math.random() * 12) + 1; // 1 to 12
            const num2 = Math.floor(Math.random() * (20 - num1)) + 1; // 1 to 20-num1
            problemText = `${num1} + ${num2}`;
            problemAnswer = num1 + num2;

            // Generate emoji counting sets
            const set1 = Array(num1).fill(selectedEmoji).join("");
            const set2 = Array(num2).fill(selectedEmoji).join("");
            visualAidHtml = `
              <div class="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 rounded-[24px] border-4 border-emerald-400 shadow-sm">
                <p class="text-xs text-emerald-800 font-black uppercase tracking-tight">Брой обектите за отговора!</p>
                <div class="flex flex-wrap items-center justify-center gap-1.5 text-xl tracking-wider select-none">
                  <span>${set1}</span>
                  <span class="text-emerald-600 font-black px-1">+</span>
                  <span>${set2}</span>
                </div>
              </div>
            `;
          } else {
            // minus
            const num1 = Math.floor(Math.random() * 11) + 10; // 10 to 20
            const num2 = Math.floor(Math.random() * (num1 - 2)) + 2; // 2 to num1-1
            problemText = `${num1} - ${num2}`;
            problemAnswer = num1 - num2;

            // Generate subtraction counting aid (crossed out items or descriptive text)
            const setTotal = Array(num1).fill(selectedEmoji).join("");
            visualAidHtml = `
              <div class="flex flex-col items-center justify-center gap-2 p-4 bg-rose-50 rounded-[24px] border-4 border-rose-400 shadow-sm">
                <p class="text-xs text-rose-800 font-black uppercase tracking-tight">Имаме ${num1} обекта, махаме ${num2} от тях:</p>
                <div class="text-xl tracking-wider select-none">${setTotal}</div>
                <p class="text-[10px] text-rose-600 font-bold italic">Махни ${num2} от тях и преброй останалите!</p>
              </div>
            `;
          }
        } else if (difficulty === "medium") {
          // Medium (Numbers to 100, Multiplication, Division)
          const operations = settings.operations;
          const op = operations[Math.floor(Math.random() * operations.length)];

          if (op === "+") {
            const num1 = Math.floor(Math.random() * 70) + 10; // 10 to 80
            const num2 = Math.floor(Math.random() * (100 - num1)) + 5;
            problemText = `${num1} + ${num2}`;
            problemAnswer = num1 + num2;
          } else if (op === "-") {
            const num1 = Math.floor(Math.random() * 80) + 20; // 20 to 100
            const num2 = Math.floor(Math.random() * (num1 - 5)) + 5;
            problemText = `${num1} - ${num2}`;
            problemAnswer = num1 - num2;
          } else if (op === "*") {
            const num1 = Math.floor(Math.random() * 9) + 2; // 2 to 10
            const num2 = Math.floor(Math.random() * 9) + 2; // 2 to 10
            problemText = `${num1} × ${num2}`;
            problemAnswer = num1 * num2;
          } else {
            // division
            const divisor = Math.floor(Math.random() * 8) + 2; // 2 to 10
            const quotient = Math.floor(Math.random() * 8) + 2; // 2 to 10
            const dividend = divisor * quotient;
            problemText = `${dividend} ÷ ${divisor}`;
            problemAnswer = quotient;
          }
        } else {
          // Hard (Numbers to 1000, combined equation)
          const isCombined = Math.random() < 0.45;

          if (isCombined) {
            // A * B + C or A * B - C
            const num1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
            const num2 = Math.floor(Math.random() * 8) + 3; // 3 to 10
            const mult = num1 * num2;
            const op = Math.random() < 0.5 ? "+" : "-";

            if (op === "+") {
              const num3 = Math.floor(Math.random() * 300) + 10; // 10 to 310
              problemText = `(${num1} × ${num2}) + ${num3}`;
              problemAnswer = mult + num3;
            } else {
              const num3 = Math.floor(Math.random() * (mult - 5)) + 2; // avoid negatives
              problemText = `(${num1} × ${num2}) - ${num3}`;
              problemAnswer = mult - num3;
            }
          } else {
            // large addition/subtraction to 1000
            const op = Math.random() < 0.5 ? "+" : "-";
            if (op === "+") {
              const num1 = Math.floor(Math.random() * 700) + 100; // 100 to 800
              const num2 = Math.floor(Math.random() * (1000 - num1)) + 50;
              problemText = `${num1} + ${num2}`;
              problemAnswer = num1 + num2;
            } else {
              const num1 = Math.floor(Math.random() * 800) + 150; // 150 to 950
              const num2 = Math.floor(Math.random() * (num1 - 50)) + 30;
              problemText = `${num1} - ${num2}`;
              problemAnswer = num1 - num2;
            }
          }
        }

        problems.push({
          text: problemText,
          answer: problemAnswer,
          isWordProblem: false,
          visualAid: visualAidHtml
        });
      }
    }

    return problems;
  };

  const init = (containerId, difficulty = "easy") => {
    activeDifficulty = difficulty;
    currentProblemIndex = 0;
    correctCount = 0;
    attemptCount = 0;
    isPerfectSession = true;
    
    sessionProblems = generateProblemSet(difficulty);
    if (sessionProblems.length === 0) {
      document.getElementById(containerId).innerHTML = "<div class='text-center p-6 text-red-500'>Възникна грешка при стартиране на тренировката!</div>";
      return;
    }

    render(containerId);
  };

  const updateProgressBar = () => {
    const percent = ((currentProblemIndex) / 10) * 100;
    const progressEl = document.getElementById("math-progress-bar");
    if (progressEl) {
      progressEl.style.width = `${percent}%`;
    }
    const labelEl = document.getElementById("math-progress-label");
    if (labelEl) {
      labelEl.innerText = `Задача ${currentProblemIndex + 1} от 10`;
    }
  };

  // Submit Answer check
  const checkAnswer = () => {
    const inputEl = document.getElementById("math-answer-input");
    if (!inputEl) return;

    const userVal = parseInt(inputEl.value.trim());
    if (isNaN(userVal)) return; // invalid input

    const problem = sessionProblems[currentProblemIndex];
    const speechEl = document.getElementById("math-mascot-speech");

    if (userVal === problem.answer) {
      // CORRECT ANSWER!
      if (window.UmnikAudio) window.UmnikAudio.playSuccess();
      
      correctCount++;
      
      const successQuote = window.UmnikCharacters.getRandomQuote("smetachko", "success");
      if (speechEl) {
        speechEl.innerText = `"${successQuote}"`;
      }

      // Briefly animate inputs, then advance
      inputEl.disabled = true;
      inputEl.classList.add("bg-emerald-50", "border-emerald-500", "text-emerald-700");
      
      setTimeout(() => {
        advanceToNextProblem();
      }, 1200);

    } else {
      // WRONG ANSWER
      if (window.UmnikAudio) window.UmnikAudio.playEncourage();
      attemptCount++;
      isPerfectSession = false;

      const encourageQuote = window.UmnikCharacters.getRandomQuote("smetachko", "encourage");
      if (speechEl) {
        speechEl.innerText = `"${encourageQuote}"`;
      }

      inputEl.classList.add("bg-rose-50", "border-rose-400", "text-rose-700", "animate-shake");
      setTimeout(() => {
        inputEl.classList.remove("bg-rose-50", "border-rose-400", "text-rose-700", "animate-shake");
        inputEl.value = "";
        inputEl.focus();
      }, 1000);
    }
  };

  const advanceToNextProblem = () => {
    currentProblemIndex++;
    attemptCount = 0;

    if (currentProblemIndex >= 10) {
      triggerVictory();
    } else {
      // Render next question
      const problem = sessionProblems[currentProblemIndex];
      
      // Update progress
      updateProgressBar();

      // Reset DOM state
      const textEl = document.getElementById("math-problem-text");
      if (textEl) {
        textEl.innerText = problem.text;
        
        // Handle font size of word problem
        if (problem.isWordProblem) {
          textEl.className = "text-base md:text-lg text-slate-800 font-bold text-center leading-relaxed bg-blue-50/50 p-4 rounded-[24px] border-4 border-[#CBD5E0] shadow-sm";
        } else {
          textEl.className = "text-4xl md:text-5xl font-black text-slate-800 tracking-wider text-center py-4 font-mono";
        }
      }

      const visualContainer = document.getElementById("math-visual-aid-container");
      if (visualContainer) {
        visualContainer.innerHTML = problem.visualAid || "";
      }

      const inputEl = document.getElementById("math-answer-input");
      if (inputEl) {
        inputEl.disabled = false;
        inputEl.value = "";
        inputEl.className = "w-full px-5 py-4 text-center border-4 border-indigo-300 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 focus:outline-none transition-all shadow-inner focus:ring-4 focus:ring-indigo-100";
        inputEl.focus();
      }
    }
  };

  const triggerVictory = () => {
    if (window.UmnikAudio) window.UmnikAudio.playLevelComplete();

    // Reward: 10 correct answers = 10 stars.
    // If perfect session (no errors at all), give 5 bonus stars!
    let rewardStars = 10;
    if (isPerfectSession) rewardStars += 5;

    let newBadges = [];
    if (window.UmnikProgress) {
      newBadges = window.UmnikProgress.recordGameComplete("math", "trainer_" + activeDifficulty, rewardStars);
    }

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in";
    
    const mascot = window.UmnikCharacters ? window.UmnikCharacters.get("smetachko") : null;
    const quote = window.UmnikCharacters ? window.UmnikCharacters.getRandomQuote("smetachko", "levelComplete") : "Биип! Решено!";
    const avatarHtml = mascot ? mascot.getAvatarSvg("w-28 h-28 mx-auto") : "🤖";

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

    let perfectBanner = "";
    if (isPerfectSession) {
      perfectBanner = `
        <div class="mb-4 bg-emerald-100 text-emerald-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border-2 border-emerald-500 shadow-sm">
          🌟 БЕЗГРЕШНО! +5 ЗВЕЗДИ БОНУС!
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="bg-white rounded-[40px] p-8 max-w-md w-full text-center border-8 border-[#FBBF24] shadow-2xl relative overflow-hidden transform scale-100 transition-transform animate-fade-in">
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-[#FEF3C7] rounded-full opacity-40 blur-xl"></div>
        
        <div class="mb-4 bg-amber-50 p-3 rounded-3xl border-2 border-[#FEF3C7] inline-block">${avatarHtml}</div>
        
        ${perfectBanner}

        <h2 class="text-2xl font-black text-amber-950 uppercase tracking-tight mb-2">Супер Сметач!</h2>
        
        <p class="text-emerald-900 bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-200 mb-6 font-bold leading-relaxed">
          "${quote}"
        </p>

        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="text-center bg-[#FEF3C7] px-5 py-3 rounded-2xl border-4 border-[#FBBF24] shadow-md select-none">
            <span class="text-xl font-black text-yellow-700 leading-none">+${rewardStars} Звезди</span>
            <span class="text-2xl">⭐</span>
          </div>
        </div>

        ${badgeNotificationHtml}

        <button id="btn-math-victory-close" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 border-4 border-slate-800 text-white font-black text-lg rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer">
          Страхотно, благодаря!
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btn-math-victory-close").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      overlay.remove();
      if (window.UmnikApp) window.UmnikApp.goBack();
    });
  };

  const render = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const problem = sessionProblems[currentProblemIndex];
    const settings = window.UmnikPuzzles.mathSettings[activeDifficulty];
    const mascot = window.UmnikCharacters.get("smetachko");
    const avatarHtml = mascot ? mascot.getAvatarSvg("w-14 h-14") : "🤖";
    const isMuted = window.UmnikAudio ? window.UmnikAudio.isMuted() : true;

    // Set font sizes depending on problem length (word problems vs basic formula)
    let problemClass = "text-4xl md:text-5xl font-black text-slate-800 tracking-wider text-center py-4 font-mono select-none";
    if (problem.isWordProblem) {
      problemClass = "text-base md:text-lg text-slate-800 font-bold text-center leading-relaxed bg-blue-50/50 p-4 rounded-[24px] border-4 border-[#CBD5E0] shadow-sm";
    }

    container.innerHTML = `
      <div class="flex flex-col gap-6 max-w-xl mx-auto">
        <!-- Header Controls -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-[32px] border-4 border-[#FBBF24] shadow-sm">
          <div class="flex items-center gap-3">
            <button id="btn-math-back" class="px-5 py-2 bg-[#EDF2F7] border-4 border-[#CBD5E0] text-[#2D3748] font-black rounded-2xl hover:bg-gray-100 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5 touch-target">
              ← Назад
            </button>
            <div>
              <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wide leading-none mb-1 block">Математика</span>
              <h1 class="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-none">${settings.title}</h1>
            </div>
          </div>
          <button id="btn-math-regenerate" class="px-5 py-2 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FBBF24] hover:text-amber-950 border-2 border-[#FBBF24] active:scale-95 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-sm touch-target">
            🔄 Нова игра
          </button>
        </div>

        <!-- Progress bar -->
        <div class="bg-white p-4 rounded-[32px] border-4 border-[#CBD5E0] shadow-sm flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs font-black uppercase text-slate-500 tracking-tight">
            <span id="math-progress-label">Задача 1 от 10</span>
            <span class="text-emerald-600">${settings.grade}</span>
          </div>
          <div class="w-full h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-300">
            <div id="math-progress-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Mascot Dialog -->
        <div class="flex items-start gap-4 p-4 bg-white border-4 border-[#3B82F6] rounded-[32px] shadow-sm">
          <div class="bg-blue-50 p-2.5 rounded-2xl border-2 border-blue-300">${avatarHtml}</div>
          <div class="flex-1">
            <h4 class="font-black text-blue-950 text-sm uppercase tracking-tight">Сметачко казва:</h4>
            <p id="math-mascot-speech" class="text-blue-800 text-xs md:text-sm font-bold italic leading-relaxed mt-0.5">
              "${window.UmnikCharacters.getRandomQuote("smetachko", "welcome")}"
            </p>
          </div>
        </div>

        <!-- Problem Stage -->
        <div class="bg-white p-6 md:p-8 rounded-[32px] border-4 border-[#CBD5E0] shadow-md flex flex-col gap-6 items-center">
          <!-- Problem formulation -->
          <div id="math-problem-text" class="${problemClass}">
            ${problem.text}
          </div>

          <!-- Visual Helper if set -->
          <div id="math-visual-aid-container" class="w-full">
            ${problem.visualAid || ""}
          </div>

          <!-- Input field -->
          <div class="w-full max-w-xs flex flex-col gap-3">
            <input 
              type="number" 
              id="math-answer-input" 
              placeholder="Въведи отговор" 
              class="w-full px-5 py-4 text-center border-4 border-indigo-300 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 focus:outline-none transition-all shadow-inner focus:ring-4 focus:ring-indigo-100"
              autocomplete="off"
            >
            <button 
              id="btn-math-submit" 
              class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-lg rounded-2xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer select-none"
            >
              Провери! 🚀
            </button>
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
                  <input type="checkbox" id="toggle-math-sound" class="peer sr-only" ${!isMuted ? "checked" : ""}>
                  <div class="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                </div>
              </label>

              <!-- Prompt on how to play -->
              <div class="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 flex items-start gap-2.5">
                <span class="text-lg">⭐</span>
                <p class="text-[11px] md:text-xs text-emerald-800 leading-relaxed font-bold">
                  <strong>Как се играе:</strong> Пресметни математическата задача, въведи верния отговор в полето и натисни бутона "Провери!". Попълни правилно всички 10 задачи, за да спечелиш златна звезда!
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div id="math-confirm-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-8 border-orange-400 shadow-2xl animate-fade-in">
          <span class="text-5xl block mb-3">🤔</span>
          <h3 class="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Нова игра?</h3>
          <p class="text-slate-600 text-xs font-bold leading-relaxed mb-6">
            Сигурен ли си, че искаш да започнеш нова игра? Сегашният ти прогрес в това раздаване ще се загуби!
          </p>
          <div class="flex gap-3">
            <button id="btn-math-confirm-yes" class="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] active:scale-95 text-white font-black rounded-2xl border-2 border-slate-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Да, давай!
            </button>
            <button id="btn-math-confirm-no" class="flex-1 py-3 bg-[#EDF2F7] hover:bg-slate-200 text-[#2D3748] border-2 border-[#CBD5E0] font-black rounded-2xl cursor-pointer">
              Остани
            </button>
          </div>
        </div>
      </div>
    `;

    // Apply progress bar
    updateProgressBar();

    // Initialize the Unified Input Panel
    if (window.UmnikInputPanel) {
      window.UmnikInputPanel.init("unified-input-panel-container", "math");
    }

    // Attach Event listeners
    attachEventListeners(containerId);
  };

  const attachEventListeners = (containerId) => {
    const inputEl = document.getElementById("math-answer-input");
    const submitEl = document.getElementById("btn-math-submit");

    // Auto-focus input
    if (inputEl) {
      inputEl.focus();
    }

    // 1. Back button
    document.getElementById("btn-math-back").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      if (window.UmnikApp) window.UmnikApp.goBack();
    });

    // 2. Regenerate button (confirm)
    document.getElementById("btn-math-regenerate").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("math-confirm-modal").classList.remove("hidden");
    });

    // 3. Confirm Modal "No"
    document.getElementById("btn-math-confirm-no").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("math-confirm-modal").classList.add("hidden");
    });

    // 4. Confirm Modal "Yes" -> restarts procedurals!
    document.getElementById("btn-math-confirm-yes").addEventListener("click", () => {
      if (window.UmnikAudio) window.UmnikAudio.playPop();
      document.getElementById("math-confirm-modal").classList.add("hidden");
      init(containerId, activeDifficulty);
    });

    // Sound Toggle Switch
    const soundToggle = document.getElementById("toggle-math-sound");
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

    // 5. Submit Action
    submitEl.addEventListener("click", () => {
      checkAnswer();
    });

    // 6. Enter key action inside input
    if (inputEl) {
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkAnswer();
        }
      });
    }
  };

  return {
    init
  };
})();

// Assign to window for global access
window.UmnikMath = UmnikMath;
