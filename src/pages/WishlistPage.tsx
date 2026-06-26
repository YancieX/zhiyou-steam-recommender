import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, TrendingDown, AlertCircle } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useGameStore } from '../stores/gameStore';
import { useToastStore } from '../stores/toastStore';
import PriceAlert from '../components/PriceAlert';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useUserStore();
  const { wishlist, removeFromWishlist, checkPriceChanges, clearNotifications, getWishlistGame } = useWishlistStore();
  const { games, browsedGames } = useGameStore();
  const addToast = useToastStore(state => state.addToast);
  
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-2xl font-bold text-white mb-4">请先登录</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">
            登录
          </button>
        </div>
      </div>
    );
  }
  
  const userWishlist = wishlist.filter(w => w.userId === currentUser.id);
  const priceDropItems = userWishlist.filter(w => w.notified);
  
  checkPriceChanges();
  
  const handleClearNotifications = () => {
    clearNotifications(currentUser.id);
  };
  
  const getGame = (gameId: string) => {
    return getWishlistGame(gameId) || games.find(g => g.id === gameId) || browsedGames.find(g => g.id === gameId);
  };
  
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-purple-400" />
          <h1 className="font-orbitron text-3xl font-bold text-white">我的愿望单</h1>
          <span className="text-gray-400">({userWishlist.length}款游戏)</span>
        </div>
        
        {priceDropItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h2 className="font-orbitron text-xl font-bold text-white">降价提醒</h2>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {priceDropItems.length}
                </span>
              </div>
              <button
                onClick={handleClearNotifications}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                清除提醒
              </button>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-cyan-400 font-semibold text-sm">关于降价提醒</p>
                <p className="text-gray-400 text-xs mt-1">
                  目前降价提醒会在您下次访问本站时显示。未来计划支持浏览器通知推送。
                  真正的邮件推送需要后端服务器支持，可在部署时配置。
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {priceDropItems.map(item => {
                const game = getGame(item.gameId);
                if (!game) return null;
                return (
                  <PriceAlert
                    key={item.gameId}
                    gameName={game.name}
                    originalPrice={item.originalPrice}
                    currentPrice={item.currentPrice}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        {userWishlist.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="font-orbitron text-xl font-bold text-white mb-2">愿望单是空的</h2>
            <p className="text-gray-400 mb-6">快去添加一些游戏吧，我们会在降价时提醒您</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              浏览游戏
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userWishlist.map((item, index) => {
              const game = getGame(item.gameId);
              if (!game) return null;
              
              const hasDropped = game.salePrice < item.currentPrice;
              const savings = item.currentPrice - game.salePrice;
              
              return (
                <div
                  key={item.gameId}
                  className={`glass-card rounded-xl overflow-hidden animate-fade-in-up ${
                    hasDropped ? 'animate-price-drop border-2 border-red-500' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-video cursor-pointer" onClick={() => navigate(`/game/${game.id}`)}>
                    <img
                      src={game.coverImage}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                    {game.isOnSale && (
                      <div className="sale-badge">-{game.discount}%</div>
                    )}
                    {hasDropped && (
                      <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-center py-1 text-sm font-bold">
                        价格下降!
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3
                      className="font-orbitron text-lg font-semibold text-white mb-2 cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => navigate(`/game/${game.id}`)}
                    >
                      {game.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {game.isOnSale ? (
                          <>
                            <span className="text-xl font-bold text-white">¥{game.salePrice.toFixed(2)}</span>
                            <span className="text-sm text-gray-500 line-through">¥{item.originalPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-white">¥{item.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    
                    {hasDropped && (
                      <div className="mb-3 p-2 bg-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm font-semibold">
                          已省 ¥{savings.toFixed(2)}
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        removeFromWishlist(currentUser.id, item.gameId);
                        addToast('已从愿望单移除', 'success');
                      }}
                      className="w-full btn-danger flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      移除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
