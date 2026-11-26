import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count, size = 18, light = false }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const rounded = Math.round(safeRating);

  return (
    <div
      className="star-row"
      role="img"
      aria-label={`Evidence rating ${safeRating.toFixed(1)} out of 5 stars${
        typeof count === 'number' ? ` based on ${count} evidence reports` : ''
      }`}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = index <= rounded;
        return (
          <Star
            key={index}
            size={size}
            fill={filled ? '#F59E0B' : 'none'}
            color={
              filled
                ? '#F59E0B'
                : light
                ? 'rgba(255, 255, 255, 0.35)'
                : '#CBD5E1'
            }
            strokeWidth={2}
            aria-hidden="true"
          />
        );
      })}
      <span
        className="star-score"
        style={{
          color: light ? '#FFFFFF' : 'var(--ink)',
          fontSize: size >= 20 ? '1.05rem' : '0.95rem',
        }}
      >
        {safeRating.toFixed(1)}
      </span>
      {typeof count === 'number' && (
        <span
          style={{
            fontSize: '0.86rem',
            marginLeft: '4px',
            color: light ? 'rgba(255, 255, 255, 0.82)' : 'var(--ink-muted)',
          }}
        >
          ({count} evidence reports)
        </span>
      )}
    </div>
  );
}