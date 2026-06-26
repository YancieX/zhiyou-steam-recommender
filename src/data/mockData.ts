export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  role?: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  steamId?: string;
  steamNickname?: string;
  steamAvatar?: string;
  steamImportedAt?: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  coverImage: string;
  tags: string[];
  genre: string;
  releaseYear: number;
  rating?: number;
  isOnSale: boolean;
  steamAppId?: string;
  steamRating?: number;
  steamReviewCount?: number;
  steamReviewSummary?: string;
  developers?: string[];
  publishers?: string[];
  releaseDate?: string;
  detailedDescription?: string;
  aboutTheGame?: string;
  screenshots?: string[];
  backgroundImage?: string;
  metacriticScore?: number;
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories?: string[];
  genres?: string[];
  playtimeMinutes?: number;
  lastPlayedAt?: number;
  source?: 'manual' | 'steam_import' | 'steam_search' | 'browsed';
  comingSoon?: boolean;
}

export interface Rating {
  userId: string;
  gameId: string;
  score: number;
  playtimeHours: number;
  createdAt: string;
}

export interface WishlistItem {
  userId: string;
  gameId: string;
  addedAt: string;
  originalPrice: number;
  currentPrice: number;
  notified: boolean;
}

export interface PurchasedGame {
  userId: string;
  gameId: string;
  purchasedAt: string;
  source?: 'manual' | 'steam_import';
}

export const mockGames: Game[] = [];

export const mockUsers: User[] = [];

export const mockRatings: Rating[] = [];

export const mockPurchasedGames: PurchasedGame[] = [];
