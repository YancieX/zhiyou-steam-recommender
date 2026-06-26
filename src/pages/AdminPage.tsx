import { useState, useEffect } from 'react';
import { Settings, RefreshCw, AlertCircle, TrendingUp, Wifi, Trash2 } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { useToastStore } from '../stores/toastStore';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUserStore();
  const store = useGameStore();
  const games = Array.isArray(store.games) ? store.games : [];
  const { isSyncingPrices, lastPriceSync, syncPricesWithSteam } = store;
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number; total: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const addToast = useToastStore(state => state.addToast);
  
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);
  
  if (!isAdmin) {
    return null;
  }
  
  const handleSyncPrices = async () => {
    setSyncResult(null);
    try {
      const result = await syncPricesWithSteam();
      setSyncResult(result);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (e) {
      setSyncResult({ success: 0, failed: 0, total: 0 });
      setTimeout(() => setSyncResult(null), 5000);
    }
  };
  
  const handleClearStatistics = () => {
    try {
      // 清空游戏缓存
      storage.setGameCache({});
      // 清空游戏库
      storage.setGames([]);
      // 清空购买记录
      storage.setPurchasedGames([]);
      // 清空评分
      storage.setRatings([]);
      // 清空愿望单
      storage.setWishlist([]);
      storage.setWishlistGames({});
      // 清空最后同步时间
      storage.setLastPriceSync('');
      // 刷新页面数据
      window.location.reload();
      addToast('统计数据已清空', 'success');
    } catch (error) {
      addToast('清空失败，请重试', 'error');
    }
    setShowClearConfirm(false);
  };
  
  const formatSyncTime = (isoString: string | null) => {
    if (!isoString) return '从未同步';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-purple-400" />
          <h1 className="font-orbitron text-3xl font-bold text-white">管理后台</h1>
        </div>
        
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-cyan-400" />
                <h2 className="font-orbitron text-xl font-bold text-white">Steam实时价格同步</h2>
              </div>
              <p className="text-gray-400 text-sm">
                从Steam Store API同步游戏的实时价格和促销信息
              </p>
              <p className="text-gray-500 text-xs mt-1">
                上次同步: {formatSyncTime(lastPriceSync)}
              </p>
            </div>
            
            <button
              onClick={handleSyncPrices}
              disabled={isSyncingPrices}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingPrices ? 'animate-spin' : ''}`} />
              {isSyncingPrices ? '同步中...' : '同步Steam价格'}
            </button>
          </div>
          
          {syncResult && syncResult.total > 0 && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border ${
              syncResult.success > 0 && syncResult.failed === 0 
                ? 'bg-green-500/20 border-green-500/30' 
                : syncResult.success > 0 
                  ? 'bg-yellow-500/20 border-yellow-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
            }`}>
              {syncResult.failed === 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : syncResult.success > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <span className={`font-semibold ${
                  syncResult.failed === 0 ? 'text-green-400' : syncResult.success > 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  价格同步完成
                </span>
                <p className="text-sm text-gray-400 mt-0.5">
                  共 {syncResult.total} 款游戏，成功 {syncResult.success} 款，失败 {syncResult.failed} 款
                  {syncResult.failed > 0 && '（失败的游戏将使用缓存或备用数据）'}
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cyan-400 font-semibold">关于价格数据</p>
              <p className="text-gray-400 text-sm mt-1">
                本系统通过 Steam Store API 和 SteamSpy API 获取实时价格数据。
                点击"同步Steam价格"按钮可获取最新的促销信息。
                由于网络原因，部分游戏数据可能获取失败，系统将自动使用缓存或备用数据。
                价格数据每日 GMT 0时自动更新一次。
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {games.map(game => (
              <div
                key={game.id}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  game.isOnSale ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/5'
                }`}
              >
                <img
                  src={game.coverImage}
                  alt={game.name}
                  className="w-16 h-10 object-cover rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{game.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <span>原价: ¥{game.originalPrice.toFixed(2)}</span>
                    {game.isOnSale && (
                      <span className="text-green-400 font-semibold">
                        -{game.discount}%
                      </span>
                    )}
                    <span className="text-purple-400 text-xs">App ID: {game.id.replace('game-', '').padStart(7, '0')}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  {game.isOnSale ? (
                    <>
                      <p className="text-2xl font-bold text-green-400">¥{game.salePrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">促销中</p>
                    </>
                  ) : game.originalPrice > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-white">¥{game.originalPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">原价</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-cyan-400">免费</p>
                      <p className="text-xs text-gray-500">F2P</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-orbitron text-xl font-bold text-white">统计数据</h2>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空统计数据
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-500/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{games.length}</p>
              <p className="text-gray-400 text-sm">游戏总数</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {games.filter(g => g.isOnSale).length}
              </p>
              <p className="text-gray-400 text-sm">促销中</p>
            </div>
            <div className="bg-cyan-500/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {games.filter(g => g.originalPrice === 0).length}
              </p>
              <p className="text-gray-400 text-sm">免费游戏</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {Math.round(games.reduce((sum, g) => sum + g.discount, 0) / games.length)}%
              </p>
              <p className="text-gray-400 text-sm">平均折扣</p>
            </div>
          </div>
        </div>
        
        {/* 清空确认对话框 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">确认清空统计数据</h3>
                  <p className="text-gray-400 text-sm">此操作不可恢复</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                确定要清空所有统计数据吗？这将删除：
              </p>
              <ul className="text-sm text-gray-400 mb-6 space-y-1">
                <li>• 游戏库中的所有游戏</li>
                <li>• 所有用户的购买记录</li>
                <li>• 所有用户的评分记录</li>
                <li>• 所有用户的愿望单</li>
                <li>• 游戏缓存和价格同步记录</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearStatistics}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
