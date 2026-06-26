import { create } from 'zustand';
import type { User } from '../data/mockData';
import { storage } from '../utils/storage';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  users: User[];
  login: (email: string, password: string) => boolean;
  register: (username: string, email: string, password: string, adminCode?: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => boolean;
  updateSteamInfo: (steamInfo: Partial<User>) => boolean;
  clearSteamInfo: () => boolean;
  deleteAccount: (userId: string) => void;
  initialize: () => void;
}

export const ADMIN_REGISTRATION_CODE = 'ZHIYOU2024ADMIN';

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
  users: [],

  initialize: () => {
    const savedUsers = storage.getUsers();
    const users = savedUsers.length > 0 ? savedUsers : [];
    
    const currentUser = storage.getCurrentUser();
    set({
      users,
      currentUser,
      isAuthenticated: !!currentUser,
      isAdmin: currentUser?.role === 'admin',
    });
  },

  login: (email: string, password: string) => {
    const { users } = get();
    const user = users.find(u => u.email === email && u.passwordHash === password);
    
    if (user) {
      storage.setCurrentUser(user);
      set({
        currentUser: user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
      });
      return true;
    }
    return false;
  },

  register: (username: string, email: string, password: string, adminCode?: string) => {
    const { users } = get();
    
    if (users.some(u => u.email === email)) {
      return false;
    }
    
    const isAdmin = adminCode === ADMIN_REGISTRATION_CODE;
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      passwordHash: password,
      createdAt: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'user',
      bio: '',
    };
    
    const updatedUsers = [...users, newUser];
    storage.setUsers(updatedUsers);
    storage.setCurrentUser(newUser);
    
    set({
      users: updatedUsers,
      currentUser: newUser,
      isAuthenticated: true,
      isAdmin,
    });
    
    return true;
  },

  logout: () => {
    storage.setCurrentUser(null);
    set({
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },

  updateProfile: (updates: Partial<User>) => {
    const { currentUser, users } = get();
    if (!currentUser) return false;

    const updatedUser = { ...currentUser, ...updates };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    storage.setUsers(updatedUsers);
    storage.setCurrentUser(updatedUser);
    
    set({
      users: updatedUsers,
      currentUser: updatedUser,
      isAdmin: updatedUser.role === 'admin',
    });
    
    return true;
  },

  updateSteamInfo: (steamInfo: Partial<User>) => {
    const { currentUser, users } = get();
    if (!currentUser) return false;

    const updatedUser = {
      ...currentUser,
      steamId: steamInfo.steamId,
      steamNickname: steamInfo.steamNickname,
      steamAvatar: steamInfo.steamAvatar,
      steamImportedAt: new Date().toISOString(),
    };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    storage.setUsers(updatedUsers);
    storage.setCurrentUser(updatedUser);
    
    set({
      users: updatedUsers,
      currentUser: updatedUser,
    });
    
    return true;
  },

  clearSteamInfo: () => {
    const { currentUser, users } = get();
    if (!currentUser) return false;

    const updatedUser = {
      ...currentUser,
      steamId: undefined,
      steamNickname: undefined,
      steamAvatar: undefined,
      steamImportedAt: undefined,
    };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    storage.setUsers(updatedUsers);
    storage.setCurrentUser(updatedUser);
    
    set({
      users: updatedUsers,
      currentUser: updatedUser,
    });
    
    return true;
  },

  deleteAccount: (userId: string) => {
    const { users } = get();
    const updatedUsers = users.filter(u => u.id !== userId);
    
    storage.setUsers(updatedUsers);
    storage.setCurrentUser(null);
    storage.clearUserData(userId);
    
    set({
      users: updatedUsers,
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },
}));
