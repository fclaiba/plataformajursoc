import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function StarRating({ rating, onRatingChange, readonly = false, size = 'md', className }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <div className={cn("flex gap-1", className)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onRatingChange?.(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                    disabled={readonly}
                    className={cn(
                        "transition-all duration-200 focus:outline-none",
                        readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
                    )}
                >
                    <Star
                        className={cn(
                            sizes[size],
                            (hoverRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                : "text-slate-300 fill-slate-100"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
