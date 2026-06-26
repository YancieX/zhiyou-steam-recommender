import { useState } from 'react';
import { Star, Clock, X } from 'lucide-react';

interface RatingModalProps {
  gameName: string;
  gameId: string;
  existingRating?: { score: number; playtimeHours: number };
  onSubmit: (score: number, playtimeHours: number) => void;
  onClose: () => void;
}

export default function RatingModal({ gameName, existingRating, onSubmit, onClose }: RatingModalProps) {
  const [score, setScore] = useState(existingRating?.score || 0);
  const [playtimeHours, setPlaytimeHours] = useState(existingRating?.playtimeHours || 0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score > 0) {
      onSubmit(score, playtimeHours);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-orbitron text-xl font-bold text-white">游戏评分</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-2">游戏</p>
          <p className="text-white font-semibold text-lg">{gameName}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              游戏评分
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                    star <= score
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-700/50 text-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              游玩时长（小时）
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              value={playtimeHours}
              onChange={e => setPlaytimeHours(Number(e.target.value))}
              className="input-field"
              placeholder="输入您的游玩时长"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={score === 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交评分
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
