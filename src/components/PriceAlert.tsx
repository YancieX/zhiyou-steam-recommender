import { TrendingDown, Bell } from 'lucide-react';

interface PriceAlertProps {
  gameName: string;
  originalPrice: number;
  currentPrice: number;
  onDismiss?: () => void;
}

export default function PriceAlert({ gameName, originalPrice, currentPrice, onDismiss }: PriceAlertProps) {
  const savings = originalPrice - currentPrice;
  const percentage = Math.round((savings / originalPrice) * 100);
  
  return (
    <div className="animate-price-drop glass-card rounded-xl p-4 border-2 border-red-500">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">价格下降提醒</span>
          </div>
          <h4 className="font-orbitron text-lg font-bold text-white mb-2">{gameName}</h4>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 line-through text-lg">¥{originalPrice.toFixed(2)}</span>
            <span className="text-2xl font-bold text-green-400">¥{currentPrice.toFixed(2)}</span>
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm font-semibold">
              省 ¥{savings.toFixed(2)} ({percentage}%)
            </span>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
