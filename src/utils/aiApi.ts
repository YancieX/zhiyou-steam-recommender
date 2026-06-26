// AI推荐API模块
// 在实际环境中，这里会调用OpenAI、Claude或其他大语言模型API
// 通过分析用户偏好和游戏数据，AI为用户推荐游戏

import type { Game, Rating, User } from '../data/mockData';

export interface AIRecommendation {
  gameId: string;
  gameName: string;
  score: number;
  reason: string;
  matchAspects: string[];
  estimatedInterest: number;
}

export interface AIRecommendRequest {
  user: User;
  userRatings: Rating[];
  availableGames: Game[]; // 推荐候选池（应该是Steam上的游戏，而非用户浏览过的）
  purchasedGames?: Game[]; // 用户已购买的游戏（用于偏好分析）
  wishlistGames?: Game[]; // 用户愿望单中的游戏（用于偏好分析）
  topK?: number;
}

export interface AIRecommendResponse {
  recommendations: AIRecommendation[];
  aiModel: string;
  analysisText: string;
  generatedAt: string;
}

/**
 * 模拟AI推荐算法的核心函数
 * 实际生产环境中，这里会调用类似OpenAI的Chat Completions API：
 * 
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [
 *     {
 *       role: "system",
 *       content: "你是一个游戏推荐AI..."
 *     },
 *     {
 *       role: "user",
 *       content: `基于用户评分数据：${JSON.stringify(userRatings)}，游戏库：${JSON.stringify(games)}，推荐游戏...`
 *     }
 *   ]
 * });
 */

/**
 * 智能分析用户偏好（基于已购买、评分和愿望单的游戏）
 */
function analyzeUserPreferences(userRatings: Rating[], purchasedGames: Game[], wishlistGames: Game[] = []) {
  // 分析用户已购买并评分的游戏（这些才是真正游玩过的游戏）
  const ratedGames = userRatings
    .map(r => {
      const game = purchasedGames.find(g => g.id === r.gameId);
      return game ? { ...r, game } : null;
    })
    .filter((item): item is Rating & { game: Game } => item !== null);

  // 计算类型偏好和标签偏好
  const genreScores: Record<string, { totalScore: number; count: number }> = {};
  const tagScores: Record<string, { totalScore: number; count: number }> = {};
  
  // 提取所有偏好游戏的内容关键词
  const contentKeywords: Set<string> = new Set();

  // 处理已评分的游戏（权重更高）
  ratedGames.forEach(({ score, playtimeHours, game }) => {
    // 类型偏好
    if (!genreScores[game.genre]) {
      genreScores[game.genre] = { totalScore: 0, count: 0 };
    }
    genreScores[game.genre].totalScore += score * (1 + playtimeHours / 100) * 1.5;
    genreScores[game.genre].count += 1;

    // 标签偏好
    game.tags.forEach(tag => {
      if (!tagScores[tag]) {
        tagScores[tag] = { totalScore: 0, count: 0 };
      }
      tagScores[tag].totalScore += score * (1 + playtimeHours / 200) * 1.5;
      tagScores[tag].count += 1;
    });
    
    // 提取游戏内容关键词
    const contentText = (game.aboutTheGame || '') + ' ' + (game.description || '');
    const words = extractKeywords(contentText);
    words.forEach(word => {
      const weight = score * (1 + playtimeHours / 200);
      if (weight >= 3) {
        contentKeywords.add(word.toLowerCase());
      }
    });
  });

  // 处理愿望单游戏（权重稍低，但也反映用户偏好）
  wishlistGames.forEach(game => {
    // 类型偏好（愿望单游戏权重为已评分游戏的0.7）
    if (!genreScores[game.genre]) {
      genreScores[game.genre] = { totalScore: 0, count: 0 };
    }
    genreScores[game.genre].totalScore += 4 * 0.7;
    genreScores[game.genre].count += 1;

    // 标签偏好
    game.tags.forEach(tag => {
      if (!tagScores[tag]) {
        tagScores[tag] = { totalScore: 0, count: 0 };
      }
      tagScores[tag].totalScore += 4 * 0.7;
      tagScores[tag].count += 1;
    });
    
    // 提取游戏内容关键词（愿望单游戏权重稍低）
    const contentText = (game.aboutTheGame || '') + ' ' + (game.description || '');
    const words = extractKeywords(contentText);
    words.forEach(word => {
      contentKeywords.add(word.toLowerCase());
    });
  });

  // 计算平均偏好分
  const preferredGenres = Object.entries(genreScores)
    .map(([genre, data]) => ({ genre, avgScore: data.totalScore / Math.max(data.count, 1) }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map(item => item.genre);

  const preferredTags = Object.entries(tagScores)
    .map(([tag, data]) => ({ tag, avgScore: data.totalScore / Math.max(data.count, 1) }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
    .map(item => item.tag);

  return { preferredGenres, preferredTags, ratedGames, contentKeywords, wishlistGames };
}

/**
 * 从文本中提取关键词
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // 移除HTML标签
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  
  // 常见停用词（中英文混合）
  const stopWords = new Set([
    '的', '是', '在', '了', '和', '与', '或', '等', '及', '将', '这', '那', '有', '为', '以',
    '于', '上', '下', '中', '内', '外', '前', '后', '左', '右', '不', '也', '都', '就', '并',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'shall', 'may', 'of', 'in', 'on', 'at', 'to', 'for',
    'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but',
    'and', 'or', 'if', 'while', 'although', 'though', 'that', 'this', 'these',
    'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
  ]);
  
  // 分词（支持中英文）
  const words: string[] = [];
  
  // 提取英文单词
  const englishWords = cleanText.match(/[a-zA-Z]{4,}/g) || [];
  englishWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (!stopWords.has(lowerWord) && lowerWord.length >= 4) {
      words.push(lowerWord);
    }
  });
  
  // 提取中文词汇（简单的2-4字词组提取）
  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  chineseChars.forEach(segment => {
    for (let i = 0; i < segment.length - 1; i++) {
      const word = segment.slice(i, Math.min(i + 2, segment.length));
      if (!stopWords.has(word)) {
        words.push(word);
      }
    }
  });
  
  // 去重并返回
  return [...new Set(words)];
}

/**
 * 计算游戏内容相似度（基于"关于这款游戏"文本）
 */
function calculateContentSimilarity(
  game: Game,
  preferences: ReturnType<typeof analyzeUserPreferences>
): { score: number; matchedKeywords: string[] } {
  const gameContent = (game.aboutTheGame || '') + ' ' + (game.description || '') + ' ' + (game.detailedDescription || '');
  
  if (!gameContent || preferences.contentKeywords.size === 0) {
    return { score: 0, matchedKeywords: [] };
  }
  
  const gameKeywords = new Set(extractKeywords(gameContent).map(w => w.toLowerCase()));
  const matched: string[] = [];
  
  preferences.contentKeywords.forEach(keyword => {
    if (gameKeywords.has(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  });
  
  // 计算相似度分数（基于匹配的关键词比例）
  const totalPreferenceKeywords = preferences.contentKeywords.size;
  const matchRatio = totalPreferenceKeywords > 0 ? matched.length / Math.min(totalPreferenceKeywords, 20) : 0;
  const score = Math.round(matchRatio * 100);
  
  return { score, matchedKeywords: matched.slice(0, 5) };
}

/**
 * 计算游戏与用户偏好的匹配度
 * 优先级：匹配程度/内容主题相似度 > 游玩人数（热门程度） > 评分
 * 评分与人数权衡：若评分显著高，可弥补人数略低的劣势
 */
function calculateMatchScore(game: Game, preferences: ReturnType<typeof analyzeUserPreferences>): {
  score: number;
  matchAspects: string[];
  matchScore: number;
  popularityScore: number;
  ratingScore: number;
} {
  let matchScore = 0;
  const matchAspects: string[] = [];
  
  // 1. 类型匹配（核心匹配度）
  if (preferences.preferredGenres.includes(game.genre)) {
    matchScore += 30;
    matchAspects.push(`您喜爱的${game.genre}类型`);
  }
  
  // 2. 标签匹配（核心匹配度）
  const matchedTags = game.tags.filter(tag => preferences.preferredTags.includes(tag));
  if (matchedTags.length > 0) {
    matchScore += matchedTags.length * 6;
    matchAspects.push(...matchedTags.slice(0, 2).map(t => `标签:${t}`));
  }
  
  // 3. 内容相似度匹配（基于"关于这款游戏"文本）- 高权重
  const contentSim = calculateContentSimilarity(game, preferences);
  if (contentSim.score >= 30) {
    matchScore += Math.min(contentSim.score * 0.5, 30);
    if (contentSim.matchedKeywords.length > 0) {
      matchAspects.push(`内容主题相似`);
    }
  }
  
  // 4. 促销加成（适度权重）
  if (game.isOnSale && game.discount >= 30) {
    matchScore += 8;
    matchAspects.push(`当前促销${game.discount}%OFF`);
  }
  
  // 计算热门程度分数（游玩人数）
  let popularityScore = 0;
  if (game.steamRating && game.steamRating >= 95) {
    popularityScore = 20;
  } else if (game.steamRating && game.steamRating >= 90) {
    popularityScore = 15;
  } else if (game.steamRating && game.steamRating >= 80) {
    popularityScore = 10;
  } else if (game.steamRating && game.steamRating >= 70) {
    popularityScore = 5;
  }
  
  // 计算评分数
  let ratingScore = 0;
  const gameRating = game.rating || (game.steamRating ? game.steamRating / 20 : 0);
  if (gameRating >= 4.8) {
    ratingScore = 15;
  } else if (gameRating >= 4.5) {
    ratingScore = 12;
  } else if (gameRating >= 4.2) {
    ratingScore = 8;
  } else if (gameRating >= 4.0) {
    ratingScore = 5;
  }
  
  // 评分与人数权衡逻辑：
  // 如果评分显著高于平均（>= 0.5分差距），可以弥补人数略低（1个等级差）的劣势
  // 具体实现：当评分足够高时，给予额外的综合加分
  let qualityBonus = 0;
  if (gameRating >= 4.7 && popularityScore >= 10) {
    qualityBonus = 5;
    matchAspects.push('高口碑热门作品');
  } else if (gameRating >= 4.5 && popularityScore < 10 && gameRating >= 4.5) {
    // 评分显著高但热度一般，给予质量加成弥补热度不足
    qualityBonus = 8;
    matchAspects.push('高口碑佳作');
  }
  
  // 综合得分 = 匹配度(最高权重) + 热门程度 + 评分 + 质量加成
  // 权重分配：匹配度约占60%，热度约占25%，评分约占15%
  const finalScore = Math.min(100, Math.round(matchScore * 0.7 + popularityScore * 1.2 + ratingScore + qualityBonus));
  
  return { 
    score: finalScore, 
    matchAspects: matchAspects.slice(0, 3),
    matchScore,
    popularityScore,
    ratingScore
  };
}

/**
 * 生成AI推荐理由
 */
function generateAIRecommendationReason(
  user: User,
  game: Game,
  preferences: ReturnType<typeof analyzeUserPreferences>
): string {
  const matchedGenres = preferences.preferredGenres.filter(g => g === game.genre);
  const matchedTags = game.tags.filter(t => preferences.preferredTags.includes(t));
  
  let reason = `基于${user.username}的游玩历史分析，`;
  
  if (matchedGenres.length > 0) {
    reason += `您对【${matchedGenres[0]}】类游戏表现出明显偏好，`;
  }
  
  if (matchedTags.length > 0) {
    reason += `且对【${matchedTags.slice(0, 2).join('、')}】等元素兴趣浓厚。`;
  }
  
  if (game.isOnSale) {
    reason += `当前该游戏正在促销(${game.discount}%OFF)，是入手的好时机。`;
  }
  
  if (game.rating && game.rating >= 4.5) {
    reason += `该作品在Steam上获得${game.rating}的高评分，品质有保障。`;
  }
  
  return reason;
}

/**
 * 调用AI推荐接口（模拟）
 * 实际生产环境替换为真实的大模型API调用
 */
export async function getAIRecommendations(
  request: AIRecommendRequest
): Promise<AIRecommendResponse> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

  const { user, userRatings, availableGames, purchasedGames = [], wishlistGames = [], topK = 6 } = request;

  // 使用已购买游戏和愿望单游戏进行偏好分析
  const preferences = analyzeUserPreferences(userRatings, purchasedGames, wishlistGames);

  // availableGames已经是推荐候选池（从Steam精选游戏中排除了已购买游戏）
  // 直接使用这些游戏作为推荐候选
  let candidateGames = availableGames;

  // 排除用户已购买的游戏
  const purchasedGameIds = new Set(purchasedGames.map(g => g.id));
  candidateGames = candidateGames.filter(g => !purchasedGameIds.has(g.id));

  // 如果候选池太小，补充更多游戏
  if (candidateGames.length < topK * 2) {
    const onSaleGames = availableGames.filter(g => g.isOnSale && g.originalPrice > 0);
    const highRatedGames = availableGames.filter(g =>
      (g.steamRating && g.steamRating >= 80 || g.metacriticScore && g.metacriticScore >= 85)
    );

    const supplementary = [...onSaleGames, ...highRatedGames]
      .filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i)
      .filter(g => !candidateGames.some(cg => cg.id === g.id));

    candidateGames = [...candidateGames, ...supplementary];
  }

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const hasEnoughData = userRatings.length >= 2 || wishlistGames.length >= 2;

  if (candidateGames.length < topK) {
    candidateGames = shuffleArray(availableGames).slice(0, topK * 2);
  }

  if (candidateGames.length === 0) {
    return {
      recommendations: [],
      aiModel: 'GPT-GameRec-1.0',
      analysisText: '暂无合适的推荐，建议先购买更多游戏并评分。',
      generatedAt: new Date().toISOString(),
    };
  }

  const scoredGames = candidateGames.map(game => {
    const { score, matchAspects, matchScore, popularityScore, ratingScore } = calculateMatchScore(game, preferences);

    let finalScore = score;

    // 如果用户偏好数据不足，增加随机性
    if (!hasEnoughData) {
      finalScore += Math.random() * 20;
    } else {
      finalScore += Math.random() * 5;
    }

    return {
      game,
      score: Math.min(100, Math.round(finalScore)),
      matchAspects,
      matchScore,
      popularityScore,
      ratingScore,
      reason: generateAIRecommendationReason(user, game, preferences),
    };
  });

  // 排序逻辑：
  // 1. 优先按匹配度排序（核心）
  // 2. 当匹配度相近（差距在10分以内）时，比较热门程度+评分的综合分数
  // 3. 这样实现了"评分显著高时优先推荐"的权衡逻辑
  scoredGames.sort((a, b) => {
    const matchDiff = b.matchScore - a.matchScore;
    
    // 如果匹配度差距大于15分，直接按匹配度排序
    if (Math.abs(matchDiff) > 15) {
      return b.score - a.score;
    }
    
    // 匹配度相近时，考虑热门程度和评分的综合
    // 评分权重在匹配度相近时提高
    const combinedA = a.matchScore * 0.6 + a.popularityScore * 1.0 + a.ratingScore * 1.5;
    const combinedB = b.matchScore * 0.6 + b.popularityScore * 1.0 + b.ratingScore * 1.5;
    
    return combinedB - combinedA;
  });

  let topRecommendations = scoredGames.slice(0, topK);

  if (topRecommendations.length < topK && scoredGames.length > 0) {
    const remaining = scoredGames.slice(topK);
    const shuffledRemaining = shuffleArray(remaining);
    topRecommendations = [...topRecommendations, ...shuffledRemaining].slice(0, topK);
  }

  const wishlistCount = wishlistGames.length;
  const analysisText = preferences.preferredGenres.length > 0
    ? `AI分析：基于您已购买的${purchasedGames.length}款游戏${wishlistCount > 0 ? `和愿望单中的${wishlistCount}款游戏` : ''}进行偏好分析，您是${preferences.preferredGenres[0]}类游戏爱好者，偏好${preferences.preferredTags.slice(0, 3).join('、')}等元素。AI综合考虑了内容主题相似度、热门程度和游戏品质，从Steam全游戏库中为您推荐以下${topRecommendations.length}款未玩过的高匹配游戏。`
    : `AI分析：基于Steam热门游戏和高评分作品，为您推荐${topRecommendations.length}款精选游戏。购买并评分更多游戏后可获得更精准的个性化推荐。`;

  return {
    recommendations: topRecommendations.map(rec => ({
      gameId: rec.game.id,
      gameName: rec.game.name,
      score: rec.score,
      reason: rec.reason,
      matchAspects: rec.matchAspects,
      estimatedInterest: Math.min(100, rec.score + Math.floor(Math.random() * 10)),
    })),
    aiModel: 'GPT-GameRec-2.0',
    analysisText,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * AI相似游戏推荐（基于单个游戏）
 */
export async function getSimilarGamesByAI(
  gameId: string,
  games: Game[],
  ratings: Rating[]
): Promise<AIRecommendation[]> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  
  const targetGame = games.find(g => g.id === gameId);
  if (!targetGame) return [];
  
  // 找出对该游戏评分高的用户群体
  const targetRatings = ratings.filter(r => r.gameId === gameId && r.score >= 4);
  const similarUserIds = new Set(targetRatings.map(r => r.userId));
  
  // 这些用户还评分高的游戏
  const relatedGameScores: Record<string, { score: number; count: number }> = {};
  ratings.forEach(r => {
    if (similarUserIds.has(r.userId) && r.gameId !== gameId && r.score >= 4) {
      if (!relatedGameScores[r.gameId]) {
        relatedGameScores[r.gameId] = { score: 0, count: 0 };
      }
      relatedGameScores[r.gameId].score += r.score;
      relatedGameScores[r.gameId].count += 1;
    }
  });
  
  // 评分归一化
  const similarGames = Object.entries(relatedGameScores)
    .map(([gId, data]) => {
      const game = games.find(g => g.id === gId);
      if (!game) return null;
      const avgScore = data.score / data.count;
      const typeMatch = game.genre === targetGame.genre ? 20 : 0;
      const tagMatch = game.tags.filter(t => targetGame.tags.includes(t)).length * 5;
      return {
        game,
        score: avgScore * 15 + typeMatch + tagMatch,
      };
    })
    .filter((item): item is { game: Game; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  
  return similarGames.map(({ game, score }) => ({
    gameId: game.id,
    gameName: game.name,
    score: Math.min(100, Math.round(score)),
    reason: `与【${targetGame.name}】同为${game.genre}类型，且核心玩家群体重合度较高。`,
    matchAspects: ['类型相同', '玩家群体重合'],
    estimatedInterest: Math.min(100, Math.round(score) + Math.floor(Math.random() * 10)),
  }));
}
