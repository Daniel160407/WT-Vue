//navbar
export const WORDS_PAGE = "words";
export const ADD_WORDS_PAGE = "addWords";
export const TESTS_PAGE = "tests";
export const DICTIONARY_PAGE = "dictionary";
export const STATISTICS_PAGE = "statistics";

export const HOME_LABEL = "Words";
export const ADD_WORDS_LABEL = "Add Words";
export const TESTS_LABEL = "Tests";
export const TRANSLATIONS = "Translations";
export const SENTENCES_LABEL = "Sentences";
export const AI = "AI";
export const DICTIONARY_LABEL = "Dictionary";
export const STATISTICS_LABEL = "Statistics";
export const SIGN_IN_LABEL = "Sign In";
export const LOG_OUT_LABEL = "Logout";
export const LANGUAGES_LABEL = "My Languages";
export const DOCUMENTATION_LABEL = "Documentation";

//router
export const WORDS_ROUTE = "/words";
export const ADD_WORDS_ROUTE = "/add";
export const TRANSLATIONS_ROUTE = "/translations";
export const SENTENCES_ROUTE = "/sentences";
export const AI_ROUTE = "/ai";
export const DICTIONARY_ROUTE = "/dictionary";
export const STATISTICS_ROUTE = "/statistics";
export const LANGUAGES_ROUTE = "/languages";
export const DOCUMENTATION_ROUTE = "/documentation";

//firebase
export const WORDS = "words";
export const LEVEL = "level";
export const USERS = "users";
export const DICTIONARY = "dictionary";
export const STATISTICS = "statistics";
export const MESSAGES = "messages";
export const LANGUAGES = "languages";

export const WORD_TYPE = "word_type";
export const ACTIVE = "active";
export const USER_ID = "user_id";
export const LANGUAGE_ID = "language_id";

//dropdowns
export const WORD_TYPE_OPTIONS = [
  { name: "Words", code: "word" },
  { name: "Irregular Verbs", code: "irregular" },
  { name: "Other", code: "other" },
];
export const WORD_LEVEL_OPTIONS = [
  { name: "A1", code: "A1" },
  { name: "A2", code: "A2" },
  { name: "B1", code: "B1" },
  { name: "B2", code: "B2" },
  { name: "C1", code: "C1" },
  { name: "C2", code: "C2" },
];
export const LANGUAGE_OPTIONS = [
  { name: "Arabic", code: "SA" },
  { name: "Armenian", code: "AM" },
  { name: "Azerbaijani", code: "AZ" },
  { name: "Chinese", code: "CN" },
  { name: "Czech", code: "CZ" },
  { name: "Dutch", code: "NL" },
  { name: "English (UK)", code: "GB" },
  { name: "English (US)", code: "US" },
  { name: "French", code: "FR" },
  { name: "Georgian", code: "GE" },
  { name: "German", code: "DE" },
  { name: "Greek", code: "GR" },
  { name: "Hindi", code: "IN" },
  { name: "Hungarian", code: "HU" },
  { name: "Italian", code: "IT" },
  { name: "Japanese", code: "JP" },
  { name: "Korean", code: "KR" },
  { name: "Norwegian", code: "NO" },
  { name: "Polish", code: "PL" },
  { name: "Portuguese", code: "PT" },
  { name: "Romanian", code: "RO" },
  { name: "Russian", code: "RU" },
  { name: "Spanish", code: "ES" },
  { name: "Swedish", code: "SE" },
  { name: "Turkish", code: "TR" },
  { name: "Ukrainian", code: "UA" },
];
export const WORD_CATEGORIES = [
  { name: "All", code: "all" },
  { name: "Words", code: "word" },
  { name: "Irregular verbs", code: "irregular" },
  { name: "Dropped words", code: "dropped" },
  { name: "Dictionary", code: "dictionary" },
];

//constant arrays
export const CAPITALS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "Ä",
  "Ö",
  "Ü",
];
export const ARTICLES = ["der", "die", "das", "the", "a", "an"];

//word categories
export const ALL_CATEGORY = "all";
export const WORDS_CATEGORY = "word";
export const IRREGULAR_VERBS_CATEGORY = "irregular";
export const DROPPED_WORDS_CATEGORY = "dropped";
export const DICTIONARY_CATEGORY = "dictionary";

//cookies (use expires so cookies persist after browser close, e.g. Safari iOS)
export const COOKIE_EXPIRY_DAYS = 365;
export const UID = "uid";
export const NAME = "name";
export const PHOTO_URL = "photoURL";
export const WORD_LEVEL_COOKIE = "word_level";
export const LANGUAGE_ID_COOKIE = "language_id";

//AI
export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI = "gemini";
export const USER = "user";

export const Advancements = {
  // Words advancements
  TENWORDS: "The First Step (Learn 10 words)",
  FIFTYWORDS: "The Path of Knowledge (Learn 50 words)",
  HUNDREDWORDS: "The Scholar's Journey (Learn 100 words)",
  THREEHUNDREDWORDS: "Wielder of Words (Learn 300 words)",
  FIVEHUNDREDWORDS: "Master of Words (Learn 500 words)",
  SEVENHUNDREDWORDS: "Enlightened Mind (Learn 700 words)",
  THOUSANDWORDS: "The Wordsmith (Learn 1,000 words)",
  THREETHOUSANDWORDS: "Language Alchemist (Learn 3,000 words)",
  FIVETHOUSANDWORDS: "The Polyglot (Learn 5,000 words)",

  // Cycle advancements
  ONECYCLESTREAK: "The Initiate's Cycle (1 cycle streak)",
  FIVECYCLESSTREAK: "Adept's Cycle (5 cycles streak)",
  TENCYCLESSTREAK: "Master of Cycles (10 cycles streak)",
  TWENTYCYCLESSTREAK: "Wizard of Cycles (20 cycles streak)",
  THIRTYCYCLESSTREAK: "Sage of Cycles (30 cycles streak)",
  FIFTYCYCLESSTREAK: "Grandmaster of Cycles (50 cycles streak)",

  // Day streak advancements
  ONEDAYSTREAK: "First Flame (1 day streak)",
  THREEDAYSTREAK: "Kindled Spirit (3 days streak)",
  WEEKSTREAK: "Rising Star (1 week streak)",
  TWOWEEKSTREAK: "Ascendant (2 weeks streak)",
  THREEWEEKSTREAK: "Immortal (3 weeks streak)",
  MONTHSTREAK: "Legendary Learner (1 month streak)",
  TWOMONTHSTREAK: "Hero of Knowledge (2 months streak)",
  SIXMONTHSTREAK: "Titan of Wisdom (6 months streak)",
  ONEYEARSTREAK: "Eternal Sage (1 year streak)",
} as const;

export const groupedAdvancements = {
  words: [
    Advancements.TENWORDS,
    Advancements.FIFTYWORDS,
    Advancements.HUNDREDWORDS,
    Advancements.THREEHUNDREDWORDS,
    Advancements.FIVEHUNDREDWORDS,
    Advancements.SEVENHUNDREDWORDS,
    Advancements.THOUSANDWORDS,
    Advancements.THREETHOUSANDWORDS,
    Advancements.FIVETHOUSANDWORDS,
  ],
  cycles: [
    Advancements.ONECYCLESTREAK,
    Advancements.FIVECYCLESSTREAK,
    Advancements.TENCYCLESSTREAK,
    Advancements.TWENTYCYCLESSTREAK,
    Advancements.THIRTYCYCLESSTREAK,
    Advancements.FIFTYCYCLESSTREAK,
  ],
  days: [
    Advancements.ONEDAYSTREAK,
    Advancements.THREEDAYSTREAK,
    Advancements.WEEKSTREAK,
    Advancements.TWOWEEKSTREAK,
    Advancements.THREEWEEKSTREAK,
    Advancements.MONTHSTREAK,
    Advancements.TWOMONTHSTREAK,
    Advancements.SIXMONTHSTREAK,
    Advancements.ONEYEARSTREAK,
  ],
};
