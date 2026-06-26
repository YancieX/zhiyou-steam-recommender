import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Heart,
  ShoppingCart,
  ArrowLeft,
  Gamepad2,
  Monitor,
  Apple,
  Terminal,
  ChevronRight,
  ThumbsUp,
  Users,
  Calendar,
  Building2,
  ImageOff,
  Loader2,
} from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useToastStore } from '../stores/toastStore';
import { useState, useEffect } from 'react';
import RatingModal from '../components/RatingModal';
import { getSteamGameDetails, convertToGame, proxyImage, proxyImageFallback } from '../utils/steamSearch';
import type { Game } from '../data/mockData';

function getSteamRatingLabel(rating?: number): string {
  if (rating === undefined || rating === null) return '暂无评价';
  if (rating >= 90) return '好评如潮';
  if (rating >= 80) return '特别好评';
  if (rating >= 70) return '多半好评';
  if (rating >= 60) return '褒贬不一';
  if (rating >= 40) return '多半差评';
  return '差评如潮';
}

function getSteamRatingColor(rating?: number): string {
  if (rating === undefined || rating === null) return 'text-gray-400';
  if (rating >= 80) return 'text-green-400';
  if (rating >= 70) return 'text-green-300';
  if (rating >= 60) return 'text-yellow-400';
  if (rating >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function formatReviewCount(count?: number): string {
  if (!count) return '';
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count.toLocaleString();
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { games, purchaseGame, hasPurchased, rateGame, getUserRatings, addGameToLibrary, addBrowsedGame, getBrowsedGames } = useGameStore();
  const { currentUser, isAuthenticated } = useUserStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const addToast = useToastStore(state => state.addToast);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerImgError, setBannerImgError] = useState(0);
  const [coverImgError, setCoverImgError] = useState(0);
  const [screenshotErrors, setScreenshotErrors] = useState<Record<number, number>>({});

  let game = games.find((g) => g.id === id);
  const steamAppId = id?.replace('game-steam-', '');

  useEffect(() => {
    const loadGameDetails = async () => {
      if (game || !steamAppId || !id) return;
      
      setIsLoading(true);
      try {
        const details = await getSteamGameDetails(steamAppId);
        if (details) {
          const loadedGame = convertToGame(details);
          addBrowsedGame(loadedGame);
        }
      } catch (error) {
        console.error('加载游戏详情失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!game && steamAppId) {
      loadGameDetails();
    }
  }, [id, steamAppId, game, addBrowsedGame]);

  const browsedGames = getBrowsedGames();
  game = games.find((g) => g.id === id) || browsedGames.find((g) => g.id === id) || game;

  const handleBannerImgError = () => {
    setBannerImgError(prev => prev + 1);
  };

  const handleBannerImgClick = () => {
    if (bannerImgError > 0) {
      setBannerImgError(prev => prev - 1);
    }
  };

  const handleCoverImgError = () => {
    setCoverImgError(prev => prev + 1);
  };

  const handleCoverImgClick = () => {
    if (coverImgError > 0) {
      setCoverImgError(prev => prev - 1);
    }
  };

  const handleScreenshotError = (index: number) => {
    setScreenshotErrors(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + 1,
    }));
  };

  const getBannerImageSrc = (url: string) => {
    if (!url) return '';
    if (bannerImgError === 0) return proxyImage(url);
    if (bannerImgError === 1) return proxyImageFallback(url);
    return '';
  };

  const getCoverImageSrc = (url: string) => {
    if (!url) return '';
    if (coverImgError === 0) return proxyImage(url);
    if (coverImgError === 1) return proxyImageFallback(url);
    return '';
  };

  const getScreenshotSrc = (url: string, index: number) => {
    if (!url) return '';
    const errorCount = screenshotErrors[index] || 0;
    if (errorCount === 0) return proxyImage(url);
    if (errorCount === 1) return proxyImageFallback(url);
    return '';
  };

  if (!game) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
              <h2 className="font-orbitron text-2xl font-bold text-white mb-4">正在加载游戏详情...</h2>
              <p className="text-gray-400">从Steam获取游戏数据中</p>
            </>
          ) : (
            <>
              <h2 className="font-orbitron text-2xl font-bold text-white mb-4">游戏未找到</h2>
              <button onClick={() => navigate('/')} className="btn-primary">
                返回首页
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isPurchased = currentUser ? hasPurchased(currentUser.id, game.id) : false;
  const inWishlist = currentUser ? isInWishlist(currentUser.id, game.id) : false;
  const userRatings = currentUser ? getUserRatings(currentUser.id) : [];
  const userRating = userRatings.find((r) => r.gameId === game.id);

  const handlePurchase = () => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    const gameToPurchase = games.find((g) => g.id === game.id) || game;
    purchaseGame(currentUser.id, game.id, gameToPurchase);
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    if (inWishlist) {
      removeFromWishlist(currentUser.id, game.id);
      addToast('已从愿望单移除', 'success');
    } else {
      addToWishlist(currentUser.id, game.id, game);
      addToast('已添加至愿望单', 'success');
    }
  };

  const handleSubmitRating = (score: number, playtimeHours: number) => {
    if (!currentUser) return;
    rateGame(currentUser.id, game.id, score, playtimeHours);
    setShowRatingModal(false);
  };

  const bannerImage = game.backgroundImage || game.coverImage;
  const screenshots = game.screenshots && game.screenshots.length > 0 ? game.screenshots : null;
  const description = game.detailedDescription || game.aboutTheGame || game.description;
  const allTags = game.genres || game.categories || game.tags;
  const displayDate = game.releaseDate || (game.releaseYear ? String(game.releaseYear) : '未知');

  return (
    <div className="min-h-screen">
      <div className="relative w-full h-[500px] overflow-hidden bg-slate-800/50">
        {bannerImage && bannerImgError < 2 ? (
          <img
            src={getBannerImageSrc(bannerImage)}
            alt={game.name}
            className={`w-full h-full object-cover ${bannerImgError > 0 ? 'cursor-pointer opacity-80 hover:opacity-100' : ''}`}
            onError={handleBannerImgError}
            onClick={handleBannerImgClick}
            title={bannerImgError > 0 ? '点击重新加载图片' : ''}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 cursor-pointer hover:text-gray-400" onClick={handleBannerImgClick}>
            <ImageOff className="w-16 h-16" />
            <span className="ml-2 text-sm">点击重试</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f23]/60 to-[#0f0f23]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f23]/90 via-transparent to-transparent" />

        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>

            <div className="max-w-3xl">
              <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                {game.name}
              </h1>
              {game.genre && (
                <p className="text-lg text-purple-300 mb-6">{game.genre}</p>
              )}

              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {(game.developers || game.publishers) && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">
                      {game.developers?.join(', ') || game.publishers?.join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300">{displayDate}</span>
                </div>
                {game.platforms && (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <div className="flex gap-2">
                      {game.platforms.windows && (
                        <Monitor className="w-4 h-4 text-gray-300" />
                      )}
                      {game.platforms.mac && (
                        <Apple className="w-4 h-4 text-gray-300" />
                      )}
                      {game.platforms.linux && (
                        <Terminal className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mt-32 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {screenshots && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="relative aspect-video bg-black">
                    {(screenshotErrors[activeScreenshot] || 0) < 2 ? (
                      <img
                        src={getScreenshotSrc(screenshots[activeScreenshot], activeScreenshot)}
                        alt={`截图 ${activeScreenshot + 1}`}
                        className="w-full h-full object-contain"
                        onError={() => handleScreenshotError(activeScreenshot)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageOff className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  {screenshots.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {screenshots.map((screenshot, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveScreenshot(index)}
                          className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all bg-slate-800/50 ${
                            index === activeScreenshot
                              ? 'border-purple-500'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          {(screenshotErrors[index] || 0) < 2 ? (
                            <img
                              src={getScreenshotSrc(screenshot, index)}
                              alt={`缩略图 ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => handleScreenshotError(index)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <ImageOff className="w-6 h-6" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-80 flex-shrink-0">
                    {(coverImgError < 2 && game.coverImage) ? (
                      <img
                        src={getCoverImageSrc(game.coverImage)}
                        alt={game.name}
                        className={`w-full h-48 md:h-full object-cover cursor-pointer ${coverImgError > 0 ? 'opacity-80 hover:opacity-100' : ''}`}
                        onClick={() => coverImgError > 0 ? handleCoverImgClick() : navigate(`/game/${game.id}`)}
                        onError={handleCoverImgError}
                        title={coverImgError > 0 ? '点击重新加载图片' : ''}
                      />
                    ) : (
                      <div 
                        className="w-full h-48 md:h-full flex items-center justify-center bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
                        onClick={handleCoverImgClick}
                      >
                        <div className="text-center text-gray-500">
                          <ImageOff className="w-12 h-12 mx-auto mb-2" />
                          <span className="text-sm">点击重试</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {game.comingSoon ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-lg">即将推出</span>
                            {game.releaseDate && (
                              <span className="text-gray-400 text-sm">预计 {game.releaseDate}</span>
                            )}
                          </div>
                        ) : game.isOnSale ? (
                          <>
                            <span className="text-3xl font-bold text-white">
                              ¥{game.salePrice.toFixed(2)}
                            </span>
                            <span className="text-lg text-gray-500 line-through">
                              ¥{game.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded">
                              -{game.discount}%
                            </span>
                          </>
                        ) : game.originalPrice > 0 ? (
                          <span className="text-3xl font-bold text-white">
                            ¥{game.originalPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-3xl font-bold text-green-400">免费</span>
                        )}
                      </div>
                      {game.isOnSale && !game.comingSoon && (
                        <p className="text-sm text-green-400">限时促销中，立省 ¥{(game.originalPrice - game.salePrice).toFixed(2)}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {!isPurchased ? (
                        <button
                          onClick={handlePurchase}
                          disabled={game.comingSoon}
                          className="flex-1 btn-primary flex items-center justify-center gap-2 text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          {game.comingSoon ? '即将发售' : '模拟购买'}
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 font-semibold">
                          <ThumbsUp className="w-5 h-5" />
                          已拥有
                        </div>
                      )}

                      <button
                        onClick={handleAddToWishlist}
                        className={`flex-1 sm:flex-none sm:w-auto px-6 flex items-center justify-center gap-2 ${
                          inWishlist ? 'btn-danger' : 'btn-secondary'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                        {inWishlist ? '从愿望单移除' : '加入愿望单'}
                      </button>
                    </div>

                    {isPurchased && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="w-full btn-secondary flex items-center justify-center gap-2"
                      >
                        <Star className="w-5 h-5" />
                        {userRating ? '修改评分' : '评分'}
                      </button>
                    )}

                    <div className="pt-3 border-t border-purple-500/20 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">开发商</span>
                        <span className="text-cyan-400">
                          {game.developers?.[0] || '未知'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">发行商</span>
                        <span className="text-cyan-400">
                          {game.publishers?.[0] || '未知'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">发行日期</span>
                        <span className="text-gray-200">{displayDate}</span>
                      </div>
                      {game.rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">本站评分</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-white font-medium">{game.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {game.steamRating !== undefined && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ThumbsUp className="w-6 h-6 text-cyan-400" />
                    <h2 className="font-orbitron text-xl font-bold text-white">Steam 用户评价</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getSteamRatingColor(game.steamRating)}`}>
                        {game.steamRating}%
                      </div>
                      <div className={`text-sm mt-1 ${getSteamRatingColor(game.steamRating)}`}>
                        好评率
                      </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className={`text-xl font-semibold ${getSteamRatingColor(game.steamRating)} mb-2`}>
                        {game.steamReviewSummary || getSteamRatingLabel(game.steamRating)}
                      </div>
                      {game.steamReviewCount !== undefined && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{formatReviewCount(game.steamReviewCount)} 篇用户评价</span>
                        </div>
                      )}
                      <div className="mt-3 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                          style={{ width: `${game.steamRating}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-orbitron text-xl font-bold text-white mb-4">关于这款游戏</h2>
                <div 
                  className="text-gray-300 leading-relaxed steam-description"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>

              {allTags && allTags.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-orbitron text-xl font-bold text-white mb-4">游戏标签</h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.platforms && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-orbitron text-xl font-bold text-white mb-4">系统需求</h2>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <Monitor className={`w-8 h-8 ${game.platforms.windows ? 'text-green-400' : 'text-gray-600'}`} />
                      <div>
                        <p className="text-white font-medium">Windows</p>
                        <p className={`text-sm ${game.platforms.windows ? 'text-green-400' : 'text-gray-500'}`}>
                          {game.platforms.windows ? '支持' : '不支持'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <Apple className={`w-8 h-8 ${game.platforms.mac ? 'text-green-400' : 'text-gray-600'}`} />
                      <div>
                        <p className="text-white font-medium">macOS</p>
                        <p className={`text-sm ${game.platforms.mac ? 'text-green-400' : 'text-gray-500'}`}>
                          {game.platforms.mac ? '支持' : '不支持'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <Terminal className={`w-8 h-8 ${game.platforms.linux ? 'text-green-400' : 'text-gray-600'}`} />
                      <div>
                        <p className="text-white font-medium">Linux</p>
                        <p className={`text-sm ${game.platforms.linux ? 'text-green-400' : 'text-gray-500'}`}>
                          {game.platforms.linux ? '支持' : '不支持'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isPurchased && userRating && (
                <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-4">
                    <Gamepad2 className="w-6 h-6 text-purple-400" />
                    <h2 className="font-orbitron text-xl font-bold text-white">您的评分</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= userRating.score
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm">游戏评分</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-white mb-2">
                        {userRating.playtimeHours}h
                      </p>
                      <p className="text-gray-400 text-sm">游玩时长</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="mt-4 w-full btn-secondary"
                  >
                    修改评分
                  </button>
                </div>
              )}

              {isPurchased && !userRating && (
                <div className="glass-card rounded-2xl p-6 text-center">
                  <p className="text-gray-400 mb-4">您已购买此游戏，分享您的游玩体验吧</p>
                  <button onClick={() => setShowRatingModal(true)} className="btn-primary">
                    立即评分
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl overflow-hidden sticky top-24">
                <div className="relative aspect-[4/3] bg-slate-800/50">
                  {coverImgError < 2 && game.coverImage ? (
                    <img
                      src={getCoverImageSrc(game.coverImage)}
                      alt={game.name}
                      className={`w-full h-full object-cover cursor-pointer ${coverImgError > 0 ? 'opacity-80 hover:opacity-100' : ''}`}
                      onClick={() => coverImgError > 0 ? handleCoverImgClick() : navigate(`/game/${game.id}`)}
                      onError={handleCoverImgError}
                      title={coverImgError > 0 ? '点击重新加载图片' : ''}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-500 cursor-pointer hover:text-gray-400"
                      onClick={handleCoverImgClick}
                    >
                      <div className="text-center">
                        <ImageOff className="w-12 h-12 mx-auto mb-2" />
                        <span className="text-sm">点击重试</span>
                      </div>
                    </div>
                  )}
                  {game.isOnSale && !game.comingSoon && (
                    <div className="sale-badge text-lg px-4 py-1">
                      -{game.discount}%
                    </div>
                  )}
                  {game.comingSoon && (
                    <div className="sale-badge text-lg px-4 py-1 bg-yellow-500">
                      即将推出
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">开发商</span>
                    <span className="text-cyan-400">
                      {game.developers?.[0] || '未知'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">发行商</span>
                    <span className="text-cyan-400">
                      {game.publishers?.[0] || '未知'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">发行日期</span>
                    <span className="text-gray-200">{displayDate}</span>
                  </div>
                  {game.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">本站评分</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-white font-medium">{game.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRatingModal && (
        <RatingModal
          gameName={game.name}
          gameId={game.id}
          existingRating={userRating}
          onSubmit={handleSubmitRating}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
}
