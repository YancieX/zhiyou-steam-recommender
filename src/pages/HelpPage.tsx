import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Gamepad2,
  Search,
  Heart,
  Star,
  Download,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqCategories = [
  {
    title: '快速开始',
    icon: Gamepad2,
    items: [
      {
        question: '智荐优游是什么？',
        answer: '智荐优游是一款基于协同过滤算法的Steam游戏促销个性化推荐与愿望单降价提醒系统。它可以根据您的游戏偏好，为您推荐正在促销的游戏，并在愿望单游戏降价时提醒您。',
      },
      {
        question: '如何开始使用？',
        answer: '注册账号后，您可以通过"搜索游戏"页面搜索Steam上的游戏，将游戏添加到您的游戏库中，或者通过"导入Steam账号"功能一键导入您的Steam游戏库。评分您玩过的游戏后，AI将为您生成个性化推荐。',
      },
      {
        question: '为什么要导入Steam账号？',
        answer: '导入Steam账号可以自动同步您的游戏库、游玩时长等数据，让AI推荐更加精准。您的Steam数据仅用于游戏推荐，不会被用于其他用途。',
      },
    ],
  },
  {
    title: '游戏搜索与管理',
    icon: Search,
    items: [
      {
        question: '如何搜索Steam游戏？',
        answer: '点击顶部导航栏的"搜索游戏"，在搜索框中输入游戏名称，点击搜索按钮即可搜索Steam上的游戏。点击"查看详情"可以查看游戏的详细信息，点击"导入游戏"可以将游戏添加到您的游戏库中。',
      },
      {
        question: '搜索不到想要的游戏怎么办？',
        answer: '请尝试使用英文名称搜索，或检查拼写是否正确。Steam游戏库非常庞大，部分冷门游戏可能搜索结果不准确。如果Steam API暂时不可用，系统会使用缓存数据。',
      },
      {
        question: '如何删除已添加的游戏？',
        answer: '进入"个人账号"页面，在游戏库列表中找到想要删除的游戏，点击右侧的删除按钮（垃圾桶图标），确认后即可删除该游戏及其相关数据。',
      },
    ],
  },
  {
    title: '评分与推荐',
    icon: Star,
    items: [
      {
        question: '为什么要给游戏评分？',
        answer: '您的评分是AI推荐的重要依据。评分越多越准确，AI就越能了解您的游戏偏好，为您推荐更符合口味的游戏。',
      },
      {
        question: 'AI推荐是如何工作的？',
        answer: '系统使用协同过滤算法，分析您的游戏评分和偏好，与其他用户的游戏库进行匹配，找出与您口味相似的用户，然后推荐他们喜欢但您还没玩过的游戏。',
      },
      {
        question: '为什么推荐的游戏都是促销中的？',
        answer: '系统默认优先推荐正在促销的游戏，帮助您在打折时买到喜欢的游戏。如果当前没有促销游戏与您的偏好匹配，也会推荐非促销游戏。',
      },
    ],
  },
  {
    title: '愿望单与降价提醒',
    icon: Heart,
    items: [
      {
        question: '如何添加愿望单？',
        answer: '在游戏详情页点击"加入愿望单"按钮，即可将游戏添加到您的愿望单中。您可以在"愿望单"页面查看所有愿望单游戏。',
      },
      {
        question: '降价提醒是如何工作的？',
        answer: '系统每天会同步Steam上的游戏价格（GMT 0时更新），当您愿望单中的游戏降价时，会在愿望单页面显示降价提示，帮助您及时入手心仪的游戏。',
      },
    ],
  },
  {
    title: '数据与账号',
    icon: Download,
    items: [
      {
        question: '我的数据保存在哪里？',
        answer: '您的数据保存在浏览器的本地存储中，不会上传到服务器。这意味着您的数据只在当前设备上可用，更换设备需要重新导入。',
      },
      {
        question: '导入的Steam数据安全吗？',
        answer: '安全。我们只读取Steam公开的游戏库和游玩时长数据，不需要您的Steam密码。所有数据仅用于本地推荐计算。',
      },
      {
        question: '如何删除我的账号？',
        answer: '进入"设置"页面，点击"删除账号"按钮，按照提示操作即可。删除后所有数据将被永久清除，无法恢复。',
      },
    ],
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white mb-2">帮助中心</h1>
          <p className="text-gray-400">了解智荐优游的全部功能和使用方法</p>
        </div>

        <div className="space-y-8">
          {faqCategories.map(category => (
            <div key={category.title} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="font-semibold text-white text-lg">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item, index) => {
                  const key = `${category.title}-${index}`;
                  const isOpen = openItems[key];
                  return (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.07] transition-colors"
                      >
                        <span className="text-white font-medium">{item.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1">
                          <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 glass-card rounded-2xl p-8 text-center border border-purple-500/20">
          <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-purple-400" />
          </div>
          <h3 className="font-orbitron text-xl font-bold text-white mb-2">开启您的游戏发现之旅</h3>
          <p className="text-gray-400 mb-6">
            还有其他问题？先试试搜索和导入您喜欢的游戏吧！
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/search')}
              className="btn-primary"
            >
              <Search className="w-4 h-4 inline mr-2" />
              搜索游戏
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
