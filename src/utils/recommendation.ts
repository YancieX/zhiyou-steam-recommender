import type { Game, Rating } from '../data/mockData';

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  return norm1 && norm2 ? dotProduct / (norm1 * norm2) : 0;
}

function normalizePlaytime(playtimeHours: number): number {
  return Math.min(playtimeHours / 100, 1);
}

export function getRecommendations(
  userId: string,
  games: Game[],
  ratings: Rating[],
  allUserIds: string[]
): Game[] {
  if (!userId || games.length === 0) return [];

  const userRatings = ratings.filter(r => r.userId === userId);
  const userRatedGameIds = new Set(userRatings.map(r => r.gameId));
  
  const unratedGames = games.filter(g => !userRatedGameIds.has(g.id) && g.isOnSale);
  
  if (unratedGames.length === 0) return [];
  
  const otherUsers = allUserIds.filter(id => id !== userId);
  
  if (otherUsers.length === 0) {
    return unratedGames.slice(0, 6);
  }
  
  const userVector = games.map(game => {
    const rating = userRatings.find(r => r.gameId === game.id);
    return rating ? rating.score : 0;
  });
  
  const userPlaytimeVector = games.map(game => {
    const rating = userRatings.find(r => r.gameId === game.id);
    return rating ? normalizePlaytime(rating.playtimeHours) : 0;
  });
  
  const scoredGames = unratedGames.map(game => {
    const otherUserScores: { userId: string; cfScore: number; playtimeWeight: number }[] = [];
    
    for (const otherUserId of otherUsers) {
      const otherRatings = ratings.filter(r => r.userId === otherUserId);
      const otherRatedGameIds = otherRatings.map(r => r.gameId);
      
      if (!otherRatedGameIds.includes(game.id)) continue;
      
      const otherVector = games.map(g => {
        const rating = otherRatings.find(r => r.gameId === g.id);
        return rating ? rating.score : 0;
      });
      
      const otherPlaytimeVector = games.map(g => {
        const rating = otherRatings.find(r => r.gameId === g.id);
        return rating ? normalizePlaytime(rating.playtimeHours) : 0;
      });
      
      const cfScore = cosineSimilarity(userVector, otherVector);
      const otherGameRating = otherRatings.find(r => r.gameId === game.id);
      const otherPlaytimeWeight = otherGameRating 
        ? normalizePlaytime(otherGameRating.playtimeHours) 
        : 0;
      
      otherUserScores.push({
        userId: otherUserId,
        cfScore: Math.max(0, cfScore),
        playtimeWeight: otherPlaytimeWeight,
      });
    }
    
    if (otherUserScores.length === 0) {
      return { game, score: 0 };
    }
    
    const avgCfScore = otherUserScores.reduce((sum, u) => sum + u.cfScore, 0) / otherUserScores.length;
    const avgPlaytimeWeight = otherUserScores.reduce((sum, u) => sum + u.playtimeWeight, 0) / otherUserScores.length;
    
    const hybridScore = 0.6 * avgCfScore + 0.4 * avgPlaytimeWeight;
    
    return { game, score: hybridScore };
  });
  
  scoredGames.sort((a, b) => b.score - a.score);
  
  return scoredGames.slice(0, 6).map(sg => sg.game);
}

export function calculateUserSimilarity(
  userId1: string,
  userId2: string,
  games: Game[],
  ratings: Rating[]
): number {
  const ratings1 = ratings.filter(r => r.userId === userId1);
  const ratings2 = ratings.filter(r => r.userId === userId2);
  
  const vector1 = games.map(g => {
    const r = ratings1.find(r => r.gameId === g.id);
    return r ? r.score : 0;
  });
  
  const vector2 = games.map(g => {
    const r = ratings2.find(r => r.gameId === g.id);
    return r ? r.score : 0;
  });
  
  return cosineSimilarity(vector1, vector2);
}

export function getGamesByGenre(genre: string, games: Game[]): Game[] {
  return games.filter(g => g.genre === genre);
}

export function getGamesByTags(tags: string[], games: Game[]): Game[] {
  return games.filter(g => 
    g.tags.some(tag => tags.includes(tag))
  );
}

export function searchGames(query: string, games: Game[]): Game[] {
  const lowerQuery = query.toLowerCase();
  return games.filter(g => 
    g.name.toLowerCase().includes(lowerQuery) ||
    g.description.toLowerCase().includes(lowerQuery) ||
    g.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
