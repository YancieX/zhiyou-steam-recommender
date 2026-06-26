import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../data/mockData';
import { Heart, Star, Clock, ShoppingCart, ImageOff } from 'lucide-react';
import { proxyImage, proxyImageFallback } from '../utils/steamSearch';

interface GameCardProps {
  game: Game;
  onPurchase?: () => void;
  onAddToWishlist?: () => void;
  isInWishlist?: boolean;
  showPurchaseButton?: boolean;
}

export default function GameCard({
  game,
  onPurchase,
  onAddToWishlist,
  isInWishlist = false,
  showPurchaseButton = false,
}: GameCardProps) {
  const [imgError, setImgError] = useState(0);
  
  const handleImgError = () => {
    if (imgError === 0) {
      setImgError(1);
    } else if (imgError === 1) {
      setImgError(2);
    }
  };
  
  const handleImageClick = () => {
    if (imgError > 0 && imgError < 2) {
      setImgError(prev => prev - 1);
    }
  };
  
  const getImageSrc = () => {
    if (!game.coverImage) return '';
    if (imgError === 0) return proxyImage(game.coverImage);
    if (imgError === 1) return proxyImageFallback(game.coverImage);
    return '';
  };

  return (
    <div className="game-card glass-card rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-slate-800/50">
        {imgError < 2 ? (
          <img
            src={getImageSrc()}
            alt={game.name}
            className={`w-full h-full object-cover ${imgError > 0 ? 'cursor-pointer opacity-80 hover:opacity-100' : ''}`}
            loading="lazy"
            onError={handleImgError}
            onClick={handleImageClick}
            title={imgError > 0 ? '点击重新加载图片' : ''}
          />
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:text-gray-400 transition-colors"
            onClick={() => setImgError(0)}
          >
            <ImageOff className="w-10 h-10 mb-2" />
            <span className="text-xs">暂无图片</span>
            <span className="text-xs mt-1 text-cyan-400">点击重试</span>
          </div>
        )}
        {game.isOnSale && (
          <div className="sale-badge">
            -{game.discount}%
          </div>
        )}
        {isInWishlist && (
          <div className="absolute top-0.75rem left-0.75rem w-8 h-8 bg-pink-500/80 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-current" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <Link to={`/game/${game.id}`}>
          <h3 className="font-orbitron text-lg font-semibold text-white hover:text-purple-400 transition-colors mb-2 line-clamp-1">
            {game.name}
          </h3>
        </Link>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {game.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
          {game.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{game.releaseYear}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.isOnSale ? (
              <>
                <span className="text-2xl font-bold text-white">¥{game.salePrice.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">¥{game.originalPrice.toFixed(2)}</span>
              </>
            ) : game.originalPrice > 0 ? (
              <span className="text-xl font-bold text-white">¥{game.originalPrice.toFixed(2)}</span>
            ) : (
              <span className="text-xl font-bold text-green-400">免费</span>
            )}
          </div>
          
          {showPurchaseButton && onPurchase && (
            <button
              onClick={onPurchase}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" />
              购买
            </button>
          )}
          
          {onAddToWishlist && !showPurchaseButton && (
            <button
              onClick={onAddToWishlist}
              className={`p-2 rounded-lg transition-colors ${
                isInWishlist
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-gray-700/50 text-gray-400 hover:text-pink-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
