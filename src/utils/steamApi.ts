import type { Game } from '../data/mockData';
import { getSteamGameDetails } from './steamSearch';

export interface SteamPriceData {
  appId: string;
  name: string;
  currency: string;
  initialPrice: number;
  finalPrice: number;
  discountPercent: number;
  lastUpdated: string;
  isOnSale: boolean;
}

function extractAppId(gameId: string): string | null {
  const match = gameId.match(/game-steam-(\d+)/);
  if (match) return match[1];
  
  const numMatch = gameId.match(/(\d+)/);
  if (numMatch) return numMatch[1];
  
  return null;
}

export async function fetchSteamPrice(gameId: string): Promise<SteamPriceData | null> {
  const appId = extractAppId(gameId);
  if (!appId) return null;
  
  try {
    const details = await getSteamGameDetails(appId);
    if (!details) return null;
    
    return {
      appId,
      name: details.name,
      currency: 'CNY',
      initialPrice: details.originalPrice,
      finalPrice: details.price,
      discountPercent: details.discount,
      lastUpdated: new Date().toISOString(),
      isOnSale: details.isOnSale,
    };
  } catch (error) {
    console.error('获取Steam价格失败:', error);
    return null;
  }
}

export async function syncAllSteamPrices(games: Game[]): Promise<Map<string, SteamPriceData>> {
  const priceMap = new Map<string, SteamPriceData>();
  
  const steamGames = games.filter(g => g.id.startsWith('game-steam-'));
  const batchSize = 3;
  
  for (let i = 0; i < steamGames.length; i += batchSize) {
    const batch = steamGames.slice(i, i + batchSize);
    const promises = batch.map(async game => {
      const price = await fetchSteamPrice(game.id);
      if (price) {
        price.name = game.name;
        priceMap.set(game.id, price);
      }
    });
    
    await Promise.all(promises);
    
    if (i + batchSize < steamGames.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  return priceMap;
}

export interface SyncResult {
  success: number;
  failed: number;
  total: number;
  updatedGames: Game[];
}

export async function syncPricesFromSteam(games: Game[]): Promise<SyncResult> {
  const priceMap = await syncAllSteamPrices(games);
  
  let success = 0;
  let failed = 0;
  
  const updatedGames = games.map(game => {
    const steamPrice = priceMap.get(game.id);
    if (!steamPrice) {
      if (game.id.startsWith('game-steam-')) {
        failed++;
      }
      return game;
    }
    
    success++;
    return {
      ...game,
      originalPrice: steamPrice.initialPrice,
      salePrice: steamPrice.finalPrice,
      discount: steamPrice.discountPercent,
      isOnSale: steamPrice.isOnSale,
    };
  });
  
  const total = games.filter(g => g.id.startsWith('game-steam-')).length;
  
  return {
    success,
    failed: total - success,
    total,
    updatedGames,
  };
}

export function getNextGMTZeroUpdate(): Date {
  const now = new Date();
  const nextUpdate = new Date(now);
  
  nextUpdate.setUTCHours(24, 0, 0, 0);
  
  return nextUpdate;
}

export function getGMTDateString(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shouldUpdatePrices(lastUpdate: string | null): boolean {
  if (!lastUpdate) return true;
  
  const lastDate = new Date(lastUpdate);
  const now = new Date();
  
  const lastGMT = getGMTDateString(lastDate);
  const currentGMT = getGMTDateString(now);
  
  return lastGMT !== currentGMT;
}
