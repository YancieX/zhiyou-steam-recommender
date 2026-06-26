import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import NavBar from './components/NavBar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import GameDetailPage from './pages/GameDetailPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import { useUserStore } from './stores/userStore';
import { useGameStore } from './stores/gameStore';
import { useWishlistStore } from './stores/wishlistStore';
import { useSettingsStore } from './stores/settingsStore';

function AppContent() {
  const initializeUser = useUserStore(state => state.initialize);
  const initializeGame = useGameStore(state => state.initialize);
  const initializeWishlist = useWishlistStore(state => state.initialize);
  const initializeSettings = useSettingsStore(state => state.initialize);
  const darkMode = useSettingsStore(state => state.darkMode);
  
  useEffect(() => {
    initializeSettings();
    initializeUser();
    initializeGame();
    initializeWishlist();
  }, [initializeUser, initializeGame, initializeWishlist, initializeSettings]);
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-[#0f0f23] to-[#1a1a3e]' : 'bg-gradient-to-br from-[#f0f4f8] to-[#e8eef5]'} transition-colors duration-300`}>
      <NavBar />
      <Toast />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
