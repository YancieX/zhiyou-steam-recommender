import type { Game } from '../data/mockData';
import { storage } from './storage';

export interface SteamSearchResult {
  appId: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  coverImage: string;
  description: string;
  tags: string[];
  genre: string;
  releaseYear: number;
  isOnSale: boolean;
  metascore?: string;
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
  detailedDescription?: string;
  aboutTheGame?: string;
  screenshots?: string[];
  backgroundImage?: string;
  developers?: string[];
  publishers?: string[];
  releaseDate?: string;
  categories?: string[];
  genres?: string[];
  steamRating?: number;
  steamReviewCount?: number;
  steamReviewSummary?: string;
  positiveVotes?: number;
  negativeVotes?: number;
  owners?: string;
  ccu?: number;
  comingSoon?: boolean;
}

export interface FeaturedGames {
  specials: SteamSearchResult[];
  topSellers: SteamSearchResult[];
  newReleases: SteamSearchResult[];
}

export interface ApiStatus {
  storeAvailable: boolean;
  steamSpyAvailable: boolean;
  corsProxyAvailable: boolean;
  lastCheck: number;
  consecutiveFailures: number;
}

// 多种API源配置
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// Steam图片URL清理和CDN转换
function cleanSteamImageUrl(url: string): string {
  if (!url) return url;
  
  // 已经是CDN链接，直接返回
  if (url.includes('cdn.akamai.steamstatic.com')) {
    return url.replace(/\?t=\d+$/, '');
  }
  
  // shared.akamai链接，尝试提取appId并转换为CDN链接
  const match = url.match(/steam\/apps\/(\d+)\/([^?]+)/);
  if (match) {
    const appId = match[1];
    const imageType = match[2].split('/').pop();
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/${imageType}`;
  }
  
  // 去掉时间戳参数
  return url.replace(/\?t=\d+$/, '');
}

// 清理URL的编码
function cleanUrlEncoding(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

// 增强的图片代理列表
const IMAGE_PROXIES = [
  // 1. images.weserv.nl (先去时间戳)
  (url: string) => {
    const clean = cleanSteamImageUrl(url);
    return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}`;
  },
  // 2. corsproxy.io
  (url: string) => {
    const clean = cleanSteamImageUrl(url);
    return `https://corsproxy.io/?${encodeURIComponent(clean)}`;
  },
  // 3. allorigins
  (url: string) => {
    const clean = cleanSteamImageUrl(url);
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(clean)}`;
  },
  // 4. codetabs
  (url: string) => {
    const clean = cleanSteamImageUrl(url);
    return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(clean)}`;
  },
  // 5. 直接使用Steam CDN（作为最后的fallback）
  (url: string) => {
    return cleanSteamImageUrl(url);
  },
];

const STEAM_STORE_BASE = 'https://store.steampowered.com/api';
const STEAM_SPY_BASE = 'https://steamspy.com/api.php';
const STEAM_WEB_API_BASE = 'https://api.steampowered.com';

const USE_CORS_PROXY = true;

export function proxyImage(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return IMAGE_PROXIES[0](url);
}

export function proxyImageFallback(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return IMAGE_PROXIES[1](url);
}

export function proxyImageThird(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return IMAGE_PROXIES[2](url);
}

export function proxyImageFourth(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return IMAGE_PROXIES[3](url);
}

export function getSteamCdnImage(appId: string, type: 'header' | 'capsule' = 'header'): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/${type}.jpg`;
}

const getSteamStoreUrl = (endpoint: string) => {
  if (!USE_CORS_PROXY && import.meta.env.DEV) {
    return `/steam-api${endpoint}`;
  }
  const proxy = CORS_PROXIES[0];
  return `${proxy}${encodeURIComponent(`${STEAM_STORE_BASE}${endpoint}`)}`;
};

const getSteamSpyUrl = (params: string) => {
  if (!USE_CORS_PROXY && import.meta.env.DEV) {
    return `/steamspy-api${params}`;
  }
  const proxy = CORS_PROXIES[0];
  return `${proxy}${encodeURIComponent(`${STEAM_SPY_BASE}${params}`)}`;
};

const getSteamWebApiUrl = (endpoint: string) => {
  const proxy = CORS_PROXIES[0];
  return `${proxy}${encodeURIComponent(`${STEAM_WEB_API_BASE}${endpoint}`)}`;
};

const CC = 'cn';
const L = 'schinese';

const MAX_CONSECUTIVE_FAILURES = 3;
const STATUS_RESET_INTERVAL = 10 * 60 * 1000;

let steamApiStatus: ApiStatus = {
  storeAvailable: true,
  steamSpyAvailable: true,
  corsProxyAvailable: true,
  lastCheck: 0,
  consecutiveFailures: 0,
};

function checkAndResetStatus(): void {
  const now = Date.now();
  if (now - steamApiStatus.lastCheck > STATUS_RESET_INTERVAL) {
    steamApiStatus.storeAvailable = true;
    steamApiStatus.steamSpyAvailable = true;
    steamApiStatus.corsProxyAvailable = true;
    steamApiStatus.consecutiveFailures = 0;
    steamApiStatus.lastCheck = now;
  }
}

function recordStoreFailure(): void {
  steamApiStatus.consecutiveFailures++;
  steamApiStatus.lastCheck = Date.now();
  if (steamApiStatus.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    steamApiStatus.storeAvailable = false;
    console.warn('[SteamSearch] Steam Store API 连续失败次数过多，暂时禁用');
  }
}

function recordSteamSpyFailure(): void {
  steamApiStatus.lastCheck = Date.now();
}

function recordSuccess(): void {
  steamApiStatus.consecutiveFailures = 0;
  steamApiStatus.lastCheck = Date.now();
}

export function getApiStatus(): ApiStatus {
  checkAndResetStatus();
  return { ...steamApiStatus };
}

export function refreshApiStatus(): ApiStatus {
  steamApiStatus.storeAvailable = true;
  steamApiStatus.steamSpyAvailable = true;
  steamApiStatus.consecutiveFailures = 0;
  steamApiStatus.lastCheck = Date.now();
  return { ...steamApiStatus };
}

function formatPrice(cents: number): number {
  return Math.round(cents) / 100;
}

function extractYear(dateStr: string): number {
  const match = dateStr.match(/(\d{4})/);
  if (match) {
    const year = parseInt(match[1]);
    if (year >= 1990 && year <= 2100) return year;
  }
  const currentYear = new Date().getFullYear();
  return currentYear;
}

function steamSpyToGame(spyGame: any): SteamSearchResult {
  const positive = spyGame.positive || 0;
  const negative = spyGame.negative || 0;
  const total = positive + negative;
  const steamRating = total > 0 ? Math.round((positive / total) * 100) : undefined;
  const price = spyGame.price ? Number(spyGame.price) : 0;
  const initialprice = spyGame.initialprice ? Number(spyGame.initialprice) : price;
  const discount = spyGame.discount ? Number(spyGame.discount) : 0;

  const tags: string[] = [];
  if (spyGame.genre) {
    tags.push(spyGame.genre);
  }
  if (spyGame.tags && typeof spyGame.tags === 'object') {
    const tagEntries = Object.entries(spyGame.tags);
    tagEntries.slice(0, 5).forEach(([tag]) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
  }

  return {
    appId: String(spyGame.appid),
    name: spyGame.name || '未知游戏',
    price: formatPrice(price),
    originalPrice: formatPrice(initialprice),
    discount: discount,
    coverImage: `https://cdn.akamai.steamstatic.com/steam/apps/${spyGame.appid}/header.jpg`,
    description: spyGame.short_description || '',
    tags,
    genre: spyGame.genre || '动作',
    releaseYear: extractYear(spyGame.release_date || ''),
    isOnSale: discount > 0,
    developers: spyGame.developer ? [spyGame.developer] : undefined,
    publishers: spyGame.publisher ? [spyGame.publisher] : undefined,
    genres: spyGame.genre ? [spyGame.genre] : undefined,
    steamRating,
    steamReviewCount: total || undefined,
    positiveVotes: positive,
    negativeVotes: negative,
    owners: spyGame.owners,
    ccu: spyGame.ccu ? Number(spyGame.ccu) : undefined,
    metascore: spyGame.metascore ? String(spyGame.metascore) : undefined,
  };
}

const FALLBACK_GAMES: SteamSearchResult[] = [
  {
    appId: '1091500',
    name: '赛博朋克 2077',
    price: 89.4,
    originalPrice: 298,
    discount: 70,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    description: '《赛博朋克 2077》是一款开放世界动作冒险 RPG 游戏。故事发生在暗黑未来的夜之城，一座由科技与堕落交织而成的大都会。',
    tags: ['角色扮演', '开放世界', '动作', '科幻', '剧情丰富'],
    genre: '角色扮演',
    releaseYear: 2020,
    isOnSale: true,
    metascore: '86',
    platforms: { windows: true, mac: false, linux: true },
    detailedDescription: '《赛博朋克 2077》是一款开放世界动作冒险RPG，故事发生在夜之城。这是一座五光十色的大都会，权力更迭和身体改造是这里不变的主题。',
    aboutTheGame: '扮演一名野心勃勃的雇佣兵：V，追寻一种独一无二的植入体——获得永生的关键。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/page_bg_generated_v6.jpg',
    developers: ['CD PROJEKT RED'],
    publishers: ['CD PROJEKT RED'],
    releaseDate: '2020年12月10日',
    categories: ['单人', '开放世界', '角色自定义'],
    genres: ['角色扮演', '动作', '冒险'],
    steamRating: 85,
    steamReviewCount: 850000,
    steamReviewSummary: '特别好评',
    positiveVotes: 722500,
    negativeVotes: 127500,
    owners: '10,000,000 - 20,000,000',
    ccu: 150000,
  },
  {
    appId: '292030',
    name: '巫师3：狂猎',
    price: 39.6,
    originalPrice: 198,
    discount: 80,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg',
    description: '扮演职业怪物杀手利维亚的杰洛特，在奇幻开放世界中展开史诗冒险。',
    tags: ['角色扮演', '开放世界', '剧情丰富', '奇幻', '动作'],
    genre: '角色扮演',
    releaseYear: 2015,
    isOnSale: true,
    metascore: '93',
    platforms: { windows: true, mac: false, linux: true },
    detailedDescription: '《巫师3：狂猎》是一款史诗级开放世界角色扮演游戏，你将扮演职业怪物猎人杰洛特，踏上寻找消失孩子的旅程。',
    aboutTheGame: '在奇幻开放世界中体验最具影响力的角色扮演游戏之一。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/page_bg_generated.jpg',
    developers: ['CD PROJEKT RED'],
    publishers: ['CD PROJEKT RED'],
    releaseDate: '2015年5月19日',
    categories: ['单人', '开放世界', '剧情'],
    genres: ['角色扮演', '动作', '冒险'],
    steamRating: 97,
    steamReviewCount: 1200000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 1164000,
    negativeVotes: 36000,
    owners: '20,000,000 - 50,000,000',
    ccu: 80000,
  },
  {
    appId: '1245620',
    name: '艾尔登法环',
    price: 258.7,
    originalPrice: 398,
    discount: 35,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    description: '宫崎英高打造的全新动作RPG，广阔的世界与充满挑战的战斗。',
    tags: ['魂系', '开放世界', '动作', '角色扮演', '困难'],
    genre: '动作角色扮演',
    releaseYear: 2022,
    isOnSale: true,
    metascore: '96',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: '《艾尔登法环》是一款由FromSoftware开发的动作角色扮演游戏，拥有广阔的开放世界和深度战斗系统。',
    aboutTheGame: '踏上前往交界地的旅程，成为艾尔登之王。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/page_bg_generated.jpg',
    developers: ['FromSoftware'],
    publishers: ['FromSoftware, Inc.', 'BANDAI NAMCO Entertainment'],
    releaseDate: '2022年2月25日',
    categories: ['单人', '多人', 'PvP', '合作'],
    genres: ['动作', '角色扮演'],
    steamRating: 92,
    steamReviewCount: 1500000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 1380000,
    negativeVotes: 120000,
    owners: '20,000,000 - 50,000,000',
    ccu: 200000,
  },
  {
    appId: '1174180',
    name: '荒野大镖客2',
    price: 104.65,
    originalPrice: 299,
    discount: 65,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg',
    description: '西部题材开放世界动作冒险游戏，体验牛仔的传奇人生。',
    tags: ['开放世界', '动作', '冒险', '剧情丰富', '西部'],
    genre: '动作冒险',
    releaseYear: 2019,
    isOnSale: true,
    metascore: '97',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: 'Rockstar Games出品的史诗级西部开放世界游戏，讲述亡命之徒亚瑟·摩根的故事。',
    aboutTheGame: '1899年，美国西部蛮荒时代即将落幕。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/page_bg_generated.jpg',
    developers: ['Rockstar Games'],
    publishers: ['Rockstar Games'],
    releaseDate: '2019年12月6日',
    categories: ['单人', '开放世界', '第一人称', '第三人称'],
    genres: ['动作', '冒险'],
    steamRating: 88,
    steamReviewCount: 700000,
    steamReviewSummary: '特别好评',
    positiveVotes: 616000,
    negativeVotes: 84000,
    owners: '10,000,000 - 20,000,000',
    ccu: 60000,
  },
  {
    appId: '1086940',
    name: '博德之门3',
    price: 193.7,
    originalPrice: 298,
    discount: 35,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    description: '龙与地下城世界观的史诗级RPG，自由度极高的回合制战斗。',
    tags: ['角色扮演', '回合制', '奇幻', '剧情丰富', '选择取向'],
    genre: '角色扮演',
    releaseYear: 2023,
    isOnSale: true,
    metascore: '96',
    platforms: { windows: true, mac: true, linux: false },
    detailedDescription: '拉瑞安工作室制作的龙与地下城5E规则角色扮演游戏，提供前所未有的自由度。',
    aboutTheGame: '组建你的队伍，重返被遗忘的国度。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/page_bg_generated.jpg',
    developers: ['Larian Studios'],
    publishers: ['Larian Studios'],
    releaseDate: '2023年8月3日',
    categories: ['单人', '多人', '合作', '回合制'],
    genres: ['角色扮演', '策略'],
    steamRating: 96,
    steamReviewCount: 900000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 864000,
    negativeVotes: 36000,
    owners: '10,000,000 - 20,000,000',
    ccu: 120000,
  },
  {
    appId: '814380',
    name: '只狼：影逝二度',
    price: 79.2,
    originalPrice: 198,
    discount: 60,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/814380/header.jpg',
    description: '宫崎英高代表作，刀剑交锋的极致战斗体验。',
    tags: ['魂系', '动作', '忍者', '困难', '日本战国'],
    genre: '动作',
    releaseYear: 2019,
    isOnSale: true,
    metascore: '90',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: 'FromSoftware出品的武士动作游戏，以日本战国时代为背景，带来极致的刀剑战斗体验。',
    aboutTheGame: '以忍者之姿，踏上复仇之路。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/814380/page_bg_generated.jpg',
    developers: ['FromSoftware'],
    publishers: ['Activision', 'FromSoftware, Inc.'],
    releaseDate: '2019年3月22日',
    categories: ['单人', '动作', '潜行'],
    genres: ['动作', '冒险'],
    steamRating: 94,
    steamReviewCount: 500000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 470000,
    negativeVotes: 30000,
    owners: '5,000,000 - 10,000,000',
    ccu: 25000,
  },
  {
    appId: '1145360',
    name: '黑帝斯',
    price: 56,
    originalPrice: 80,
    discount: 30,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    description: '冥界之子的逃脱之旅，Roguelike动作游戏的巅峰之作。',
    tags: ['Roguelike', '动作', '独立', '神话', '剧情丰富'],
    genre: '动作',
    releaseYear: 2020,
    isOnSale: true,
    metascore: '93',
    platforms: { windows: true, mac: true, linux: true },
    detailedDescription: 'Supergiant Games出品的Roguelike动作游戏，以希腊神话为背景，讲述冥界王子扎格列欧斯的逃脱故事。',
    aboutTheGame: '逃出冥界，揭开身世之谜。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/page_bg_generated.jpg',
    developers: ['Supergiant Games'],
    publishers: ['Supergiant Games'],
    releaseDate: '2020年9月17日',
    categories: ['单人', 'Roguelike', '像素'],
    genres: ['动作', '独立', '角色扮演'],
    steamRating: 98,
    steamReviewCount: 400000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 392000,
    negativeVotes: 8000,
    owners: '5,000,000 - 10,000,000',
    ccu: 15000,
  },
  {
    appId: '367520',
    name: '空洞骑士',
    price: 24.5,
    originalPrice: 48,
    discount: 49,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    description: '手绘风格的银河恶魔城杰作，探索广阔的地下王国。',
    tags: ['银河恶魔城', '独立', '平台跳跃', '手绘', '探索'],
    genre: '平台跳跃',
    releaseYear: 2017,
    isOnSale: true,
    metascore: '90',
    platforms: { windows: true, mac: true, linux: true },
    detailedDescription: 'Team Cherry开发的银河恶魔城游戏，以精美的手绘风格和广阔的探索空间著称。',
    aboutTheGame: '在废墟王国深处，寻找真相。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/page_bg_generated.jpg',
    developers: ['Team Cherry'],
    publishers: ['Team Cherry'],
    releaseDate: '2017年2月24日',
    categories: ['单人', '平台跳跃', '探索'],
    genres: ['动作', '独立', '冒险'],
    steamRating: 97,
    steamReviewCount: 600000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 582000,
    negativeVotes: 18000,
    owners: '10,000,000 - 20,000,000',
    ccu: 10000,
  },
  {
    appId: '413150',
    name: '星露谷物语',
    price: 28,
    originalPrice: 48,
    discount: 42,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg',
    description: '继承农场，过上宁静的乡村生活。模拟经营神作。',
    tags: ['模拟经营', '像素', '独立', '农场', '休闲'],
    genre: '模拟经营',
    releaseYear: 2016,
    isOnSale: true,
    metascore: '89',
    platforms: { windows: true, mac: true, linux: true },
    detailedDescription: 'ConcernedApe单人开发的农场模拟游戏，拥有丰富的内容和极高的自由度。',
    aboutTheGame: '逃离城市，开始农场生活。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/413150/page_bg_generated.jpg',
    developers: ['ConcernedApe'],
    publishers: ['ConcernedApe'],
    releaseDate: '2016年2月26日',
    categories: ['单人', '多人', '合作', '像素'],
    genres: ['模拟', '角色扮演', '独立'],
    steamRating: 98,
    steamReviewCount: 800000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 784000,
    negativeVotes: 16000,
    owners: '20,000,000 - 50,000,000',
    ccu: 30000,
  },
  {
    appId: '105600',
    name: '泰拉瑞亚',
    price: 18,
    originalPrice: 36,
    discount: 50,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg',
    description: '挖掘、建造、战斗！2D沙盒冒险的终极体验。',
    tags: ['沙盒', '像素', '冒险', '建造', '生存'],
    genre: '沙盒',
    releaseYear: 2011,
    isOnSale: true,
    metascore: '83',
    platforms: { windows: true, mac: true, linux: true },
    detailedDescription: 'Re-Logic开发的2D沙盒动作冒险游戏，融合了建造、探索、战斗等多种元素。',
    aboutTheGame: '挖掘、战斗、探索、建造！',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/105600/page_bg_generated.jpg',
    developers: ['Re-Logic'],
    publishers: ['Re-Logic'],
    releaseDate: '2011年5月16日',
    categories: ['单人', '多人', '沙盒', '像素'],
    genres: ['动作', '冒险', '独立'],
    steamRating: 97,
    steamReviewCount: 1300000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 1261000,
    negativeVotes: 39000,
    owners: '50,000,000 - 100,000,000',
    ccu: 50000,
  },
  {
    appId: '374320',
    name: '黑暗之魂3',
    price: 59.4,
    originalPrice: 198,
    discount: 70,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/374320/header.jpg',
    description: '魂系集大成之作，在末世中体验最纯粹的挑战。',
    tags: ['魂系', '动作', '困难', '角色扮演', '黑暗奇幻'],
    genre: '动作角色扮演',
    releaseYear: 2016,
    isOnSale: true,
    metascore: '89',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: 'FromSoftware出品的黑暗奇幻动作RPG，魂系列的最终章。',
    aboutTheGame: '火焰渐熄，世界即将终结。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/374320/page_bg_generated.jpg',
    developers: ['FromSoftware'],
    publishers: ['BANDAI NAMCO Entertainment', 'FromSoftware, Inc.'],
    releaseDate: '2016年4月12日',
    categories: ['单人', '多人', 'PvP', '合作'],
    genres: ['动作', '角色扮演'],
    steamRating: 93,
    steamReviewCount: 450000,
    steamReviewSummary: '特别好评',
    positiveVotes: 418500,
    negativeVotes: 31500,
    owners: '10,000,000 - 20,000,000',
    ccu: 20000,
  },
  {
    appId: '1593500',
    name: '战神',
    price: 148.5,
    originalPrice: 278,
    discount: 47,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg',
    description: '北欧神话中的父子史诗，奎托斯的全新冒险。',
    tags: ['动作', '剧情丰富', '神话', '第三人称', '冒险'],
    genre: '动作冒险',
    releaseYear: 2022,
    isOnSale: true,
    metascore: '93',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: '索尼圣莫尼卡工作室出品的动作冒险大作，奎托斯在北欧神话中的全新篇章。',
    aboutTheGame: '父子携手，踏上九界之旅。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/page_bg_generated.jpg',
    developers: ['Santa Monica Studio', 'Jetpack Interactive'],
    publishers: ['PlayStation PC LLC'],
    releaseDate: '2022年1月14日',
    categories: ['单人', '动作', '剧情'],
    genres: ['动作', '冒险'],
    steamRating: 95,
    steamReviewCount: 350000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 332500,
    negativeVotes: 17500,
    owners: '5,000,000 - 10,000,000',
    ccu: 35000,
  },
  {
    appId: '582010',
    name: '怪物猎人：世界',
    price: 79.2,
    originalPrice: 198,
    discount: 60,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/582010/header.jpg',
    description: '狩猎巨大怪物，打造最强装备，共斗动作的巅峰。',
    tags: ['动作', '合作', '狩猎', '多人', '开放世界'],
    genre: '动作',
    releaseYear: 2018,
    isOnSale: true,
    metascore: '90',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: '卡普空出品的共斗动作游戏，在生态丰富的世界中狩猎各种巨型怪物。',
    aboutTheGame: '狩猎不息，进化不止。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/582010/page_bg_generated.jpg',
    developers: ['CAPCOM Co., Ltd.'],
    publishers: ['CAPCOM Co., Ltd.'],
    releaseDate: '2018年8月9日',
    categories: ['单人', '多人', '合作', '动作'],
    genres: ['动作', '角色扮演'],
    steamRating: 91,
    steamReviewCount: 550000,
    steamReviewSummary: '特别好评',
    positiveVotes: 500500,
    negativeVotes: 49500,
    owners: '10,000,000 - 20,000,000',
    ccu: 40000,
  },
  {
    appId: '1222140',
    name: '底特律：变人',
    price: 64,
    originalPrice: 128,
    discount: 50,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1222140/header.jpg',
    description: '选择决定命运，互动电影游戏的里程碑。',
    tags: ['互动电影', '剧情丰富', '选择取向', '科幻', '冒险'],
    genre: '互动电影',
    releaseYear: 2019,
    isOnSale: true,
    metascore: '78',
    platforms: { windows: true, mac: false, linux: false },
    detailedDescription: 'Quantic Dream出品的互动电影游戏，讲述三个仿生人在未来底特律的故事。',
    aboutTheGame: '你的选择，将决定他们的命运。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1222140/page_bg_generated.jpg',
    developers: ['Quantic Dream'],
    publishers: ['Quantic Dream'],
    releaseDate: '2019年12月12日',
    categories: ['单人', '剧情', '选择取向'],
    genres: ['冒险', '动作'],
    steamRating: 90,
    steamReviewCount: 250000,
    steamReviewSummary: '特别好评',
    positiveVotes: 225000,
    negativeVotes: 25000,
    owners: '2,000,000 - 5,000,000',
    ccu: 8000,
  },
  {
    appId: '632470',
    name: '极乐迪斯科 - 最终剪辑版',
    price: 79.2,
    originalPrice: 116,
    discount: 32,
    coverImage: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg',
    description: '一款颠覆性的侦探RPG，文字的力量就是一切。',
    tags: ['角色扮演', '侦探', '剧情丰富', '独立', '选择取向'],
    genre: '角色扮演',
    releaseYear: 2021,
    isOnSale: true,
    metascore: '97',
    platforms: { windows: true, mac: true, linux: true },
    detailedDescription: 'ZA/UM开发的革命性侦探RPG，拥有前所未有的对话系统和深度世界观。',
    aboutTheGame: '失忆的侦探，迷雾重重的案件。',
    screenshots: [],
    backgroundImage: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/page_bg_generated.jpg',
    developers: ['ZA/UM'],
    publishers: ['ZA/UM'],
    releaseDate: '2021年3月30日',
    categories: ['单人', '剧情', '选择取向'],
    genres: ['角色扮演', '冒险', '独立'],
    steamRating: 95,
    steamReviewCount: 200000,
    steamReviewSummary: '好评如潮',
    positiveVotes: 190000,
    negativeVotes: 10000,
    owners: '2,000,000 - 5,000,000',
    ccu: 5000,
  },
];

async function searchSteamStore(query: string, limit: number): Promise<SteamSearchResult[]> {
  checkAndResetStatus();
  if (!steamApiStatus.storeAvailable) {
    throw new Error('Steam Store API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamStoreUrl(`/storesearch/?term=${encodeURIComponent(query)}&l=${L}&cc=${CC}`),
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      recordStoreFailure();
      throw new Error(`Steam Store API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    const results: SteamSearchResult[] = [];
    const appIds: string[] = [];

    for (const item of items.slice(0, Math.min(limit + 10, items.length))) {
      const isComingSoon = item.type === 'coming_soon';
      if (item.type !== 'app' && !isComingSoon) continue;

      const appId = String(item.id);
      const priceInitial = item.price?.initial ?? 0;
      const priceFinal = item.price?.final ?? 0;
      const discount = item.price?.discount_percent ?? 0;

      appIds.push(appId);

      results.push({
        appId,
        name: item.name,
        price: isComingSoon ? 0 : formatPrice(priceFinal),
        originalPrice: isComingSoon ? 0 : formatPrice(priceInitial),
        discount: isComingSoon ? 0 : discount,
        coverImage: item.tiny_image?.replace('capsule_231x87', 'header') ||
                   `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        description: '',
        tags: [],
        genre: '',
        releaseYear: new Date().getFullYear(),
        isOnSale: false,
        metascore: item.metascore,
        platforms: item.platforms,
        comingSoon: isComingSoon,
      });
    }

    recordSuccess();

    if (results.length > 0 && appIds.length > 0) {
      const details = await fetchMultipleAppDetailsFromStore(appIds.slice(0, Math.min(30, appIds.length)));
      for (const result of results) {
        const detail = details[result.appId];
        if (detail) {
          Object.assign(result, detail);
        }
      }
    }

    console.info('[SteamSearch] 数据来源: Steam Store API');
    return results.slice(0, limit);
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      recordStoreFailure();
    }
    console.warn('[SteamSearch] Steam Store 搜索失败:', error.message);
    throw error;
  }
}

async function fetchMultipleAppDetailsFromStore(appIds: string[]): Promise<Record<string, Partial<SteamSearchResult>>> {
  const result: Record<string, Partial<SteamSearchResult>> = {};
  const cachedResults: Record<string, Partial<SteamSearchResult>> = {};
  const uncachedIds: string[] = [];

  for (const appId of appIds) {
    const cached = storage.getCachedGame(appId);
    if (cached) {
      cachedResults[appId] = {
        appId,
        description: cached.description,
        tags: cached.tags,
        genre: cached.genre,
        releaseYear: cached.releaseYear,
        coverImage: cached.coverImage,
        detailedDescription: cached.detailedDescription,
        aboutTheGame: cached.aboutTheGame,
        screenshots: cached.screenshots,
        backgroundImage: cached.backgroundImage,
        developers: cached.developers,
        publishers: cached.publishers,
        releaseDate: cached.releaseDate,
        categories: cached.categories,
        genres: cached.genres,
        steamRating: cached.steamRating,
        steamReviewCount: cached.steamReviewCount,
        platforms: cached.platforms,
        price: cached.salePrice,
        originalPrice: cached.originalPrice,
        discount: cached.discount,
        isOnSale: cached.isOnSale,
      };
    } else {
      uncachedIds.push(appId);
    }
  }

  Object.assign(result, cachedResults);

  const batchSize = 5;
  for (let i = 0; i < uncachedIds.length; i += batchSize) {
    const batch = uncachedIds.slice(i, i + batchSize);
    const appIdsParam = batch.join(',');

    try {
      const response = await fetch(
        getSteamStoreUrl(`/appdetails?appids=${appIdsParam}&cc=${CC}&l=${L}`),
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) continue;

      const data = await response.json();

      for (const appId of batch) {
        const appData = data[appId];
        if (!appData?.success || !appData.data) continue;

        const d = appData.data;
        const genres = d.genres?.map((g: any) => g.description) || [];
        const categories = d.categories?.map((c: any) => c.description) || [];
        const screenshots = d.screenshots?.map((s: any) => s.path_thumbnail || s.path_full) || [];
        const recommendations = d.recommendations?.total || 0;

        let steamRating: number | undefined;
        let steamReviewCount: number | undefined;
        let steamReviewSummary: string | undefined;

        if (d.reviews) {
          const reviewMatch = d.reviews.match(/(\d+)%/);
          if (reviewMatch) {
            steamRating = parseInt(reviewMatch[1]);
          }
          const countMatch = d.reviews.match(/([\d,]+)\s*篇/);
          if (countMatch) {
            steamReviewCount = parseInt(countMatch[1].replace(/,/g, ''));
          }
          const summaryMatch = d.reviews.match(/：(\S+\s*\S+)/);
          if (summaryMatch) {
            steamReviewSummary = summaryMatch[1];
          }
        }

        const priceData = d.price_overview || { initial: 0, final: 0, discount_percent: 0 };
        
        const detail: Partial<SteamSearchResult> = {
          description: d.short_description || '',
          tags: [...genres, ...categories.slice(0, 3)],
          genre: genres[0] || '动作',
          releaseYear: extractYear(d.release_date?.date || ''),
          coverImage: d.header_image,
          detailedDescription: d.detailed_description || '',
          aboutTheGame: d.about_the_game || '',
          screenshots,
          backgroundImage: d.background_raw || d.background,
          developers: d.developers || [],
          publishers: d.publishers || [],
          releaseDate: d.release_date?.date || '',
          categories,
          genres,
          steamRating,
          steamReviewCount: steamReviewCount || recommendations,
          steamReviewSummary,
          platforms: d.platforms,
          comingSoon: d.release_date?.coming_soon || false,
          price: formatPrice(priceData.final || 0),
          originalPrice: formatPrice(priceData.initial || 0),
          discount: priceData.discount_percent || 0,
          isOnSale: (priceData.discount_percent || 0) > 0,
        };

        result[appId] = detail;

        storage.cacheGame(appId, {
          id: `game-steam-${appId}`,
          name: d.name,
          description: d.short_description || '',
          originalPrice: d.price_overview?.initial ? formatPrice(d.price_overview.initial) : 0,
          salePrice: d.price_overview?.final ? formatPrice(d.price_overview.final) : 0,
          discount: d.price_overview?.discount_percent || 0,
          coverImage: d.header_image || '',
          tags: [...genres, ...categories.slice(0, 3)],
          genre: genres[0] || '动作',
          releaseYear: extractYear(d.release_date?.date || ''),
          isOnSale: (d.price_overview?.discount_percent || 0) > 0,
          detailedDescription: d.detailed_description || '',
          aboutTheGame: d.about_the_game || '',
          screenshots,
          backgroundImage: d.background_raw || d.background,
          developers: d.developers || [],
          publishers: d.publishers || [],
          releaseDate: d.release_date?.date || '',
          categories,
          genres,
          steamRating,
          steamReviewCount: steamReviewCount || recommendations,
          steamReviewSummary,
          platforms: d.platforms,
          steamAppId: appId,
        });
      }
    } catch (e: any) {
      console.warn('[SteamSearch] 批量获取详情失败:', e.message);
    }

    if (i + batchSize < uncachedIds.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return result;
}

async function searchWithSteamSpy(query: string, limit: number): Promise<SteamSearchResult[]> {
  checkAndResetStatus();
  if (!steamApiStatus.steamSpyAvailable) {
    throw new Error('SteamSpy API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamSpyUrl('?request=top100in2weeks'),
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      recordSteamSpyFailure();
      throw new Error(`SteamSpy API error: ${response.status}`);
    }

    const data = await response.json();
    const games = Object.values(data) as any[];

    const lowerQuery = query.toLowerCase().trim();
    const filtered = games.filter((g: any) =>
      g.name?.toLowerCase().includes(lowerQuery) ||
      String(g.appid).includes(lowerQuery)
    );

    const results = filtered.slice(0, limit).map((g: any) => steamSpyToGame(g));

    recordSuccess();
    console.info('[SteamSearch] 数据来源: SteamSpy API (top100in2weeks过滤)');
    return results;
  } catch (error: any) {
    recordSteamSpyFailure();
    console.warn('[SteamSearch] SteamSpy 搜索失败:', error.message);
    throw error;
  }
}

function searchFromCache(query: string, limit: number): SteamSearchResult[] {
  try {
    const cache = storage.getGameCache();
    const games = Object.values(cache);

    if (!query || query.trim().length === 0) {
      return games.slice(0, limit).map(g => gameToSteamSearchResult(g));
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = games.filter(g =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.steamAppId?.includes(lowerQuery) ||
      g.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );

    return filtered.slice(0, limit).map(g => gameToSteamSearchResult(g));
  } catch (error) {
    console.warn('[SteamSearch] 缓存搜索失败:', error);
    return [];
  }
}

function gameToSteamSearchResult(game: Game): SteamSearchResult {
  return {
    appId: game.steamAppId || game.id,
    name: game.name,
    price: game.salePrice,
    originalPrice: game.originalPrice,
    discount: game.discount,
    coverImage: game.coverImage,
    description: game.description,
    tags: game.tags,
    genre: game.genre,
    releaseYear: game.releaseYear,
    isOnSale: game.isOnSale,
    metascore: game.metacriticScore ? String(game.metacriticScore) : undefined,
    platforms: game.platforms,
    detailedDescription: game.detailedDescription,
    aboutTheGame: game.aboutTheGame,
    screenshots: game.screenshots,
    backgroundImage: game.backgroundImage,
    developers: game.developers,
    publishers: game.publishers,
    releaseDate: game.releaseDate,
    categories: game.categories,
    genres: game.genres,
    steamRating: game.steamRating,
    steamReviewCount: game.steamReviewCount,
    steamReviewSummary: game.steamReviewSummary,
  };
}

function getFallbackSearchResults(query: string, limit: number): SteamSearchResult[] {
  if (!query || query.trim().length === 0) {
    return FALLBACK_GAMES.slice(0, limit);
  }

  const lowerQuery = query.toLowerCase().trim();
  const filtered = FALLBACK_GAMES.filter(g =>
    g.name.toLowerCase().includes(lowerQuery) ||
    g.appId.includes(lowerQuery) ||
    g.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );

  return filtered.slice(0, limit);
}

export async function searchSteamGames(query: string, limit: number = 20): Promise<SteamSearchResult[]> {
  try {
    const results = await searchSteamStore(query, limit);
    if (results.length > 0) return results;
    throw new Error('No results from Steam Store');
  } catch {
    // fall through
  }

  try {
    const results = await searchWithSteamSpy(query, limit);
    if (results.length > 0) return results;
  } catch {
    // fall through
  }

  const cacheResults = searchFromCache(query, limit);
  if (cacheResults.length > 0) {
    console.info('[SteamSearch] 数据来源: 本地缓存');
    return cacheResults;
  }

  console.info('[SteamSearch] 数据来源: Fallback数据');
  return getFallbackSearchResults(query, limit);
}

async function getGameDetailsFromStore(appId: string): Promise<SteamSearchResult> {
  checkAndResetStatus();
  if (!steamApiStatus.storeAvailable) {
    throw new Error('Steam Store API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamStoreUrl(`/appdetails?appids=${appId}&cc=${CC}&l=${L}`),
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      recordStoreFailure();
      throw new Error(`Steam Store API error: ${response.status}`);
    }

    const data = await response.json();
    const appData = data[appId];

    if (!appData?.success || !appData.data) {
      throw new Error('Game not found in Steam Store');
    }

    const d = appData.data;
    const price = d.price_overview || { initial: 0, final: 0, discount_percent: 0 };
    const genres = d.genres?.map((g: any) => g.description) || [];
    const categories = d.categories?.map((c: any) => c.description) || [];
    const screenshots = d.screenshots?.map((s: any) => s.path_thumbnail || s.path_full) || [];
    const recommendations = d.recommendations?.total || 0;

    let steamRating: number | undefined;
    let steamReviewCount: number | undefined;
    let steamReviewSummary: string | undefined;

    if (d.reviews) {
      const reviewMatch = d.reviews.match(/(\d+)%/);
      if (reviewMatch) {
        steamRating = parseInt(reviewMatch[1]);
      }
      const countMatch = d.reviews.match(/([\d,]+)\s*篇/);
      if (countMatch) {
        steamReviewCount = parseInt(countMatch[1].replace(/,/g, ''));
      }
      const summaryMatch = d.reviews.match(/：(\S+\s*\S+)/);
      if (summaryMatch) {
        steamReviewSummary = summaryMatch[1];
      }
    }

    const result: SteamSearchResult = {
      appId,
      name: d.name,
      price: formatPrice(price.final || 0),
      originalPrice: formatPrice(price.initial || 0),
      discount: price.discount_percent || 0,
      coverImage: d.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      description: d.short_description || '',
      tags: [...genres, ...categories.slice(0, 5)],
      genre: genres[0] || '动作',
      releaseYear: extractYear(d.release_date?.date || ''),
      isOnSale: (price.discount_percent || 0) > 0,
      metascore: d.metacritic?.score ? String(d.metacritic.score) : undefined,
      platforms: d.platforms,
      detailedDescription: d.detailed_description || '',
      aboutTheGame: d.about_the_game || '',
      screenshots,
      backgroundImage: d.background_raw || d.background,
      developers: d.developers || [],
      publishers: d.publishers || [],
      releaseDate: d.release_date?.date || '',
      categories,
      genres,
      steamRating,
      steamReviewCount: steamReviewCount || recommendations,
      steamReviewSummary,
    };

    storage.cacheGame(appId, convertToGame(result));
    recordSuccess();

    console.info('[SteamSearch] 游戏详情数据来源: Steam Store API');
    return result;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      recordStoreFailure();
    }
    console.warn('[SteamSearch] Steam Store 获取游戏详情失败:', error.message);
    throw error;
  }
}

async function getGameDetailsFromSteamSpy(appId: string): Promise<SteamSearchResult> {
  checkAndResetStatus();
  if (!steamApiStatus.steamSpyAvailable) {
    throw new Error('SteamSpy API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamSpyUrl(`?request=appdetails&appid=${appId}`),
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      recordSteamSpyFailure();
      throw new Error(`SteamSpy API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.appid) {
      throw new Error('Game not found in SteamSpy');
    }

    const result = steamSpyToGame(data);
    recordSuccess();

    console.info('[SteamSearch] 游戏详情数据来源: SteamSpy API');
    return result;
  } catch (error: any) {
    recordSteamSpyFailure();
    console.warn('[SteamSearch] SteamSpy 获取游戏详情失败:', error.message);
    throw error;
  }
}

function getGameDetailsFromCache(appId: string): SteamSearchResult | null {
  try {
    const cached = storage.getCachedGame(appId);
    if (cached) {
      console.info('[SteamSearch] 游戏详情数据来源: 本地缓存');
      return gameToSteamSearchResult(cached);
    }
  } catch (error) {
    console.warn('[SteamSearch] 缓存获取游戏详情失败:', error);
  }
  return null;
}

function getFallbackGameDetails(appId: string): SteamSearchResult | null {
  const fallback = FALLBACK_GAMES.find(g => g.appId === appId);
  if (fallback) {
    console.info('[SteamSearch] 游戏详情数据来源: Fallback数据');
    return fallback;
  }
  return null;
}

export async function getSteamGameDetails(appId: string): Promise<SteamSearchResult | null> {
  try {
    return await getGameDetailsFromStore(appId);
  } catch {
    // fall through
  }

  try {
    return await getGameDetailsFromSteamSpy(appId);
  } catch {
    // fall through
  }

  const cached = getGameDetailsFromCache(appId);
  if (cached) return cached;

  return getFallbackGameDetails(appId);
}

async function getFeaturedFromStore(): Promise<FeaturedGames> {
  checkAndResetStatus();
  if (!steamApiStatus.storeAvailable) {
    throw new Error('Steam Store API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamStoreUrl(`/featuredcategories/?l=${L}&cc=${CC}`),
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      recordStoreFailure();
      throw new Error(`Steam Store API error: ${response.status}`);
    }

    const data = await response.json();

    const specials = data.specials?.items || [];
    const topSellers = data.top_sellers?.items || [];
    const newReleases = data.new_releases?.items || [];

    const convertItems = (items: any[]): SteamSearchResult[] => {
      return items
        .filter((item: any) => item.type === undefined || item.type === 'app')
        .slice(0, 12)
        .map((item: any) => {
          const id = item.id || item.appid;
          const priceInitial = item.discounted_price !== undefined
            ? (item.original_price || 0)
            : (item.price?.initial || 0);
          const priceFinal = item.discounted_price !== undefined
            ? item.discounted_price
            : (item.price?.final || 0);
          const discount = item.discount_percent !== undefined
            ? item.discount_percent
            : (item.price?.discount_percent || 0);

          return {
            appId: String(id),
            name: item.name,
            price: formatPrice(priceFinal),
            originalPrice: formatPrice(priceInitial),
            discount: discount,
            coverImage: item.header_image || item.large_capsule_image ||
                       `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
            description: '',
            tags: [],
            genre: '',
            releaseYear: 2024,
            isOnSale: discount > 0,
          };
        });
    };

    const result = {
      specials: convertItems(specials),
      topSellers: convertItems(topSellers),
      newReleases: convertItems(newReleases),
    };

    const allAppIds = [
      ...result.specials.map(g => g.appId),
      ...result.topSellers.map(g => g.appId),
      ...result.newReleases.map(g => g.appId),
    ].slice(0, 15);

    if (allAppIds.length > 0) {
      const details = await fetchMultipleAppDetailsFromStore(allAppIds);

      const enrichResults = (items: SteamSearchResult[]): SteamSearchResult[] => {
        return items.map(item => {
          const detail = details[item.appId];
          if (detail) {
            return { ...item, ...detail };
          }
          return item;
        });
      };

      result.specials = enrichResults(result.specials);
      result.topSellers = enrichResults(result.topSellers);
      result.newReleases = enrichResults(result.newReleases);
    }

    recordSuccess();
    console.info('[SteamSearch] 精选游戏数据来源: Steam Store API');
    return result;
  } catch (error: any) {
    recordStoreFailure();
    console.warn('[SteamSearch] Steam Store 获取精选游戏失败:', error.message);
    throw error;
  }
}

async function getFeaturedFromSteamSpy(): Promise<FeaturedGames> {
  checkAndResetStatus();
  if (!steamApiStatus.steamSpyAvailable) {
    throw new Error('SteamSpy API currently unavailable');
  }

  try {
    const response = await fetch(
      getSteamSpyUrl('?request=top100in2weeks'),
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      recordSteamSpyFailure();
      throw new Error(`SteamSpy API error: ${response.status}`);
    }

    const data = await response.json();
    const games = Object.values(data).map(g => steamSpyToGame(g as any));

    const onSale = games.filter(g => g.isOnSale).slice(0, 12);
    const topSellers = games.slice(0, 12);
    const newReleases = games.slice(0, 12);

    recordSuccess();
    console.info('[SteamSearch] 精选游戏数据来源: SteamSpy API');

    return {
      specials: onSale.length > 0 ? onSale : games.slice(0, 8),
      topSellers,
      newReleases,
    };
  } catch (error: any) {
    recordSteamSpyFailure();
    console.warn('[SteamSearch] SteamSpy 获取精选游戏失败:', error.message);
    throw error;
  }
}

function getFallbackFeaturedGames(): FeaturedGames {
  console.info('[SteamSearch] 精选游戏数据来源: Fallback数据');
  return {
    specials: FALLBACK_GAMES.filter(g => g.isOnSale).slice(0, 12),
    topSellers: FALLBACK_GAMES.slice(0, 12),
    newReleases: [...FALLBACK_GAMES].sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 12),
  };
}

export async function getFeaturedGames(): Promise<FeaturedGames> {
  try {
    return await getFeaturedFromStore();
  } catch {
    // fall through
  }

  try {
    return await getFeaturedFromSteamSpy();
  } catch {
    // fall through
  }

  return getFallbackFeaturedGames();
}

export function convertToGame(steamResult: SteamSearchResult, source: 'steam_import' | 'steam_search' = 'steam_search'): Game {
  return {
    id: `game-steam-${steamResult.appId}`,
    name: steamResult.name,
    description: steamResult.description || `${steamResult.name} - 来自Steam的优质游戏`,
    originalPrice: steamResult.originalPrice,
    salePrice: steamResult.price,
    discount: steamResult.discount,
    coverImage: steamResult.coverImage,
    tags: steamResult.tags.length > 0 ? steamResult.tags : [steamResult.genre || '动作'],
    genre: steamResult.genre || '动作',
    releaseYear: steamResult.releaseYear || new Date().getFullYear(),
    isOnSale: steamResult.isOnSale,
    steamAppId: steamResult.appId,
    steamRating: steamResult.steamRating,
    steamReviewCount: steamResult.steamReviewCount,
    steamReviewSummary: steamResult.steamReviewSummary,
    developers: steamResult.developers,
    publishers: steamResult.publishers,
    releaseDate: steamResult.releaseDate,
    detailedDescription: steamResult.detailedDescription,
    aboutTheGame: steamResult.aboutTheGame,
    screenshots: steamResult.screenshots,
    backgroundImage: steamResult.backgroundImage,
    platforms: steamResult.platforms,
    categories: steamResult.categories,
    genres: steamResult.genres,
    metacriticScore: steamResult.metascore ? parseInt(steamResult.metascore) : undefined,
    source,
    comingSoon: steamResult.comingSoon,
  };
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  rtime_last_played?: number;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  lastlogoff?: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamImportResult {
  player: SteamPlayerSummary | null;
  games: SteamOwnedGame[];
  totalGames: number;
  totalPlaytime: number;
}

export async function resolveSteamVanityUrl(vanityUrl: string): Promise<string | null> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY || '';
    if (!apiKey) {
      console.warn('[SteamImport] 未配置Steam API Key，无法解析Vanity URL');
      return null;
    }
    
    const response = await fetch(
      getSteamWebApiUrl(`/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`),
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.response?.success === 1 && data.response?.steamid) {
      return data.response.steamid;
    }
    
    return null;
  } catch (error) {
    console.error('解析Steam Vanity URL失败:', error);
    return null;
  }
}

export async function getSteamPlayerSummaries(steamId: string): Promise<SteamPlayerSummary | null> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY || '';
    if (!apiKey) {
      console.warn('[SteamImport] 未配置Steam API Key，无法获取玩家信息');
      throw new Error('未配置Steam API Key，请在.env文件中配置VITE_STEAM_API_KEY');
    }
    
    const response = await fetch(
      getSteamWebApiUrl(`/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`),
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`Steam API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const players = data.response?.players || [];
    if (players.length === 0) {
      throw new Error('未找到该Steam用户，请检查Steam ID是否正确');
    }
    return players[0] || null;
  } catch (error: any) {
    console.error('获取Steam玩家信息失败:', error);
    throw error;
  }
}

export async function getSteamOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
  try {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY || '';
    if (!apiKey) {
      console.warn('[SteamImport] 未配置Steam API Key，无法获取游戏库');
      throw new Error('未配置Steam API Key，请在.env文件中配置VITE_STEAM_API_KEY');
    }
    
    const response = await fetch(
      getSteamWebApiUrl(`/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`),
      { signal: AbortSignal.timeout(15000) }
    );
    
    if (!response.ok) {
      throw new Error(`Steam API错误: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.response?.games === undefined) {
      throw new Error('无法获取游戏库数据，请检查Steam ID是否正确或隐私设置');
    }
    return data.response?.games || [];
  } catch (error: any) {
    console.error('获取Steam游戏库失败:', error);
    throw error;
  }
}

export async function importSteamAccount(steamIdOrVanity: string): Promise<SteamImportResult> {
  let steamId = steamIdOrVanity.trim();
  
  if (!/^\d+$/.test(steamId)) {
    const resolved = await resolveSteamVanityUrl(steamId);
    if (resolved) {
      steamId = resolved;
    }
  }
  
  const [player, games] = await Promise.all([
    getSteamPlayerSummaries(steamId),
    getSteamOwnedGames(steamId),
  ]);
  
  const totalPlaytime = games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0);
  
  return {
    player,
    games,
    totalGames: games.length,
    totalPlaytime,
  };
}

export function steamOwnedGameToResult(game: SteamOwnedGame): SteamSearchResult {
  const appId = String(game.appid);
  return {
    appId,
    name: game.name,
    price: 0,
    originalPrice: 0,
    discount: 0,
    coverImage: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    description: '',
    tags: [],
    genre: '',
    releaseYear: 0,
    isOnSale: false,
    platforms: { windows: true, mac: false, linux: false },
    developers: [],
    publishers: [],
    categories: [],
    genres: [],
  };
}
