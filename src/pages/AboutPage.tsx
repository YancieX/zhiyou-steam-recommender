import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Gamepad2, Heart, Star, Shield, Zap, Users, Code } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Gamepad2,
      title: 'Steam游戏库',
      description: '搜索并导入Steam上所有游戏，获取实时价格和促销信息',
    },
    {
      icon: Star,
      title: '智能推荐',
      description: '基于协同过滤算法，根据您的游戏偏好精准推荐',
    },
    {
      icon: Heart,
      title: '愿望单降价提醒',
      description: '愿望单游戏降价时第一时间通知，不错过任何优惠',
    },
    {
      icon: Zap,
      title: '实时价格同步',
      description: '每日GMT 0时自动同步Steam最新价格数据',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-orbitron text-4xl font-bold text-gradient mb-4">智荐优游</h1>
          <p className="text-xl text-gray-300 mb-2">基于协同过滤的Steam游戏促销个性化推荐系统</p>
          <p className="text-gray-500">版本 2.0.0</p>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-12">
          <h2 className="font-orbitron text-2xl font-bold text-white mb-6 text-center">产品简介</h2>
          <div className="text-gray-300 space-y-4 leading-relaxed">
            <p>
              智荐优游是一款专为Steam玩家打造的游戏推荐与价格追踪工具。我们深知游戏玩家面对Steam海量游戏时选择困难，
              以及总是错过心仪游戏促销的痛点。
            </p>
            <p>
              通过先进的协同过滤推荐算法，智荐优游能够根据您的游戏喜好，从正在促销的游戏中精准筛选出最适合您的作品，
              让每一笔消费都物超所值。
            </p>
            <p>
              同时，愿望单降价提醒功能会在您关注的游戏降价时第一时间通知您，
              确保您不会错过任何一次入手好游戏的机会。
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="font-orbitron text-2xl font-bold text-white mb-8 text-center">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(feature => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover:border-purple-500/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-12 border border-cyan-500/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="font-orbitron text-2xl font-bold text-white">开发团队</h2>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-4 text-3xl font-bold text-white">
              Y
            </div>
            <h3 className="text-xl font-bold text-white mb-1">YancieX</h3>
            <p className="text-purple-400 mb-3">独立开发者</p>
            <p className="text-gray-400 text-center max-w-md">
              热爱游戏与技术的全栈开发者，致力于用代码为玩家创造更好的游戏体验。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">隐私保护</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              您的所有数据仅保存在本地浏览器中，不会上传到任何服务器。
              我们不需要您的Steam账号密码，只读取公开的游戏库数据。
            </p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">开源项目</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              本项目基于 React + TypeScript + TailwindCSS 构建，
              使用 Zustand 状态管理和 Steam Store API 获取游戏数据。
            </p>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 智荐优游 - 由 YancieX 开发</p>
          <p className="mt-1">本项目仅供学习交流使用，游戏数据版权归Steam及各游戏开发商所有</p>
        </div>
      </div>
    </div>
  );
}
