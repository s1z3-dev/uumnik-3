/**
 * Umnik Games Registry
 * Declares metadata, icons, and titles for our three main game engines.
 */

const UmnikGamesRegistry = (() => {
  const games = [
    {
      id: "crossword",
      title: "Кръстословица",
      description: "Отгатвай думички с картинки и подсказки. Напиши ги в мрежата!",
      icon: "✍️",
      color: "from-indigo-400 to-indigo-600 shadow-indigo-100",
      bgLight: "bg-indigo-50 border-indigo-100",
      engine: "UmnikCrossword",
      difficulties: [
        { level: "easy", label: "Минимум", stars: 1, desc: "Основни думички и забавни картинки" },
        { level: "medium", label: "Средно", stars: 2, desc: "Умерено предизвикателство за умни деца" },
        { level: "hard", label: "Трудно", stars: 3, desc: "Предизвикателни думи за напреднали изследователи" }
      ]
    },
    {
      id: "sudoku",
      title: "Судоку",
      description: "Подреди цифрите от 1 до 9 така, че да не се повтарят на нито един ред, стълб или квадрат!",
      icon: "🧩",
      color: "from-purple-400 to-purple-600 shadow-purple-100",
      bgLight: "bg-purple-50 border-purple-100",
      engine: "UmnikSudoku",
      difficulties: [
        { level: "easy", label: "Лесно", stars: 1, desc: "Класическа 9x9 мрежа с повече дадени числа" },
        { level: "medium", label: "Средно", stars: 2, desc: "Класическа 9x9 мрежа с умерено предизвикателство" },
        { level: "hard", label: "Трудно", stars: 3, desc: "Класическа 9x9 мрежа с малко подсказки" }
      ]
    },
    {
      id: "animalsudoku",
      title: "Судоку с Животни",
      description: "Нареди забавните животни в 6x6 или 9x9 мрежа така, че да не се повтарят в нито един ред!",
      icon: "🐼",
      color: "from-amber-400 to-amber-600 shadow-amber-100",
      bgLight: "bg-amber-50 border-amber-100",
      engine: "UmnikAnimalSudoku",
      difficulties: [
        { level: "easy", label: "Лесно (6x6)", stars: 1, desc: "6x6 мрежа със симпатични животни и повече подсказки" },
        { level: "medium", label: "Средно (6x6)", stars: 2, desc: "6x6 мрежа с умерено предизвикателство" },
        { level: "hard", label: "Трудно (6x6)", stars: 3, desc: "6x6 мрежа с малко подсказки за истински изследователи" },
        { level: "expert", label: "Експерт (9x9)", stars: 4, desc: "Голяма 9x9 мрежа с 9 различни животни за истински експерти!" }
      ]
    },
    {
      id: "math",
      title: "Математика",
      description: "Тренирай ума си с бързи математически задачи и забавни логически загадки!",
      icon: "⚡",
      color: "from-emerald-400 to-emerald-600 shadow-emerald-100",
      bgLight: "bg-emerald-50 border-emerald-100",
      engine: "UmnikMath",
      difficulties: [
        { level: "easy", label: "1. Клас", stars: 1, desc: "Събиране и изваждане до 20 с картинки" },
        { level: "medium", label: "2.-3. Клас", stars: 2, desc: "Числа до 100 и Таблица за умножение" },
        { level: "hard", label: "4. Клас", stars: 3, desc: "Числа до 1000 и Текстови задачи" }
      ]
    }
  ];

  return {
    getGames: () => games,
    getGameById: (id) => games.find(g => g.id === id) || null
  };
})();

// Assign to window for global access
window.UmnikGamesRegistry = window.UmnikGamesRegistry || UmnikGamesRegistry;
