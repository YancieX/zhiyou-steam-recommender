import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  LogOut,
  ArrowLeft,
  AlertTriangle,
  X,
  Settings as SettingsIcon,
  Gauge,
  Sun,
  Moon,
  Database,
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getApiStatus, refreshApiStatus } from '../utils/steamSearch';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isAdmin, logout, deleteAccount } = useUserStore();
  const { darkMode, notifications, priceAlert, updateSettings, toggleDarkMode } = useSettingsStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [apiStatus, setApiStatus] = useState(getApiStatus());

  useEffect(() => {
    setApiStatus(getApiStatus());
  }, []);

  const handleRefreshApi = () => {
    refreshApiStatus();
    setApiStatus(getApiStatus());
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = () => {
    if (deleteText === '确认删除') {
      deleteAccount(currentUser!.id);
      navigate('/');
    }
  };

  const settingsGroups = [
    {
      title: '通用设置',
      icon: Gauge,
      items: [
        {
          label: darkMode ? '深色模式' : '浅色模式',
          description: '切换应用主题外观',
          type: 'toggle',
          value: darkMode,
          icon: darkMode ? Moon : Sun,
          onChange: () => {
            toggleDarkMode();
          },
        },
        {
          label: '推送通知',
          description: '接收游戏促销和降价提醒通知',
          type: 'toggle',
          value: notifications,
          onChange: (val: boolean) => updateSettings({ notifications: val }),
        },
        {
          label: '降价提醒',
          description: '愿望单游戏降价时立即通知',
          type: 'toggle',
          value: priceAlert,
          onChange: (val: boolean) => updateSettings({ priceAlert: val }),
        },
      ],
    },
    {
      title: '账号设置',
      icon: User,
      items: [
        {
          label: '个人资料',
          description: '修改您的用户名、头像等个人信息',
          type: 'link',
          onClick: () => navigate('/profile'),
        },
        {
          label: '隐私设置',
          description: '管理您的游戏数据可见性',
          type: 'comingsoon',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="font-orbitron text-2xl font-bold text-white">设置</h1>
            <p className="text-gray-400 text-sm">管理您的应用偏好和账号设置</p>
          </div>
        </div>

        <div className="space-y-6">
          {settingsGroups.map(group => (
            <div key={group.title} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <group.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="font-semibold text-white text-lg">{group.title}</h2>
              </div>
              <div className="space-y-3">
                {group.items.map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors ${
                      item.type === 'link' ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => item.onClick?.()}
                  >
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>
                      {item.type === 'comingsoon' && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                          即将推出
                        </span>
                      )}
                    </div>
                    {item.type === 'toggle' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          item.onChange?.(!item.value);
                        }}
                        className={`w-12 h-7 rounded-full transition-colors relative ${
                          item.value ? 'bg-purple-500' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            item.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="glass-card rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">数据源状态</h3>
                  <p className="text-gray-400 text-sm">Steam API 连接状态</p>
                </div>
              </div>
              <button
                onClick={handleRefreshApi}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                刷新
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${apiStatus.storeAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-white text-sm font-medium">Steam Store API</p>
                  <p className="text-gray-500 text-xs">
                    {apiStatus.storeAvailable ? '正常可用' : '暂时不可用'}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${apiStatus.steamSpyAvailable ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <div>
                  <p className="text-white text-sm font-medium">SteamSpy API</p>
                  <p className="text-gray-500 text-xs">
                    {apiStatus.steamSpyAvailable ? '正常可用' : '降级模式'}
                  </p>
                </div>
              </div>
            </div>
            {!apiStatus.storeAvailable && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Steam Store API 暂时不可用，系统将自动使用备用数据源和本地缓存。
                  部分游戏数据可能不够完整，但核心功能不受影响。
                </p>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="glass-card rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">管理后台</h3>
                    <p className="text-gray-400 text-sm">进入管理员控制面板</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  进入管理
                </button>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">账号操作</h3>
                <p className="text-gray-400 text-sm">退出登录或删除账号</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10 flex-1"
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                退出登录
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger flex-1"
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                删除账号
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">确认退出</h3>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">您确定要退出登录吗？您的游戏数据将保留在本地。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleLogout}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                删除账号
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                此操作不可逆！删除后您的所有游戏数据、评分、愿望单都将被永久删除。
              </p>
              <p className="text-gray-400 text-sm">
                请输入 <span className="text-red-400 font-semibold">"确认删除"</span> 以继续
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="请输入确认删除"
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== '确认删除'}
                className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                永久删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
