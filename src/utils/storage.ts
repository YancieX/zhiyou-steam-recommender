import type { User, Game, Rating, WishlistItem, PurchasedGame } from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'zhiyou_users',
  CURRENT_USER: 'zhiyou_currentUser',
  RATINGS: 'zhiyou_ratings',
  WISHLIST: 'zhiyou_wishlist',
  PURCHASED: 'zhiyou_purchased',
  GAMES: 'zhiyou_games',
  LAST_PRICE_SYNC: 'zhiyou_lastPriceSync',
  VERSION: 'zhiyou_data_version',
  SEARCH_HISTORY: 'zhiyou_searchHistory',
  GAME_CACHE: 'zhiyou_gameCache',
  WISHLIST_GAMES: 'zhiyou_wishlistGames',
} as const;

const CURRENT_VERSION = '5.0';

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function checkVersion(): void {
  const version = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (version !== CURRENT_VERSION) {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.VERSION) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }
}

export const storage = {
  getUsers: (): User[] => getItem(STORAGE_KEYS.USERS, []),
  setUsers: (users: User[]) => setItem(STORAGE_KEYS.USERS, users),

  getCurrentUser: (): User | null => getItem(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => setItem(STORAGE_KEYS.CURRENT_USER, user),

  getRatings: (): Rating[] => getItem(STORAGE_KEYS.RATINGS, []),
  setRatings: (ratings: Rating[]) => setItem(STORAGE_KEYS.RATINGS, ratings),

  getWishlist: (): WishlistItem[] => getItem(STORAGE_KEYS.WISHLIST, []),
  setWishlist: (wishlist: WishlistItem[]) => setItem(STORAGE_KEYS.WISHLIST, wishlist),

  getWishlistGames: (): Record<string, Game> => getItem<Record<string, Game>>(STORAGE_KEYS.WISHLIST_GAMES, {}),
  setWishlistGames: (games: Record<string, Game>) => setItem(STORAGE_KEYS.WISHLIST_GAMES, games),

  getPurchasedGames: (): PurchasedGame[] => getItem(STORAGE_KEYS.PURCHASED, []),
  setPurchasedGames: (purchased: PurchasedGame[]) => setItem(STORAGE_KEYS.PURCHASED, purchased),

  getGames: (): Game[] => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.GAMES);
      if (!item) return [];
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  setGames: (games: Game[]) => setItem(STORAGE_KEYS.GAMES, games),

  getLastPriceSync: (): string | null => {
    const item = localStorage.getItem(STORAGE_KEYS.LAST_PRICE_SYNC);
    return item || null;
  },
  setLastPriceSync: (date: string) => setItem(STORAGE_KEYS.LAST_PRICE_SYNC, date),

  getSearchHistory: (): string[] => getItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []),
  addSearchHistory: (query: string) => {
    const history = getItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
    const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 20);
    setItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
    return updated;
  },
  clearSearchHistory: () => setItem(STORAGE_KEYS.SEARCH_HISTORY, []),

  getGameCache: (): Record<string, Game> => getItem<Record<string, Game>>(STORAGE_KEYS.GAME_CACHE, {}),
  setGameCache: (cache: Record<string, Game>) => setItem(STORAGE_KEYS.GAME_CACHE, cache),
  getCachedGame: (appId: string): Game | null => {
    const cache = getItem<Record<string, Game>>(STORAGE_KEYS.GAME_CACHE, {});
    return cache[appId] || null;
  },
  cacheGame: (appId: string, game: Game) => {
    const cache = getItem<Record<string, Game>>(STORAGE_KEYS.GAME_CACHE, {});
    cache[appId] = game;
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      const oldKeys = keys.slice(0, keys.length - 100);
      oldKeys.forEach(k => delete cache[k]);
    }
    setItem(STORAGE_KEYS.GAME_CACHE, cache);
  },

  clearUserData: (userId: string) => {
    const ratings = storage.getRatings().filter(r => r.userId !== userId);
    storage.setRatings(ratings);
    const wishlist = storage.getWishlist().filter(w => w.userId !== userId);
    storage.setWishlist(wishlist);
    const purchased = storage.getPurchasedGames().filter(p => p.userId !== userId);
    storage.setPurchasedGames(purchased);
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};

export default storage;
