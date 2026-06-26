import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Gamepad2,
  Star,
  Clock,
  Edit2,
  Save,
  X,
  AlertCircle,
  Trash2,
  Search,
  Upload,
  Download,
  ChevronRight,
  Settings,
  GamepadIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';
import { useWishlistStore } from '../stores/wishlistStore';
import RatingModal from '../components/RatingModal';
import { searchSteamGames, convertToGame, type SteamSearchResult, importSteamAccount, steamOwnedGameToResult, type SteamOwnedGame, getSteamGameDetails } from '../utils/steamSearch';

type TabType = 'profile' | 'library' | 'ratings' | 'steam';
type SteamSubTabType = 'search' | 'account';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isAuthenticated, updateProfile, updateSteamInfo } = useUserStore();
  const gameStore = useGameStore();
  const allGames = Array.isArray(gameStore.games) ? gameStore.games : [];
  const {
    getUserPurchasedGames,
    getUserRatings,
    removeGameFromLibrary,
    addGameToLibrary,
    rateGame,
    purchaseGame,
  } = gameStore;
  const { wishlist, removeFromWishlist } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [steamSubTab, setSteamSubTab] = useState<SteamSubTabType>('search');
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editingRating, setEditingRating] = useState<{ gameId: string; gameName: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ gameId: string; gameName: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [steamSearchQuery, setSteamSearchQuery] = useState('');
  const [steamSearchResults, setSteamSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSteamSearching, setIsSteamSearching] = useState(false);
  const [importingGames, setImportingGames] = useState<Set<string>>(new Set());
  const [steamIdInput, setSteamIdInput] = useState('');
  const [isAccountImporting, setIsAccountImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'ratings') setActiveTab('ratings');
    else if (tab === 'library') setActiveTab('library');
    else if (tab === 'steam') setActiveTab('steam');
    else setActiveTab('profile');
  }, [searchParams]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl">
          <GamepadIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="font-orbitron text-2xl font-bold text-white mb-4">请先登录</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">
            登录
          </button>
        </div>
      </div>
    );
  }

  const purchasedGames = getUserPurchasedGames(currentUser.id);
  const ratings = getUserRatings(currentUser.id);
  const userWishlist = wishlist.filter(w => w.userId === currentUser.id);

  const getRatingForGame = (gameId: string) => ratings.find(r => r.gameId === gameId);

  const ratedGames = ratings
    .map(r => {
      const game = allGames.find(g => g.id === r.gameId);
      return game ? { game, rating: r } : null;
    })
    .filter(Boolean) as { game: typeof allGames[0]; rating: typeof ratings[0] }[];

  const showSuccessMessage = (msg: string) => {
    setShowSuccess(msg);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleSaveProfile = () => {
    const success = updateProfile({
      username: editUsername.trim() || currentUser.username,
      bio: editBio,
    });
    if (success) {
      setIsEditing(false);
      showSuccessMessage('个人信息已更新');
    }
  };

  const handleStartEdit = () => {
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUsername('');
    setEditBio('');
  };

  const handleSubmitRating = (score: number, playtimeHours: number) => {
    if (!editingRating) return;
    rateGame(currentUser.id, editingRating.gameId, score, playtimeHours);
    setEditingRating(null);
    showSuccessMessage('评分已保存');
  };

  const handleDeleteGame = () => {
    if (!showDeleteConfirm) return;
    removeGameFromLibrary(showDeleteConfirm.gameId);
    setShowDeleteConfirm(null);
    showSuccessMessage(`已删除游戏：${showDeleteConfirm.gameName}`);
  };

  const handleSteamSearch = async () => {
    if (!steamSearchQuery.trim()) return;
    setIsSteamSearching(true);
    try {
      const results = await searchSteamGames(steamSearchQuery, 15);
      setSteamSearchResults(results);
    } finally {
      setIsSteamSearching(false);
    }
  };

  const handleImportGame = async (result: SteamSearchResult) => {
    if (!currentUser) return;

    setImportingGames(prev => new Set([...prev, result.appId]));

    const game = convertToGame(result);
    const added = addGameToLibrary(game);

    if (added) {
      purchaseGame(currentUser.id, game.id, game);
      showSuccessMessage(`已模拟购买游戏：${result.name}`);
    } else {
      const alreadyPurchased = purchasedGames.some(g => g.id === game.id);
      if (!alreadyPurchased) {
        purchaseGame(currentUser.id, game.id, game);
      }
      showSuccessMessage(`游戏已在库中：${result.name}`);
    }

    setTimeout(() => {
      setImportingGames(prev => {
        const next = new Set(prev);
        next.delete(result.appId);
        return next;
      });
    }, 500);
  };

  const isGameInLibrary = (steamAppId: string) => {
    return allGames.some(g => g.id === `game-steam-${steamAppId}`);
  };

  const handleAccountImport = async () => {
    if (!steamIdInput.trim()) return;
    setIsAccountImporting(true);
    setImportProgress(0);

    try {
      setImportProgress(10);
      const importResult = await importSteamAccount(steamIdInput.trim());
      
      setImportProgress(30);
      
      if (!importResult.player && importResult.games.length === 0) {
        showSuccessMessage('导入失败：无法获取Steam账号数据，请检查Steam ID或API配置');
        setIsAccountImporting(false);
        setImportProgress(0);
        return;
      }

      if (importResult.player) {
        updateSteamInfo({
          steamId: importResult.player.steamid,
          steamNickname: importResult.player.personaname,
          steamAvatar: importResult.player.avatarfull,
        });
      } else {
        updateSteamInfo({
          steamId: steamIdInput.trim(),
          steamNickname: `Steam用户_${steamIdInput.slice(-4)}`,
        });
      }

      setImportProgress(50);

      const ownedGames = importResult.games;
      const totalGames = ownedGames.length;
      let importedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < ownedGames.length; i += batchSize) {
        const batch = ownedGames.slice(i, i + batchSize);
        
        for (const ownedGame of batch) {
          try {
            const basicResult = steamOwnedGameToResult(ownedGame);
            
            let gameData = basicResult;
            try {
              const details = await getSteamGameDetails(String(ownedGame.appid));
              if (details) {
                gameData = { ...basicResult, ...details };
              }
            } catch {
            }

            const game = convertToGame(gameData, 'steam_import');
            game.playtimeMinutes = ownedGame.playtime_forever;
            game.lastPlayedAt = ownedGame.rtime_last_played;

            const added = addGameToLibrary(game);
            if (added || !purchasedGames.some(g => g.id === game.id)) {
              purchaseGame(currentUser.id, game.id, game, 'steam_import');
              importedCount++;
            }
          } catch (e) {
            console.warn(`导入游戏 ${ownedGame.appid} 失败:`, e);
          }
        }

        const progress = 50 + Math.round(((i + batch.length) / totalGames) * 45);
        setImportProgress(Math.min(progress, 95));

        if (i + batchSize < ownedGames.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      setImportProgress(100);

      setTimeout(() => {
        setIsAccountImporting(false);
        setImportProgress(0);
        setSteamIdInput('');
        showSuccessMessage(`Steam账号导入成功，已导入 ${importedCount} 款游戏到您的库中`);
      }, 500);

    } catch (error: any) {
      console.error('Steam账号导入失败:', error);
      setIsAccountImporting(false);
      setImportProgress(0);
      showSuccessMessage('导入失败：' + (error.message || '未知错误'));
    }
  };

  const handleUnbindSteam = async () => {
    if (!currentUser) return;
    
    setIsUnbinding(true);
    try {
      const removedCount = gameStore.removeSteamImportedGames(currentUser.id);
      const { clearSteamInfo } = useUserStore.getState();
      clearSteamInfo();
      
      setTimeout(() => {
        setIsUnbinding(false);
        setShowUnbindConfirm(false);
        showSuccessMessage(`Steam账号已解绑，已移除 ${removedCount} 款已购买的游戏`);
      }, 500);
    } catch (error) {
      console.error('解绑Steam失败:', error);
      setIsUnbinding(false);
      showSuccessMessage('解绑失败，请重试');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tabs: { key: TabType; label: string; icon: typeof User }[] = [
    { key: 'profile', label: '个人信息', icon: User },
    { key: 'library', label: '游戏库', icon: Gamepad2 },
    { key: 'ratings', label: '我的评分', icon: Star },
    { key: 'steam', label: 'Steam游戏', icon: GamepadIcon },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl font-bold text-white mb-2">个人中心</h1>
          <p className="text-gray-400">管理您的账户、游戏和评分</p>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 animate-fade-in-up">
            <Save className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">{showSuccess}</span>
          </div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="font-orbitron text-4xl font-bold text-white">
                      {currentUser.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">用户名</label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={e => setEditUsername(e.target.value)}
                            className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            placeholder="输入用户名"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">个人简介</label>
                          <textarea
                            value={editBio}
                            onChange={e => setEditBio(e.target.value)}
                            rows={3}
                            className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                            placeholder="介绍一下自己..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            保存
                          </button>
                          <button onClick={handleCancelEdit} className="btn-secondary flex items-center gap-2">
                            <X className="w-4 h-4" />
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h2 className="font-orbitron text-2xl font-bold text-white">{currentUser.username}</h2>
                          <button
                            onClick={handleStartEdit}
                            className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                            title="编辑资料"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-gray-400 mt-1">{currentUser.email}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          注册时间：{formatDate(currentUser.createdAt)}
                        </p>
                        {currentUser.bio && (
                          <p className="text-gray-300 mt-3 leading-relaxed">{currentUser.bio}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GamepadIcon className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">Steam 绑定状态</h3>
                  </div>

                  {currentUser.steamId ? (
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {currentUser.steamAvatar ? (
                            <img
                              src={currentUser.steamAvatar}
                              alt="Steam头像"
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                              <GamepadIcon className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold">
                              {currentUser.steamNickname || 'Steam用户'}
                            </p>
                            <p className="text-gray-400 text-sm">Steam ID: {currentUser.steamId}</p>
                            {currentUser.steamImportedAt && (
                              <p className="text-gray-500 text-xs mt-1">
                                绑定时间：{formatDate(currentUser.steamImportedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                            已绑定
                          </span>
                          <button
                            onClick={() => setShowUnbindConfirm(true)}
                            className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            解绑
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors border border-dashed border-white/10"
                      onClick={() => setActiveTab('steam')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <GamepadIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">尚未绑定Steam账号</p>
                            <p className="text-gray-400 text-sm">绑定后可模拟购买您的Steam游戏库中的游戏</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{purchasedGames.length}</p>
                    <p className="text-gray-400 text-sm mt-1">已购游戏</p>
                  </div>
                  <div className="bg-cyan-500/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{ratings.length}</p>
                    <p className="text-gray-400 text-sm mt-1">已评分</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">
                      {ratings.reduce((sum, r) => sum + r.playtimeHours, 0)}h
                    </p>
                    <p className="text-gray-400 text-sm mt-1">总游玩时长</p>
                  </div>
                  <div className="bg-cyan-500/10 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-6 h-6 text-yellow-500 fill-current" />
                      <p className="text-3xl font-bold text-white">
                        {ratings.length > 0
                          ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
                          : '0'}
                      </p>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">平均评分</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">我的游戏库</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveTab('steam')} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
                      <Download className="w-4 h-4" />
                      模拟购买
                    </button>
                    <button onClick={() => navigate('/search')} className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5">
                      <Search className="w-4 h-4" />
                      搜索游戏
                    </button>
                  </div>
                </div>

                {purchasedGames.length === 0 ? (
                  <div className="text-center py-16">
                    <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="font-orbitron text-xl font-bold text-white mb-2">游戏库是空的</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      从Steam模拟购买游戏并添加到您的游戏库，或者浏览搜索页面发现更多精彩游戏
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setActiveTab('steam')} className="btn-primary flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        购买Steam游戏
                      </button>
                      <button onClick={() => navigate('/search')} className="btn-secondary">
                        去搜索
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchasedGames.map((game, index) => (
                      <div
                        key={game.id}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <img
                          src={game.coverImage}
                          alt={game.name}
                          className="w-24 h-14 object-cover rounded-lg cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/game/${game.id}`)}
                        />

                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-white truncate cursor-pointer hover:text-purple-400 transition-colors"
                            onClick={() => navigate(`/game/${game.id}`)}
                          >
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span>{game.genre}</span>
                            <span>·</span>
                            <span>{game.releaseYear}</span>
                            {game.isOnSale && (
                              <>
                                <span>·</span>
                                <span className="text-red-400">-{game.discount}%</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {game.isOnSale ? (
                            <div>
                              <p className="text-red-400 font-bold">¥{game.salePrice.toFixed(2)}</p>
                              <p className="text-gray-500 text-xs line-through">
                                ¥{game.originalPrice.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-white font-bold">¥{game.originalPrice.toFixed(2)}</p>
                          )}
                        </div>

                        <button
                          onClick={() => setShowDeleteConfirm({ gameId: game.id, gameName: game.name })}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                          title="从游戏库删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">我的评分</h2>
                  <span className="text-sm text-gray-400">共 {ratedGames.length} 款游戏</span>
                </div>

                {ratedGames.length === 0 ? (
                  <div className="text-center py-16">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="font-orbitron text-xl font-bold text-white mb-2">还没有评分</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      给您玩过的游戏评分，帮助我们为您推荐更合口味的游戏
                    </p>
                    <button onClick={() => setActiveTab('library')} className="btn-primary">
                      去游戏库评分
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ratedGames.map(({ game, rating }, index) => (
                      <div
                        key={game.id}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <img
                          src={game.coverImage}
                          alt={game.name}
                          className="w-24 h-14 object-cover rounded-lg cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/game/${game.id}`)}
                        />

                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-white truncate cursor-pointer hover:text-purple-400 transition-colors"
                            onClick={() => navigate(`/game/${game.id}`)}
                          >
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating.score
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{rating.playtimeHours}h</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setEditingRating({ gameId: game.id, gameName: game.name })
                          }
                          className="p-2 text-gray-400 hover:text-cyan-400 transition-colors flex-shrink-0"
                          title="编辑评分"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'steam' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <GamepadIcon className="w-6 h-6 text-cyan-400" />
                  <h2 className="font-semibold text-white">Steam 游戏购买</h2>
                </div>

                <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setSteamSubTab('search')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      steamSubTab === 'search'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    搜索购买
                  </button>
                  <button
                    onClick={() => setSteamSubTab('account')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      steamSubTab === 'account'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    账号导入
                  </button>
                </div>

                {steamSubTab === 'search' && (
                  <div>
                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={steamSearchQuery}
                        onChange={e => setSteamSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSteamSearch()}
                        placeholder="搜索Steam游戏名称..."
                        className="w-full bg-white/5 border border-purple-500/30 rounded-xl pl-12 pr-28 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleSteamSearch}
                        disabled={isSteamSearching || !steamSearchQuery.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
                      >
                        {isSteamSearching ? '搜索中...' : '搜索'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {steamSearchResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>输入关键词搜索Steam游戏</p>
                          <p className="text-sm mt-1">搜索后可模拟购买游戏到您的游戏库</p>
                        </div>
                      ) : (
                        steamSearchResults.map(result => {
                          const inLibrary = isGameInLibrary(result.appId);
                          const isImporting = importingGames.has(result.appId);

                          return (
                            <div
                              key={result.appId}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <img
                                src={result.coverImage}
                                alt={result.name}
                                className="w-20 h-12 object-cover rounded flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold truncate">
                                  {result.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <span>{result.genre || '游戏'}</span>
                                  {result.isOnSale ? (
                                    <span className="text-red-400">
                                      -{result.discount}% ¥{result.price.toFixed(2)}
                                    </span>
                                  ) : result.originalPrice > 0 ? (
                                    <span>¥{result.originalPrice.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-green-400">免费</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleImportGame(result)}
                                disabled={inLibrary || isImporting}
                                className={`text-sm py-1.5 px-4 rounded-lg font-semibold transition-colors flex-shrink-0 ${
                                  inLibrary
                                    ? 'bg-green-500/20 text-green-400 cursor-default'
                                    : isImporting
                                    ? 'bg-purple-500/50 text-white'
                                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                                }`}
                              >
                                {inLibrary ? '已购买' : isSteamSearching ? '购买中...' : '模拟购买'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {steamSubTab === 'account' && (
                  <div>
                    {/* API Key配置提示 - 简化版 */}
                    {!import.meta.env.VITE_STEAM_API_KEY && (
                      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-5 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-orange-400 font-bold text-lg mb-2">首次使用需要简单配置</h4>
                            <p className="text-gray-300 text-sm mb-4">
                              Steam官方要求使用免费API Key来读取您的游戏数据，我们已为您准备了最简步骤。
                            </p>

                            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg p-4 space-y-4">
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                                <div>
                                  <p className="text-cyan-400 font-semibold mb-1">登录Steam并打开API申请页面</p>
                                  <p className="text-gray-400 text-sm mb-2">请确保已登录您的Steam账号，然后点击下方链接：</p>
                                  <a
                                    href="https://steamcommunity.com/dev/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 hover:underline text-sm px-3 py-1.5 bg-purple-500/20 rounded-lg transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    打开Steam API申请页面
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                                <div>
                                  <p className="text-cyan-400 font-semibold mb-1">获取API Key</p>
                                  <p className="text-gray-400 text-sm">在"Domain"中随便输入几个字母（如 my-app 或 zhiyou），然后点击 Register</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                                <div>
                                  <p className="text-cyan-400 font-semibold mb-1">复制Key到项目</p>
                                  <p className="text-gray-400 text-sm">复制获得的Key，创建项目根目录下的 <code className="bg-black/30 px-1 rounded text-purple-300">.env</code> 文件，内容为：</p>
                                  <code className="block bg-black/30 rounded p-2 text-green-400 text-xs mt-1 font-mono">
                                    VITE_STEAM_API_KEY=粘贴你的Key在这里
                                  </code>
                                  <p className="text-gray-500 text-xs mt-1">保存后重启开发服务器（Ctrl+C停止，再运行 npm run dev）</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">!</span>
                                <div>
                                  <p className="text-yellow-400 font-semibold mb-1">如果无法打开链接</p>
                                  <p className="text-gray-400 text-sm">请手动登录 <a href="https://steamcommunity.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">steamcommunity.com</a>，然后访问 /dev/apikey 页面</p>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-400 text-xs mt-3">
                              💡 API Key免费且安全，只用于读取您自己Steam账号的公开游戏信息
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-6 mb-4 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">一键导入Steam游戏库</h3>
                          <p className="text-gray-400 text-sm">自动获取您的游戏列表和游玩时长</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-300 text-sm mb-2 font-medium">
                            您的Steam链接或ID
                          </label>
                          <input
                            type="text"
                            value={steamIdInput}
                            onChange={e => setSteamIdInput(e.target.value)}
                            placeholder="例如：https://steamcommunity.com/id/你的名字 或 76561198000000000"
                            disabled={isAccountImporting}
                            className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                          />
                          <p className="text-gray-500 text-xs mt-2">
                            💡 在Steam个人资料页面点击"复制个人主页链接"即可
                          </p>
                        </div>

                        {isAccountImporting && (
                          <div className="bg-black/20 rounded-xl p-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                正在导入游戏库...
                              </span>
                              <span className="text-cyan-400 font-bold">{Math.round(importProgress)}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                              />
                            </div>
                            <p className="text-gray-500 text-xs mt-2">
                              请耐心等待，导入完成会显示结果
                            </p>
                          </div>
                        )}

                        <button
                          onClick={handleAccountImport}
                          disabled={isAccountImporting || !steamIdInput.trim()}
                          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                        >
                          {isAccountImporting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              导入中...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              开始导入Steam账号
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Gamepad2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-medium text-sm">导入说明</p>
                          <ul className="text-gray-400 text-sm mt-2 space-y-1.5">
                            <li>• 支持Steam个人资料链接或17位数字ID</li>
                            <li>• 自动导入您的游戏库和游玩时长</li>
                            <li>• 导入后可用于AI个性化推荐</li>
                            <li>• 可随时解绑并清除导入数据</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingRating && (
        <RatingModal
          gameName={editingRating.gameName}
          gameId={editingRating.gameId}
          existingRating={ratings.find(r => r.gameId === editingRating.gameId)}
          onSubmit={handleSubmitRating}
          onClose={() => setEditingRating(null)}
        />
      )}

      {showUnbindConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-fade-in-up border border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <GamepadIcon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-orbitron text-xl font-bold text-white">解绑Steam账号</h3>
            </div>

            <p className="text-gray-300 mb-2">
              确定要解绑当前Steam账号吗？
            </p>
            <p className="text-orange-400 text-sm mb-6">
              解绑后将删除所有通过Steam模拟购买的游戏数据和相关评分，此操作不可撤销。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnbindConfirm(false)}
                disabled={isUnbinding}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleUnbindSteam}
                disabled={isUnbinding}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUnbinding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    解绑中...
                  </>
                ) : (
                  '确认解绑'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-fade-in-up border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-orbitron text-xl font-bold text-white">删除游戏</h3>
            </div>

            <p className="text-gray-300 mb-2">
              确定要从游戏库中删除「{showDeleteConfirm.gameName}」吗？
            </p>
            <p className="text-orange-400 text-sm mb-6">
              此操作将同时删除该游戏的评分记录，且不可撤销。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button onClick={handleDeleteGame} className="flex-1 btn-danger">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
