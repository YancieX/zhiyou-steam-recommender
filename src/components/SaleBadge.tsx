import type { Game } from '../data/mockData';
import { Percent, Tag } from 'lucide-react';

interface SaleBadgeProps {
  game: Game;
  className?: string;
}

export default function SaleBadge({ game, className = '' }: SaleBadgeProps) {
  if (!game.isOnSale) return null;
  
  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold ${className}`}>
      <Percent className="w-4 h-4" />
      <span>-{game.discount}%</span>
    </div>
  );
}

interface GenreBadgeProps {
  genre: string;
  className?: string;
}

export function GenreBadge({ genre, className = '' }: GenreBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-full text-sm ${className}`}>
      <Tag className="w-4 h-4" />
      <span>{genre}</span>
    </div>
  );
}
