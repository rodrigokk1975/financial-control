import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
}

export function Badge({ className, color, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-white/10 bg-white/5 text-slate-200',
        className
      )}
      style={
        color
          ? {
              backgroundColor: `${color}1f`,
              borderColor: `${color}45`,
              color,
              ...style,
            }
          : style
      }
      {...props}
    />
  );
}
