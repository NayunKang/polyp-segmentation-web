import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-gray-200 bg-white shadow-sm',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`
        border-b border-gray-200 px-6 py-4
        dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
} 