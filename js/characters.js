/**
 * Umnik Educational Mascot Characters
 * Defines our visual guides: Умко (Smart Owl) and Сметачко (Cheerful Robot).
 * Provides scalable child-friendly SVGs and contextual Bulgarian quotes.
 */

const UmnikCharacters = (() => {
  const characters = {
    umko: {
      id: "umko",
      name: "Умко",
      title: "Умната Сова",
      color: "bg-indigo-100 border-indigo-300 text-indigo-800",
      avatarColor: "#6366f1",
      // Generates beautiful responsive SVG of a wise owl
      getAvatarSvg: (className = "w-24 h-24") => `
        <svg class="${className}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background circle soft glow -->
          <circle cx="50" cy="50" r="45" fill="#e0e7ff" />
          <!-- Owl Body -->
          <ellipse cx="50" cy="58" rx="28" ry="32" fill="#4f46e5" />
          <ellipse cx="50" cy="58" rx="22" ry="26" fill="#818cf8" />
          <!-- Wise Owl Belly Feathers -->
          <path d="M42 55 Q50 62 58 55" stroke="#e0e7ff" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M40 65 Q50 72 60 65" stroke="#e0e7ff" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M44 73 Q50 79 56 73" stroke="#e0e7ff" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Owl Ears / Horns -->
          <path d="M25 35 L38 42 L28 48 Z" fill="#3730a3" />
          <path d="M75 35 L62 42 L72 48 Z" fill="#3730a3" />
          <!-- Owl Face Mask -->
          <path d="M50 45 Q32 30 28 50 Q30 60 50 54 Q70 60 72 50 Q68 30 50 45 Z" fill="#ffffff" />
          <!-- Big Glasses Frames -->
          <circle cx="38" cy="48" r="14" stroke="#f59e0b" stroke-width="4.5" fill="none" />
          <circle cx="62" cy="48" r="14" stroke="#f59e0b" stroke-width="4.5" fill="none" />
          <rect x="48" y="46" width="4" height="4" fill="#f59e0b" />
          <!-- Wise Eyes -->
          <circle cx="38" cy="48" r="6" fill="#1e1b4b" />
          <circle cx="62" cy="48" r="6" fill="#1e1b4b" />
          <!-- Sparkles in Eyes -->
          <circle cx="36" cy="46" r="2" fill="#ffffff" />
          <circle cx="60" cy="46" r="2" fill="#ffffff" />
          <!-- Beak -->
          <path d="M50 50 L46 58 L54 58 Z" fill="#f97316" />
          <!-- Wings -->
          <path d="M22 55 Q10 65 18 80 Q25 75 24 60" fill="#3730a3" />
          <path d="M78 55 Q90 65 82 80 Q75 75 76 60" fill="#3730a3" />
          <!-- Cute Feet -->
          <circle cx="42" cy="88" r="4" fill="#f59e0b" />
          <circle cx="45" cy="88" r="4" fill="#f59e0b" />
          <circle cx="55" cy="88" r="4" fill="#f59e0b" />
          <circle cx="58" cy="88" r="4" fill="#f59e0b" />
          <!-- Graduation Cap (Wisdom symbol) -->
          <path d="M32 26 L50 18 L68 26 L50 34 Z" fill="#1e293b" />
          <rect x="48" y="24" width="4" height="10" fill="#1e293b" />
          <path d="M68 26 L68 35 Q68 37 66 37" stroke="#fbbf24" stroke-width="2.5" />
          <circle cx="66" cy="38" r="2" fill="#fbbf24" />
        </svg>
      `,
      quotes: {
        welcome: [
          "Здравей, любознателю! Аз съм Умко. Днес сме готови за велики открития!",
          "Добре дошъл в моя свят от думи и букви! Готов ли си да поизпотим умовете си?",
          "Хей, умнико! Хайде да разкрием тайните думи в моите забавни кръстословици!"
        ],
        success: [
          "Страхотно! Верен отговор!",
          "Браво! Ти си истински откривател на думи!",
          "Точно така! Справяш се великолепно!",
          "Ура! Твоят ум работи безупречно!"
        ],
        encourage: [
          "Опитай пак, ти можеш! Всеки прави грешки, те ни учат!",
          "Почти успя! Огледай се за малка подсказка!",
          "Не се отказвай, следващия път ще се получи!",
          "Опитай друга дума, вярвам в теб!"
        ],
        levelComplete: [
          "Невероятно! Ти завърши цялото ниво! Аз съм толкова горд с теб!",
          "Поздравления! Разкри всички тайни на това приключение!",
          "Ти си истински крал на кръстословиците! Продължавай все така!"
        ]
      }
    },
    smetachko: {
      id: "smetachko",
      name: "Сметачко",
      title: "Веселото Роботче",
      color: "bg-emerald-100 border-emerald-300 text-emerald-800",
      avatarColor: "#10b981",
      // Generates beautiful responsive SVG of a friendly robot
      getAvatarSvg: (className = "w-24 h-24") => `
        <svg class="${className}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background circle soft glow -->
          <circle cx="50" cy="50" r="45" fill="#ecfdf5" />
          <!-- Robot Ears/Bolts -->
          <rect x="16" y="42" width="6" height="12" rx="2" fill="#047857" />
          <rect x="78" y="42" width="6" height="12" rx="2" fill="#047857" />
          <!-- Robot Head -->
          <rect x="22" y="26" width="56" height="44" rx="10" fill="#059669" stroke="#047857" stroke-width="4" />
          <!-- Robot Face Screen -->
          <rect x="28" y="32" width="44" height="26" rx="6" fill="#10b981" />
          <!-- Glowing Eyes -->
          <circle cx="40" cy="42" r="6" fill="#fef08a" />
          <circle cx="60" cy="42" r="6" fill="#fef08a" />
          <!-- Eye Pupils -->
          <circle cx="40" cy="42" r="2.5" fill="#166534" />
          <circle cx="60" cy="42" r="2.5" fill="#166534" />
          <!-- Cute Rosy Cheeks -->
          <circle cx="32" cy="50" r="2" fill="#f87171" />
          <circle cx="68" cy="50" r="2" fill="#f87171" />
          <!-- Happy digital mouth -->
          <path d="M42 50 Q50 56 58 50" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <!-- Antenna -->
          <rect x="48" y="12" width="4" height="14" fill="#047857" />
          <circle cx="50" cy="10" r="5" fill="#ef4444" />
          <!-- Robot Neck -->
          <rect x="42" y="70" width="16" height="6" fill="#34d399" />
          <!-- Robot Body top -->
          <path d="M30 76 H70 L74 92 H26 Z" fill="#059669" stroke="#047857" stroke-width="3" />
          <!-- Gear/Math print on body -->
          <path d="M44 84 H56 M50 79 V89" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      `,
      quotes: {
        welcome: [
          "Биип-бооп! Здравей! Аз съм Сметачко. Моите батерии са заредени за математика!",
          "Привет! Готов ли си да умножаваме, събираме и решаваме супер бързо?",
          "Биип! Числата са моите най-добри приятели. Нека ги укротим заедно!"
        ],
        success: [
          "Браво, изчисли го перфектно!",
          "Биип! 100% точност! Чудесен алгоритъм на мислене!",
          "Страхотен си! Математически суперум!",
          "Уау! Сметачните ти сензори са изключителни!"
        ],
        encourage: [
          "Биип! Опитай отново, ти можеш да го решиш!",
          "Не се притеснявай! Дори и роботите грешат понякога. Хайде пак!",
          "Ти си на една крачка от верния отговор. Помисли пак!",
          "Биип-бооп! Опитай бавно. Броенето е забавно!"
        ],
        levelComplete: [
          "Невероятно изчисление! Всички задачи са решени отлично! Заслужи супер звезда!",
          "Биип! Твоят математически процесор работи на максимални обороти! Честито!",
          "Ти победи всички задачи днес! Ти си официален Магистър по математика!"
        ]
      }
    }
  };

  return {
    get: (id) => characters[id] || null,
    
    // Get a random quote from a character's category
    getRandomQuote: (id, category) => {
      const char = characters[id];
      if (!char || !char.quotes[category]) return "Браво!";
      const list = char.quotes[category];
      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    },

    // Allow adding new mascots in the future
    registerCharacter: (id, config) => {
      if (id && config) {
        characters[id] = {
          id,
          name: config.name || "Герой",
          title: config.title || "Нашият приятел",
          color: config.color || "bg-blue-100 text-blue-800",
          avatarColor: config.avatarColor || "#3b82f6",
          getAvatarSvg: config.getAvatarSvg || ((className) => `<svg class="${className}"></svg>`),
          quotes: config.quotes || { welcome: ["Привет!"], success: ["Супер!"], encourage: ["Давай!"], levelComplete: ["Йес!"] }
        };
        return true;
      }
      return false;
    }
  };
})();

// Assign to window for global access
window.UmnikCharacters = UmnikCharacters;
