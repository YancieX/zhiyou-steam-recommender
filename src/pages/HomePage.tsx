import { useState, useEffect } from 'react';
import { Sparkles, TrendingDown, Gamepad2, Brain, RefreshCw, Lightbulb, Search, Star, Clock, Zap, Flame } from 'lucide-react';
import GameCard from '../components/GameCard';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useToastStore } from '../stores/toastStore';
import { useNavigate } from 'react-router-dom';
import { getAIRecommendations, type AIRecommendation } from '../utils/aiApi';
import { searchSteamGames, convertToGame, type SteamSearchResult } from '../utils/steamSearch';
import type { Game } from '../data/mockData';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useUserStore();
  const { 
    games, 
    getRecommendations, 
    getSaleGames, 
    getUserRatings, 
    syncPricesWithSteam, 
    isSyncingPrices,
    featuredGames,
    isLoadingFeatured,
    loadFeaturedGames,
    addGameToLibrary,
    addBrowsedGame,
    purchaseGame,
    getUserPurchasedGames,
  } = useGameStore();
  const { addToWishlist, removeFromWishlist, isInWishlist, getWishlistGame, getUserWishlist } = useWishlistStore();
  const addToast = useToastStore(state => state.addToast);
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [recommendedGames, setRecommendedGames] = useState<Game[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [useAI, setUseAI] = useState(true);
  
  const userRatings = currentUser ? getUserRatings(currentUser.id) : [];
  const hasRatings = userRatings.length > 0;
  const purchasedGames = currentUser ? getUserPurchasedGames(currentUser.id) : [];
  const hasGames = purchasedGames.length > 0;
  
  const displaySaleGames = featuredGames.specials;
  const displayTopSellers = featuredGames.topSellers;
  
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadAIRecommendations();
    }
  }, [isAuthenticated, currentUser?.id, useAI, games.length, featuredGames.specials.length]);
  
  const loadAIRecommendations = async () => {
    if (!currentUser) return;
    setIsLoadingAI(true);

    try {
      const purchasedGameIds = new Set(
        useGameStore.getState().purchasedGames
          .filter(p => p.userId === currentUser.id)
          .map(p => p.gameId)
      );
      
      // 获取愿望单游戏
      const userWishlist = getUserWishlist(currentUser.id);
      const wishlistGames = userWishlist
        .map(item => getWishlistGame(item.gameId))
        .filter((g): g is Game => g !== undefined);
      
      // 获取已推荐过的游戏（从localStorage）
      const recommendedGameIds = new Set<string>(
        JSON.parse(localStorage.getItem('zhiyou_recommended_games') || '[]')
      );

      // 扩展搜索关键词，覆盖更多Steam游戏类别
      const searchKeywords = [
        // 主流类型
        'action adventure',
        'RPG role playing game',
        'strategy game',
        'indie game',
        'simulation game',
        'first person shooter',
        'puzzle game',
        'sports racing',
        // 新增类型
        'horror game',
        'visual novel',
        'fighting game',
        'platformer',
        'open world',
        'survival game',
        'roguelike roguelite',
        'city builder',
        'tower defense',
        'card game deck building',
        'moba team game',
        'MMO massively multiplayer',
        'battle royale',
        'stealth game',
        'sandbox',
        'management simulation',
        // 更多细分类型
        'metroidvania',
        'souls-like',
        'battle royale',
        'auto battler',
      ];
      
      const searchPromises = searchKeywords.map(kw => 
        searchSteamGames(kw, 30).catch(() => [])
      );
      
      const searchResults = await Promise.all(searchPromises);

      const allSteamGames = searchResults
        .flat()
        .filter((g, i, arr) => arr.findIndex(x => x.appId === g.appId) === i);

      const steamGamePool = allSteamGames.map(g => convertToGame(g));

      // 排除已购买和已推荐过的游戏
      const candidateGames = steamGamePool.filter(g => 
        !purchasedGameIds.has(g.id) && !recommendedGameIds.has(g.id)
      );

      const purchasedGamesForAnalysis = games.filter(g => purchasedGameIds.has(g.id));

      const result = await getAIRecommendations({
        user: currentUser,
        userRatings,
        availableGames: candidateGames.length > 0 ? candidateGames : steamGamePool.filter(g => !purchasedGameIds.has(g.id)),
        purchasedGames: purchasedGamesForAnalysis,
        wishlistGames: wishlistGames,
        topK: 6,
      });
      
      setRecommendations(result.recommendations);
      
      // 筛选推荐结果中排除已购买和已推荐过的游戏
      const recGames = result.recommendations
        .filter(rec => !purchasedGameIds.has(rec.gameId) && !recommendedGameIds.has(rec.gameId))
        .map(rec => steamGamePool.find(g => g.id === rec.gameId))
        .filter((g): g is Game => g !== undefined);
      setRecommendedGames(recGames);
      
      // 保存本次推荐的游戏ID（用于下次排除）
      const allRecIds = [
        ...result.recommendations.map(r => r.gameId),
        ...Array.from(recommendedGameIds)
      ].slice(0, 200); // 最多保留200条历史记录
      localStorage.setItem('zhiyou_recommended_games', JSON.stringify(allRecIds));
      
      setAiAnalysis(result.analysisText);
      setAiModel(result.aiModel);
    } catch (error) {
      console.error('AI推荐失败:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };
  
  const cfRecommendations = isAuthenticated && currentUser && !useAI
    ? getRecommendations(currentUser.id)
    : [];
  
  const handleAddToWishlist = (gameId: string, game?: Game) => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    
    const gameStore = useGameStore.getState();
    const gameExists = gameStore.games.some(g => g.id === gameId);
    const browsedExists = gameStore.browsedGames.some(g => g.id === gameId);
    
    if (!gameExists && !browsedExists && game) {
      addBrowsedGame(game);
    }
    
    const inWishlist = isInWishlist(currentUser.id, gameId);
    if (inWishlist) {
      removeFromWishlist(currentUser.id, gameId);
      addToast('已从愿望单移除', 'success');
    } else {
      addToWishlist(currentUser.id, gameId, game);
      addToast('已添加至愿望单', 'success');
    }
  };
  
  const handleAddFeaturedGame = (game: Game) => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    purchaseGame(currentUser.id, game.id, game);
    navigate(`/game/${game.id}`);
  };
  
  useEffect(() => {
    loadFeaturedGames();
  }, []);
  
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-12">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full mb-4">
              <Brain className="w-5 h-5" />
              <span className="font-semibold">AI智能推荐引擎</span>
            </div>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">智荐优游</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              基于AI大模型与协同过滤算法，为您精准推荐Steam促销游戏，发现您的下一款心头好
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="glass-card p-6 rounded-xl text-center animate-fade-in-up stagger-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">AI大模型推荐</h3>
              <p className="text-gray-400 text-sm">基于AI大模型分析您的偏好，智能匹配最适合您的游戏</p>
            </div>
            
            <div className="glass-card p-6 rounded-xl text-center animate-fade-in-up stagger-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">实时价格监控</h3>
              <p className="text-gray-400 text-sm">同步Steam实时价格，降价时第一时间通知您</p>
            </div>
            
            <div className="glass-card p-6 rounded-xl text-center animate-fade-in-up stagger-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-orbitron text-lg font-bold text-white mb-2">协同过滤算法</h3>
              <p className="text-gray-400 text-sm">基于相似用户评分数据，发现您可能感兴趣的佳作</p>
              <div className="mt-3 text-xs text-cyan-400/70">
                <p>当您切换到"协同过滤"模式时，系统会分析其他用户对游戏的评分，找出与您品味相似的玩家群体，并推荐这些玩家喜欢但您还未玩过的游戏。</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 glass-card p-6 rounded-xl">
            <h3 className="font-orbitron text-lg font-bold text-white mb-4 text-center">推荐模式对比</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="font-semibold text-purple-300 mb-2">AI推荐模式</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 基于您已购买和评分游戏的类型、标签、内容主题分析</li>
                  <li>• 优先匹配偏好相似度，其次考虑热门程度和评分</li>
                  <li>• 适合想要发现符合个人口味游戏的玩家</li>
                  <li>• 会结合愿望单中的游戏偏好进行推荐</li>
                </ul>
              </div>
              <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                <h4 className="font-semibold text-cyan-300 mb-2">协同过滤模式</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 分析其他用户的评分行为找到"口味相似"的用户</li>
                  <li>• 推荐这些相似用户喜欢但您还未接触的游戏</li>
                  <li>• 可能发现您从未搜索过的冷门佳作</li>
                  <li>• 适合想要探索新类型、发现意外惊喜的玩家</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {isAuthenticated && !hasGames && (
          <section className="py-8">
            <div className="glass-card rounded-2xl p-8 border border-yellow-500/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-10 h-10 text-yellow-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-orbitron text-2xl font-bold text-white mb-2">开始您的个性化推荐之旅</h2>
                  <p className="text-gray-400 mb-4">
                    您还没有添加任何游戏。从Steam搜索并购买您喜欢的游戏，进行评分后，AI将为您生成更精准的个性化推荐。
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => navigate('/search')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      搜索Steam游戏
                    </button>
                    <button
                      onClick={() => navigate('/profile?tab=steam')}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      导入Steam账号
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {!isAuthenticated && (
          <section className="py-8">
            <div className="glass-card rounded-2xl p-8 border border-purple-500/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-10 h-10 text-purple-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-orbitron text-2xl font-bold text-white mb-2">登录获取专属推荐</h2>
                  <p className="text-gray-400 mb-4">
                    登录账号后，您可以录入Steam游戏、评分并收藏愿望单，AI将根据您的偏好为您精准推荐游戏。
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      onClick={() => navigate('/login')}
                      className="btn-primary"
                    >
                      立即登录
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="btn-secondary"
                    >
                      注册账号
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {isAuthenticated && (
          <section className="py-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="font-orbitron text-2xl font-bold text-white">AI为您推荐</h2>
                {aiModel && (
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                    {aiModel}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setUseAI(true)}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      useAI 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AI推荐
                  </button>
                  <button
                    onClick={() => setUseAI(false)}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      !useAI 
                        ? 'bg-cyan-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    协同过滤
                  </button>
                </div>
                
                {useAI && (
                  <button
                    onClick={loadAIRecommendations}
                    disabled={isLoadingAI}
                    className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                    重新分析
                  </button>
                )}
              </div>
            </div>
            
            {aiAnalysis && useAI && (
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-3 animate-fade-in-up">
                <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm leading-relaxed">{aiAnalysis}</p>
              </div>
            )}
            
            {isLoadingAI ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-400">AI正在分析您的游戏偏好...</p>
              </div>
            ) : useAI ? (
              recommendedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedGames.map((game, index) => {
                    const rec = recommendations.find(r => r.gameId === game.id);
                    if (!rec) return null;
                    return (
                      <div key={game.id} className={`animate-fade-in-up stagger-${index + 1} relative`}>
                        <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          AI匹配 {rec.score}%
                        </div>
                        <GameCard
                          game={game}
                          onAddToWishlist={() => handleAddToWishlist(game.id, game)}
                          isInWishlist={currentUser ? isInWishlist(currentUser.id, game.id) : false}
                        />
                        <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-gray-300">
                          <p className="font-semibold text-purple-300 mb-1">AI推荐理由:</p>
                          <p>{rec.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-12 text-center">
                  <p className="text-gray-400">暂无AI推荐数据</p>
                </div>
              )
            ) : cfRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cfRecommendations.map((game, index) => (
                  <div key={game.id} className={`animate-fade-in-up stagger-${index + 1}`}>
                    <GameCard
                      game={game}
                      onAddToWishlist={() => handleAddToWishlist(game.id)}
                      isInWishlist={currentUser ? isInWishlist(currentUser.id, game.id) : false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-12 text-center">
                <p className="text-gray-400">暂无推荐数据</p>
              </div>
            )}
          </section>
        )}
        
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <h2 className="font-orbitron text-2xl font-bold text-white">
                Steam热门促销
              </h2>
              <span className="text-gray-400 text-sm">({displaySaleGames.length}款游戏)</span>
              {isSyncingPrices && (
                <span className="text-xs text-cyan-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  同步中
                </span>
              )}
            </div>
            <button
              onClick={() => loadFeaturedGames()}
              disabled={isLoadingFeatured}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFeatured ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
          
          {isLoadingFeatured ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400">正在加载Steam热门促销...</p>
            </div>
          ) : displaySaleGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displaySaleGames.slice(0, 8).map((game, index) => (
                <div key={game.id} className={`animate-fade-in-up stagger-${(index % 6) + 1}`}>
                  <GameCard
                    game={game}
                    onAddToWishlist={() => handleAddToWishlist(game.id, game)}
                    isInWishlist={currentUser ? isInWishlist(currentUser.id, game.id) : false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-gray-400">暂无促销游戏数据</p>
            </div>
          )}
        </section>
        
        {displayTopSellers.length > 0 && (
          <section className="py-8">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="w-6 h-6 text-orange-400" />
              <h2 className="font-orbitron text-2xl font-bold text-white">Steam热销榜</h2>
              <span className="text-gray-400 text-sm">({displayTopSellers.length}款)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayTopSellers.slice(0, 4).map((game, index) => (
                <div key={game.id} className={`animate-fade-in-up stagger-${(index % 4) + 1} relative`}>
                  <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-br from-orange-500 to-yellow-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                    {index + 1}
                  </div>
                  <GameCard
                    game={game}
                    onAddToWishlist={() => handleAddToWishlist(game.id, game)}
                    isInWishlist={currentUser ? isInWishlist(currentUser.id, game.id) : false}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
        
        {isAuthenticated && !hasGames && (
          <section className="py-12">
            <div className="glass-card rounded-2xl p-8 text-center border border-cyan-500/20">
              <Gamepad2 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="font-orbitron text-2xl font-bold text-white mb-4">开启您的游戏数据之旅</h2>
              <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                从Steam全游戏库搜索并录入您喜欢的游戏，评分后AI将为您生成个性化推荐。
                您也可以通过导入Steam账号快速添加您的游戏库。
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => navigate('/search')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  搜索游戏
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  导入Steam账号
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
