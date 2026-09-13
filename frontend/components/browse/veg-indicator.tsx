/**
 * The standard Indian veg / non-veg mark: a bordered square containing a
 * filled circle (veg, green) or an upward triangle (non-veg, red).
 */
export function VegIndicator({
  isVeg,
  size = 16,
  className = '',
}: {
  isVeg: boolean;
  size?: number;
  className?: string;
}) {
  const color = isVeg ? '#1b7a45' : '#b91c1c';
  const inner = Math.round(size * 0.5);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-[3px] border-2 shrink-0 ${className}`}
      style={{ width: size, height: size, borderColor: color }}
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      title={isVeg ? 'Veg' : 'Non-veg'}
    >
      {isVeg ? (
        <span
          style={{ width: inner, height: inner, background: color, borderRadius: 9999 }}
        />
      ) : (
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${inner / 2}px solid transparent`,
            borderRight: `${inner / 2}px solid transparent`,
            borderBottom: `${inner}px solid ${color}`,
          }}
        />
      )}
    </span>
  );
}
