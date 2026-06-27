import { cn } from "@/lib/utils";

type AvailabilityStatus = 'online' | 'offline' | 'busy' | null | undefined;

interface AvailabilityStatusBadgeProps {
  status: AvailabilityStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    label: 'Online',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/30',
  },
  offline: {
    label: 'Offline',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-500/30',
  },
  busy: {
    label: 'Busy',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
  },
};

export const AvailabilityStatusBadge = ({ 
  status, 
  size = 'md',
  showLabel = true,
  className 
}: AvailabilityStatusBadgeProps) => {
  const normalizedStatus = status || 'offline';
  const config = statusConfig[normalizedStatus];
  
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        config.bgColor,
        config.borderColor,
        padding,
        className
      )}
    >
      <span 
        className={cn(
          "rounded-full animate-pulse",
          config.dotColor,
          dotSize
        )} 
      />
      {showLabel && (
        <span className={cn("font-medium", config.textColor, textSize)}>
          {config.label}
        </span>
      )}
    </div>
  );
};
