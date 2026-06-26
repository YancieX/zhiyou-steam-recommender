import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ShoppingCart, Check, X, Gamepad2, Loader2, Sparkles, RefreshCw, Clock, Trash2, Info, Star, ImageOff, Heart } from 'lucide-react';
import { searchSteamGames, convertToGame, type SteamSearchResult, proxyImage, proxyImageFallback } from '../utils/steamSearch';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useToastStore } from '../stores/toastStore';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';

const PAGE_SIZE = 10;

export default function SearchPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useUserStore();
  const { games, addGameToLibrary, addBrowsedGame } = useGameStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const addToast = useToastStore(state => state.addToast);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [allResults, setAllResults] = useState<SteamSearchResult[]>([]);
  const [displayedResults, setDisplayedResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [purchasedGames, setPurchasedGames] = useState<Set<string>>(new Set());
  const [imgErrors, setImgErrors] = useState<Record<string, number>>({});
  const [imgLoadingStates, setImgLoadingStates] = useState<Record<string, boolean>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  useEffect(() => {
    const { purchasedGames: pg, games } = useGameStore.getState();
    if (currentUser) {
      const userGameIds = pg
        .filter(p => p.userId === currentUser.id)
        .map(p => p.gameId);
      setPurchasedGames(new Set(userGameIds));
    }
  }, [currentUser]);
  
  const handleImgError = (appId: string) => {
    setImgErrors(prev => ({
      ...prev,
      [appId]: (prev[appId] || 0) + 1,
    }));
    // 图片加载失败，清除加载状态
    setImgLoadingStates(prev => {
      const next = { ...prev };
      delete next[appId];
      return next;
    });
  };

  const handleImgClick = (appId: string) => {
    // 点击重试时设置加载状态
    setImgLoadingStates(prev => ({ ...prev, [appId]: true }));
    setImgErrors(prev => ({
      ...prev,
      [appId]: Math.max(0, (prev[appId] || 0) - 1),
    }));
    // 2秒后自动清除加载状态（防止加载卡住）
    setTimeout(() => {
      setImgLoadingStates(prev => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
    }, 2000);
  };

  const isImgLoading = (appId: string) => imgLoadingStates[appId] || false;
  
  const getImageSrc = (result: SteamSearchResult) => {
    const errorCount = imgErrors[result.appId] || 0;
    if (!result.coverImage) return '';
    if (errorCount === 0) return proxyImage(result.coverImage);
    if (errorCount === 1) return proxyImageFallback(result.coverImage);
    return '';
  };
  
  useEffect(() => {
    setSearchHistory(storage.getSearchHistory());
  }, []);
  
  // 加载更多结果
  const loadMoreResults = useCallback(() => {
    if (isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const start = nextPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    setTimeout(() => {
      const newResults = allResults.slice(start, end);
      if (newResults.length > 0) {
        setDisplayedResults(prev => [...prev, ...newResults]);
        setCurrentPage(nextPage);
      }
      setHasMoreResults(end < allResults.length);
      setIsLoadingMore(false);
    }, 300);
  }, [currentPage, allResults, isLoadingMore, hasMoreResults]);

  // 设置无限滚动监听
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !isLoadingMore) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreResults, isLoadingMore, loadMoreResults]);

  const loadInitial = async () => {
    setIsSearching(true);
    setAllResults([]);
    setDisplayedResults([]);
    setCurrentPage(0);
    setHasMoreResults(false);
    try {
      const results = await searchSteamGames('', 100);
      setAllResults(results);
      setDisplayedResults(results.slice(0, PAGE_SIZE));
      setHasMoreResults(results.length > PAGE_SIZE);
    } finally {
      setIsSearching(false);
      setHasSearched(false);
    }
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setHasSearched(true);
    setAllResults([]);
    setDisplayedResults([]);
    setCurrentPage(0);
    setHasMoreResults(false);

    try {
      const results = await searchSteamGames(trimmed, 100);
      setAllResults(results);
      setDisplayedResults(results.slice(0, PAGE_SIZE));
      setHasMoreResults(results.length > PAGE_SIZE);
      storage.addSearchHistory(trimmed);
      setSearchHistory(storage.getSearchHistory());
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setIsSearching(true);
    setHasSearched(true);
    setAllResults([]);
    setDisplayedResults([]);
    setCurrentPage(0);
    setHasMoreResults(false);

    searchSteamGames(historyQuery, 100).then(results => {
      setAllResults(results);
      setDisplayedResults(results.slice(0, PAGE_SIZE));
      setHasMoreResults(results.length > PAGE_SIZE);
      storage.addSearchHistory(historyQuery);
      setSearchHistory(storage.getSearchHistory());
    }).finally(() => {
      setIsSearching(false);
    });
  };

  useEffect(() => {
    loadInitial();
  }, []);
  
  const clearHistory = () => {
    storage.clearSearchHistory();
    setSearchHistory([]);
  };
  
  const isGamePurchased = (steamAppId: string) => {
    const gameId = `game-steam-${steamAppId}`;
    return purchasedGames.has(gameId);
  };
  
  const handlePurchase = (result: SteamSearchResult) => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    
    const game = convertToGame(result);
    const gameStore = useGameStore.getState();
    
    if (!gameStore.games.some(g => g.id === game.id)) {
      gameStore.addGameToLibrary(game);
    }
    
    if (!purchasedGames.has(game.id)) {
      gameStore.purchaseGame(currentUser.id, game.id);
      setPurchasedGames(prev => new Set([...prev, game.id]));
    }
  };

  const handleAddToWishlist = (result: SteamSearchResult) => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    
    const gameId = `game-steam-${result.appId}`;
    const game = convertToGame(result);
    const gameStore = useGameStore.getState();
    
    const gameExists = gameStore.games.some(g => g.id === game.id);
    const browsedExists = gameStore.browsedGames.some(g => g.id === game.id);
    
    if (!gameExists && !browsedExists) {
      gameStore.addBrowsedGame(game);
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

  const isInWishlistLocal = (appId: string) => {
    if (!currentUser) return false;
    const gameId = `game-steam-${appId}`;
    return isInWishlist(currentUser.id, gameId);
  };
  
  const handleViewDetail = async (result: SteamSearchResult) => {
    const gameId = `game-steam-${result.appId}`;
    const gameStore = useGameStore.getState();
    const existingGame = gameStore.games.find(g => g.id === gameId);
    const existingBrowsed = gameStore.browsedGames.find(g => g.id === gameId);
    
    if (!existingGame && !existingBrowsed) {
      const game = convertToGame(result);
      gameStore.addBrowsedGame(game);
    }
    
    navigate(`/game/${gameId}`);
  };
  
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full mb-4">
            <Search className="w-5 h-5" />
            <span className="font-semibold">全Steam游戏库</span>
          </div>
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-2">
            搜索游戏
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            从Steam全游戏库中搜索喜欢的游戏，直接查看详情、购买和评分，获得个性化推荐
          </p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="搜索游戏名称或 Steam App ID..."
                className="w-full bg-white/5 border border-purple-500/30 rounded-xl pl-12 pr-4 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">搜索</span>
            </button>
          </div>
          
          {!hasSearched && searchHistory.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  搜索历史
                </p>
                <button
                  onClick={clearHistory}
                  className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  清除
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHistoryClick(item)}
                    className="text-sm px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 rounded-full border border-white/10 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              {isSearching ? '搜索中...' :
                hasSearched ? `找到 ${allResults.length} 个结果` :
                `热门推荐 ${allResults.length} 款`
              }
            </span>
          </div>
          <button
            onClick={loadInitial}
            disabled={isSearching}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {displayedResults.length === 0 && !isSearching ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {hasSearched ? '没有找到相关游戏，请尝试其他关键词' : '输入关键词开始搜索Steam游戏'}
            </p>
            {hasSearched && (
              <p className="text-gray-500 text-sm">
                提示：尝试使用英文名称搜索，或检查拼写是否正确
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedResults.map((result, index) => {
                const purchased = isGamePurchased(result.appId);
                const imgErrorCount = imgErrors[result.appId] || 0;
                const loading = isImgLoading(result.appId);

                return (
                  <div
                    key={result.appId}
                    className="game-card glass-card rounded-xl overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                  >
                    <div className="relative aspect-video bg-slate-800/50">
                      {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                      ) : imgErrorCount < 2 ? (
                        <img
                          src={getImageSrc(result)}
                          alt={result.name}
                          className={`w-full h-full object-cover ${imgErrorCount > 0 ? 'cursor-pointer opacity-80 hover:opacity-100' : ''}`}
                          loading="lazy"
                          onError={() => handleImgError(result.appId)}
                          onClick={() => handleImgClick(result.appId)}
                          title={imgErrorCount > 0 ? '点击重新加载图片' : ''}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:text-gray-400 transition-colors"
                          onClick={() => handleImgClick(result.appId)}
                        >
                          <ImageOff className="w-10 h-10 mb-2" />
                          <span className="text-xs">暂无图片</span>
                          <span className="text-xs mt-1 text-cyan-400">点击重试</span>
                        </div>
                      )}
                      {result.isOnSale && (
                        <div className="sale-badge">-{result.discount}%</div>
                      )}
                      {result.comingSoon && (
                        <div className="absolute top-2 left-2 bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                          即将推出
                        </div>
                      )}
                      {purchased && (
                        <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          已拥有
                        </div>
                      )}
                      {result.steamRating !== undefined && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          {result.steamRating}%
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3
                        className="font-orbitron text-base font-semibold text-white mb-2 line-clamp-1 cursor-pointer hover:text-purple-400 transition-colors"
                        onClick={() => handleViewDetail(result)}
                      >
                        {result.name}
                      </h3>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {result.genre && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                            {result.genre}
                          </span>
                        )}
                        {result.tags.slice(0, 1).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <span>App ID: {result.appId}</span>
                        {result.releaseYear > 1990 && (
                          <>
                            <span>•</span>
                            <span>{result.releaseYear}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        {result.isOnSale ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-red-400">¥{result.price.toFixed(2)}</span>
                              <span className="text-xs text-gray-500 line-through">¥{result.originalPrice.toFixed(2)}</span>
                            </div>
                            <span className="text-xs text-red-400">省 ¥{(result.originalPrice - result.price).toFixed(2)}</span>
                          </div>
                        ) : result.comingSoon ? (
                          <span className="text-lg font-bold text-yellow-400">即将推出</span>
                        ) : result.originalPrice > 0 ? (
                          <span className="text-lg font-bold text-white">¥{result.originalPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-lg font-bold text-green-400">免费</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {purchased ? (
                          <>
                            <button
                              onClick={() => handleAddToWishlist(result)}
                              className={`p-2 rounded-lg transition-colors ${
                                isInWishlistLocal(result.appId)
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-white/5 text-gray-400 hover:text-purple-400'
                              }`}
                              title={isInWishlistLocal(result.appId) ? '从愿望单移除' : '加入愿望单'}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlistLocal(result.appId) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleViewDetail(result)}
                              className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <Info className="w-4 h-4" />
                              查看详情
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePurchase(result)}
                              disabled={result.comingSoon}
                              className="flex-1 text-sm py-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              {result.comingSoon ? '即将推出' : '模拟购买'}
                            </button>
                            <button
                              onClick={() => handleAddToWishlist(result)}
                              className={`p-2 rounded-lg transition-colors ${
                                isInWishlistLocal(result.appId)
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-white/5 text-gray-400 hover:text-purple-400'
                              }`}
                              title={isInWishlistLocal(result.appId) ? '从愿望单移除' : '加入愿望单'}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlistLocal(result.appId) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleViewDetail(result)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors flex items-center justify-center"
                              title="查看详情"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 加载更多区域 */}
            <div ref={loadMoreRef} className="mt-8 flex flex-col items-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>加载更多游戏...</span>
                </div>
              )}
              {hasMoreResults && !isLoadingMore && (
                <div className="text-gray-500 text-sm">
                  向下滑动加载更多
                </div>
              )}
              {!hasMoreResults && displayedResults.length > 0 && (
                <div className="text-gray-500 text-sm">
                  已显示全部 {displayedResults.length} 款游戏
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="mt-8 glass-card rounded-xl p-4 border border-cyan-500/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="text-cyan-400 font-semibold mb-1">使用说明</p>
              <ul className="space-y-1 text-gray-400">
                <li>• 点击搜索按钮开始搜索，支持中英文和 Steam App ID</li>
                <li>• 点击"购买"按钮可将游戏添加到您的游戏库（模拟购买）</li>
                <li>• 点击"查看详情"可以查看游戏的详细信息并进行评分</li>
                <li>• 评分越多，AI 推荐越精准</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
