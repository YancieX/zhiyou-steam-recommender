import { create } from 'zustand';
import type { WishlistItem, Game } from '../data/mockData';
import { storage } from '../utils/storage';
import { useGameStore } from './gameStore';

interface PriceAlert {
  gameId: string;
  gameName: string;
  originalPrice: number;
  currentPrice: number;
  droppedAt: string;
}

interface WishlistState {
  wishlist: WishlistItem[];
  priceAlerts: PriceAlert[];
  wishlistGames: Record<string, Game>;
  initialize: () => void;
  addToWishlist: (userId: string, gameId: string, game?: Game) => void;
  removeFromWishlist: (userId: string, gameId: string) => void;
  isInWishlist: (userId: string, gameId: string) => boolean;
  getUserWishlist: (userId: string) => WishlistItem[];
  getWishlistGame: (gameId: string) => Game | undefined;
  checkPriceChanges: () => PriceAlert[];
  clearNotifications: (userId: string) => void;
  getPriceDropCount: (userId: string) => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],
  priceAlerts: [],
  wishlistGames: {},

  initialize: () => {
    const wishlist = storage.getWishlist();
    const wishlistGames = storage.getWishlistGames();
    set({ wishlist, wishlistGames: wishlistGames || {} });
    
    const alerts = get().checkPriceChanges();
    set({ priceAlerts: alerts });
  },

  addToWishlist: (userId: string, gameId: string, game?: Game) => {
    const { wishlist, wishlistGames } = get();
    const gameStore = useGameStore.getState();
    
    let gameData = game || gameStore.games.find(g => g.id === gameId) || gameStore.browsedGames.find(g => g.id === gameId);
    
    if (!gameData) return;
    
    if (wishlist.some(w => w.userId === userId && w.gameId === gameId)) {
      return;
    }
    
    const newItem: WishlistItem = {
      userId,
      gameId,
      addedAt: new Date().toISOString(),
      originalPrice: gameData.originalPrice,
      currentPrice: gameData.salePrice,
      notified: false,
    };
    
    const updatedWishlist = [...wishlist, newItem];
    const updatedGames = { ...wishlistGames, [gameId]: gameData };
    
    storage.setWishlist(updatedWishlist);
    storage.setWishlistGames(updatedGames);
    set({ wishlist: updatedWishlist, wishlistGames: updatedGames });
  },

  removeFromWishlist: (userId: string, gameId: string) => {
    const { wishlist, wishlistGames } = get();
    const updatedWishlist = wishlist.filter(
      w => !(w.userId === userId && w.gameId === gameId)
    );
    
    const stillInWishlist = updatedWishlist.some(w => w.gameId === gameId);
    let updatedGames = wishlistGames;
    if (!stillInWishlist) {
      updatedGames = { ...wishlistGames };
      delete updatedGames[gameId];
    }
    
    storage.setWishlist(updatedWishlist);
    storage.setWishlistGames(updatedGames);
    set({ wishlist: updatedWishlist, wishlistGames: updatedGames });
  },

  isInWishlist: (userId: string, gameId: string) => {
    const { wishlist } = get();
    return wishlist.some(w => w.userId === userId && w.gameId === gameId);
  },

  getUserWishlist: (userId: string) => {
    const { wishlist } = get();
    return wishlist.filter(w => w.userId === userId);
  },

  getWishlistGame: (gameId: string) => {
    const { wishlistGames } = get();
    const gameStore = useGameStore.getState();
    return wishlistGames[gameId] || gameStore.games.find(g => g.id === gameId) || gameStore.browsedGames.find(g => g.id === gameId);
  },

  checkPriceChanges: () => {
    const { wishlist } = get();
    const gameStore = useGameStore.getState();
    
    const alerts: PriceAlert[] = [];
    const updatedWishlist = wishlist.map(item => {
      const game = gameStore.games.find(g => g.id === item.gameId);
      if (!game) return item;
      
      if (game.salePrice < item.currentPrice) {
        alerts.push({
          gameId: item.gameId,
          gameName: game.name,
          originalPrice: item.originalPrice,
          currentPrice: game.salePrice,
          droppedAt: new Date().toISOString(),
        });
        return { ...item, currentPrice: game.salePrice, notified: true };
      }
      return item;
    });
    
    if (JSON.stringify(wishlist) !== JSON.stringify(updatedWishlist)) {
      storage.setWishlist(updatedWishlist);
      set({ wishlist: updatedWishlist });
    }
    
    return alerts;
  },

  clearNotifications: (userId: string) => {
    const { wishlist } = get();
    const updated = wishlist.map(w => {
      if (w.userId === userId) {
        return { ...w, notified: false };
      }
      return w;
    });
    storage.setWishlist(updated);
    set({ wishlist: updated });
  },

  getPriceDropCount: (userId: string) => {
    const userWishlist = get().getUserWishlist(userId);
    return userWishlist.filter(w => w.notified).length;
  },
}));
