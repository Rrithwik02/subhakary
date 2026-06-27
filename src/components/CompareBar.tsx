import { motion, AnimatePresence } from "framer-motion";
import { X, Scale, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProviderComparison } from "@/hooks/useProviderComparison";

export const CompareBar = () => {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare, showCompareBar, setShowCompareBar } = useProviderComparison();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      {showCompareBar && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg safe-area-bottom"
        >
          <div className="container max-w-4xl mx-auto p-3 md:p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Provider avatars */}
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mr-2 flex-shrink-0">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare</span>
                  <span className="text-primary">({compareList.length}/3)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {compareList.map((provider) => (
                    <div
                      key={provider.id}
                      className="relative group flex-shrink-0"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted border-2 border-primary/20 overflow-hidden">
                        {provider.logo_url ? (
                          <img
                            src={provider.logo_url}
                            alt={provider.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            {provider.category?.icon || "👤"}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCompare(provider.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap max-w-[60px] truncate hidden md:block">
                        {provider.business_name}
                      </span>
                    </div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-muted-foreground/50 text-xs">+</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompare}
                  className="text-muted-foreground h-8 px-2"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  disabled={compareList.length < 2}
                  onClick={() => navigate("/compare")}
                  className="gradient-gold text-primary-foreground h-8 px-3"
                >
                  Compare Now
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCompareBar(false)}
                  className="h-8 w-8 md:hidden"
                >
                  <ChevronUp className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
