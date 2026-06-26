import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useWishlistStore } from '../stores/wishlistStore';
import {
  ShoppingCart,
  Heart,
  User,
  Settings,
  Gamepad2,
  Menu,
  X,
  Search,
  ChevronDown,
  HelpCircle,
  Info,
  Star,
  LogOut,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function NavBar() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isAdmin, logout } = useUserStore();
  const { getPriceDropCount } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const priceDropCount = currentUser ? getPriceDropCount(currentUser.id) : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const navLinks = [
    { to: '/', label: '首页', icon: Gamepad2 },
    { to: '/search', label: '搜索游戏', icon: Search },
    { to: '/help', label: '帮助', icon: HelpCircle },
    { to: '/about', label: '关于', icon: Info },
  ];

  const userMenuItems = [
    { to: '/profile', label: '个人账号', icon: User },
    { to: '/wishlist', label: '愿望单', icon: Heart, badge: priceDropCount },
    { to: '/profile?tab=ratings', label: '我的评分', icon: Star },
    { to: '/settings', label: '设置', icon: Settings },
    ...(isAdmin ? [{ to: '/admin', label: '管理后台', icon: Settings }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-orbitron text-xl font-bold text-gradient">智荐优游</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors relative"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onMouseEnter={() => setUserDropdownOpen(true)}
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-purple-400 font-medium">{currentUser?.username}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseEnter={() => setUserDropdownOpen(true)}
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl py-2 border border-purple-500/20 shadow-xl animate-fade-in-up"
                  >
                    {userMenuItems.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-purple-400 hover:bg-purple-500/10 transition-colors relative"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                    <div className="border-t border-purple-500/20 my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                  登录
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  注册
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass-card-blur border-t border-purple-500/20">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-gray-300 hover:text-purple-400 transition-colors py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-4 border-t border-purple-500/20 mt-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 mb-4 px-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{currentUser?.username}</p>
                      <p className="text-gray-400 text-sm">{currentUser?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {userMenuItems.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-gray-300 hover:text-purple-400 transition-colors py-2.5 px-3 rounded-lg hover:bg-white/5"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full mt-2 py-2.5 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>退出登录</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary text-sm py-2 px-4 flex-1 text-center"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary text-sm py-2 px-4 flex-1 text-center"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
