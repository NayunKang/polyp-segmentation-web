import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";

interface MetricCardProps {
  title: string;
  value: number;
  className?: string;
}

export function MetricCard({ title, value, className = "" }: MetricCardProps) {
  // Convert value to percentage and round to 2 decimal places
  const percentage = (value * 100).toFixed(2);
  
  // Determine badge variant based on value
  const getBadgeVariant = (value: number): "default" | "secondary" | "destructive" | "outline" => {
    if (value >= 0.8) return "default";  // success -> default
    if (value >= 0.6) return "secondary";  // warning -> secondary
    return "destructive";  // error -> destructive
  };

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </h3>
          <Badge variant={getBadgeVariant(value)}>
            {percentage}%
          </Badge>
        </div>
        <p className="mt-2 text-3xl font-semibold">
          {value.toFixed(3)}
        </p>
      </CardContent>
    </Card>
  );
} 