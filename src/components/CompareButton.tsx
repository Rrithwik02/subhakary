import { Scale, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProviderComparison } from "@/hooks/useProviderComparison";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  business_name: string;
  logo_url?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  base_price?: number | null;
  experience_years?: number | null;
  city?: string | null;
  description?: string | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  specializations?: string[] | null;
  languages?: string[] | null;
  category?: { name: string; icon?: string } | null;
  subcategory?: string | null;
}

interface CompareButtonProps {
  provider: Provider;
  variant?: "icon" | "button";
  className?: string;
}

export const CompareButton = ({ provider, variant = "icon", className }: CompareButtonProps) => {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useProviderComparison();
  const { toast } = useToast();
  const inCompare = isInCompare(provider.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(provider.id);
      toast({
        title: "Removed from comparison",
        description: `${provider.business_name} removed`,
      });
    } else {
      if (!canAddMore) {
        toast({
          title: "Comparison limit reached",
          description: "You can compare up to 3 providers at a time",
          variant: "destructive",
        });
        return;
      }
      const added = addToCompare(provider);
      if (added) {
        toast({
          title: "Added to comparison",
          description: `${provider.business_name} added`,
        });
      }
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant={inCompare ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-all",
          inCompare && "bg-primary text-primary-foreground",
          className
        )}
        onClick={handleClick}
        title={inCompare ? "Remove from compare" : "Add to compare"}
      >
        {inCompare ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button
      variant={inCompare ? "default" : "outline"}
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={handleClick}
    >
      {inCompare ? <Check className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
      {inCompare ? "In Compare" : "Compare"}
    </Button>
  );
};
