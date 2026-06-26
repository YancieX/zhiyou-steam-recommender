import { create } from 'zustand';
import type { Game, Rating, PurchasedGame } from '../data/mockData';
import { mockGames, mockRatings, mockPurchasedGames } from '../data/mockData';
import { storage } from '../utils/storage';
import { getRecommendations } from '../utils/recommendation';
import { useUserStore } from './userStore';
import { syncPricesFromSteam, shouldUpdatePrices } from '../utils/steamApi';
import { getFeaturedGames, convertToGame, type SteamSearchResult } from '../utils/steamSearch';

interface GameState {
  games: Game[];
  ratings: Rating[];
  purchasedGames: PurchasedGame[];
  browsedGames: Game[];
  isSyncingPrices: boolean;
  lastPriceSync: string | null;
  featuredGames: {
    specials: Game[];
    topSellers: Game[];
    newReleases: Game[];
  };
  isLoadingFeatured: boolean;
  initialize: () => void;
  getRecommendations: (userId: string) => Game[];
  rateGame: (userId: string, gameId: string, score: number, playtimeHours: number) => void;
  purchaseGame: (userId: string, gameId: string, game?: Game, source?: 'manual' | 'steam_import') => void;
  hasPurchased: (userId: string, gameId: string) => boolean;
  getUserRatings: (userId: string) => Rating[];
  getUserPurchasedGames: (userId: string) => Game[];
  syncPricesWithSteam: () => Promise<{ success: number; failed: number; total: number }>;
  getSaleGames: () => Game[];
  addBrowsedGame: (game: Game) => void;
  getBrowsedGames: () => Game[];
  loadFeaturedGames: () => Promise<void>;
  addGameToLibrary: (game: Game) => boolean;
  removeGameFromLibrary: (gameId: string) => void;
  clearAllMockData: () => void;
  clearUserMockData: (userId: string) => void;
  hasMockData: () => boolean;
  removeSteamImportedGames: (userId: string) => number;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [],
  ratings: [],
  purchasedGames: [],
  browsedGames: [],
  isSyncingPrices: false,
  lastPriceSync: null,
  featuredGames: {
    specials: [],
    topSellers: [],
    newReleases: [],
  },
  isLoadingFeatured: false,

  initialize: () => {
    let games = storage.getGames();
    if (!Array.isArray(games)) {
      games = [];
    }
    
    const ratings = storage.getRatings();
    if (!Array.isArray(ratings)) {
      // Empty block - ratings validation
    }
    
    let purchasedGames = storage.getPurchasedGames();
    if (!Array.isArray(purchasedGames)) {
      purchasedGames = [];
    }
    
    const lastSync = storage.getLastPriceSync();
    set({ 
      games: Array.isArray(games) ? games : [], 
      ratings: Array.isArray(ratings) ? ratings : [], 
      purchasedGames: Array.isArray(purchasedGames) ? purchasedGames : [], 
      lastPriceSync: lastSync 
    });
    
    get().loadFeaturedGames();
    
    if (games.length > 0 && shouldUpdatePrices(lastSync)) {
      setTimeout(() => {
        get().syncPricesWithSteam();
      }, 2000);
    }
  },

  getRecommendations: (userId: string) => {
    const { games, ratings } = get();
    const users = useUserStore.getState().users;
    const userIds = users.map(u => u.id);
    return getRecommendations(userId, games, ratings, userIds);
  },

  rateGame: (userId: string, gameId: string, score: number, playtimeHours: number) => {
    const { ratings } = get();
    
    const existingIndex = ratings.findIndex(
      r => r.userId === userId && r.gameId === gameId
    );
    
    let updatedRatings: Rating[];
    if (existingIndex >= 0) {
      updatedRatings = [...ratings];
      updatedRatings[existingIndex] = {
        ...updatedRatings[existingIndex],
        score,
        playtimeHours,
        createdAt: new Date().toISOString(),
      };
    } else {
      updatedRatings = [
        ...ratings,
        {
          userId,
          gameId,
          score,
          playtimeHours,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    
    storage.setRatings(updatedRatings);
    set({ ratings: updatedRatings });
  },

  purchaseGame: (userId: string, gameId: string, game?: Game, source?: 'manual' | 'steam_import') => {
    const { purchasedGames, games, browsedGames } = get();
    
    if (purchasedGames.some(p => p.userId === userId && p.gameId === gameId)) {
      return;
    }
    
    if (game && !games.some(g => g.id === gameId)) {
      const gameWithSource = { ...game, source: source || 'manual' };
      const updatedGames = [...games, gameWithSource];
      storage.setGames(updatedGames);
      set({ games: updatedGames });
    }
    
    const newPurchase: PurchasedGame = {
      userId,
      gameId,
      purchasedAt: new Date().toISOString(),
      source,
    };
    
    const updated = [...purchasedGames, newPurchase];
    storage.setPurchasedGames(updated);
    set({ purchasedGames: updated });
  },

  addBrowsedGame: (game: Game) => {
    const { browsedGames } = get();
    
    const existingIndex = browsedGames.findIndex(g => g.id === game.id);
    if (existingIndex >= 0) {
      const updated = [...browsedGames];
      updated[existingIndex] = { ...game, source: 'browsed' };
      set({ browsedGames: updated });
    } else {
      const gameWithSource = { ...game, source: 'browsed' as const };
      set({ browsedGames: [...browsedGames, gameWithSource] });
    }
  },

  getBrowsedGames: () => {
    return get().browsedGames;
  },

  hasPurchased: (userId: string, gameId: string) => {
    const { purchasedGames } = get();
    return purchasedGames.some(p => p.userId === userId && p.gameId === gameId);
  },

  getUserRatings: (userId: string) => {
    const { ratings } = get();
    return ratings.filter(r => r.userId === userId);
  },

  getUserPurchasedGames: (userId: string) => {
    const { games, purchasedGames } = get();
    const userGameIds = purchasedGames
      .filter(p => p.userId === userId)
      .map(p => p.gameId);
    return games.filter(g => userGameIds.includes(g.id));
  },

  syncPricesWithSteam: async (): Promise<{ success: number; failed: number; total: number }> => {
    const { games } = get();
    set({ isSyncingPrices: true });
    
    try {
      const result = await syncPricesFromSteam(games);
      const now = new Date().toISOString();
      storage.setGames(result.updatedGames);
      storage.setLastPriceSync(now);
      set({
        games: result.updatedGames,
        isSyncingPrices: false,
        lastPriceSync: now,
      });
      return { success: result.success, failed: result.failed, total: result.total };
    } catch (error) {
      console.error('价格同步失败:', error);
      set({ isSyncingPrices: false });
      return { success: 0, failed: 0, total: 0 };
    }
  },

  getSaleGames: () => {
    const { featuredGames } = get();
    if (featuredGames.specials.length > 0) {
      return featuredGames.specials;
    }
    return [];
  },

  loadFeaturedGames: async () => {
    if (get().isLoadingFeatured) return;
    
    set({ isLoadingFeatured: true });
    
    try {
      const featured = await getFeaturedGames();
      
      const convertList = (items: SteamSearchResult[]): Game[] => {
        return items.map(item => convertToGame(item));
      };
      
      set({
        featuredGames: {
          specials: convertList(featured.specials),
          topSellers: convertList(featured.topSellers),
          newReleases: convertList(featured.newReleases),
        },
        isLoadingFeatured: false,
      });
    } catch (error) {
      console.error('加载热门游戏失败:', error);
      set({ isLoadingFeatured: false });
    }
  },

  addGameToLibrary: (game: Game) => {
    const { games } = get();
    
    if (games.some(g => g.id === game.id)) {
      return false;
    }
    
    const updated = [...games, game];
    storage.setGames(updated);
    set({ games: updated });
    return true;
  },

  removeGameFromLibrary: (gameId: string) => {
    const { games, ratings, purchasedGames } = get();
    const updatedGames = games.filter(g => g.id !== gameId);
    const updatedRatings = ratings.filter(r => r.gameId !== gameId);
    const updatedPurchased = purchasedGames.filter(p => p.gameId !== gameId);
    
    storage.setGames(updatedGames);
    storage.setRatings(updatedRatings);
    storage.setPurchasedGames(updatedPurchased);
    
    set({ 
      games: updatedGames, 
      ratings: updatedRatings, 
      purchasedGames: updatedPurchased 
    });
  },

  clearAllMockData: () => {
    const { ratings, purchasedGames } = get();
    const mockUserIds = ['user-1', 'user-2', 'user-3'];
    const updatedRatings = ratings.filter(r => !mockUserIds.includes(r.userId));
    const updatedPurchased = purchasedGames.filter(p => !mockUserIds.includes(p.userId));
    
    storage.setRatings(updatedRatings);
    storage.setPurchasedGames(updatedPurchased);
    set({ ratings: updatedRatings, purchasedGames: updatedPurchased });
  },

  clearUserMockData: (userId: string) => {
    const { ratings, purchasedGames } = get();
    const updatedRatings = ratings.filter(r => r.userId !== userId);
    const updatedPurchased = purchasedGames.filter(p => p.userId !== userId);
    
    storage.setRatings(updatedRatings);
    storage.setPurchasedGames(updatedPurchased);
    
    set({ ratings: updatedRatings, purchasedGames: updatedPurchased });
  },

  removeSteamImportedGames: (userId: string) => {
    const { games, ratings, purchasedGames } = get();
    
    const steamImportedPurchases = purchasedGames.filter(
      p => p.userId === userId && p.source === 'steam_import'
    );
    const steamImportedGameIds = new Set(steamImportedPurchases.map(p => p.gameId));
    
    const updatedPurchased = purchasedGames.filter(
      p => !(p.userId === userId && p.source === 'steam_import')
    );
    const updatedRatings = ratings.filter(
      r => !(r.userId === userId && steamImportedGameIds.has(r.gameId))
    );
    
    const remainingGameIds = new Set(updatedPurchased.map(p => p.gameId));
    const updatedGames = games.filter(g => 
      g.source !== 'steam_import' || remainingGameIds.has(g.id)
    );
    
    const removedCount = steamImportedPurchases.length;
    
    storage.setGames(updatedGames);
    storage.setRatings(updatedRatings);
    storage.setPurchasedGames(updatedPurchased);
    
    set({ 
      games: updatedGames, 
      ratings: updatedRatings, 
      purchasedGames: updatedPurchased 
    });
    
    return removedCount;
  },

  hasMockData: () => {
    const { ratings, purchasedGames } = get();
    const mockUserIds = ['user-1', 'user-2', 'user-3'];
    const mockRatingCount = ratings.filter(r => mockUserIds.includes(r.userId)).length;
    const mockPurchaseCount = purchasedGames.filter(p => mockUserIds.includes(p.userId)).length;
    
    return mockRatingCount > 0 || mockPurchaseCount > 0;
  },
}));
