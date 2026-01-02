import { createContext, useContext, useState, ReactNode } from "react";

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

interface ComparisonContextType {
  compareList: Provider[];
  addToCompare: (provider: Provider) => boolean;
  removeFromCompare: (providerId: string) => void;
  clearCompare: () => void;
  isInCompare: (providerId: string) => boolean;
  canAddMore: boolean;
  showCompareBar: boolean;
  setShowCompareBar: (show: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

const MAX_COMPARE = 3;

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [compareList, setCompareList] = useState<Provider[]>([]);
  const [showCompareBar, setShowCompareBar] = useState(false);

  const addToCompare = (provider: Provider): boolean => {
    if (compareList.length >= MAX_COMPARE) {
      return false;
    }
    if (compareList.some(p => p.id === provider.id)) {
      return false;
    }
    setCompareList(prev => [...prev, provider]);
    setShowCompareBar(true);
    return true;
  };

  const removeFromCompare = (providerId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== providerId));
  };

  const clearCompare = () => {
    setCompareList([]);
    setShowCompareBar(false);
  };

  const isInCompare = (providerId: string) => {
    return compareList.some(p => p.id === providerId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore: compareList.length < MAX_COMPARE,
        showCompareBar,
        setShowCompareBar,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useProviderComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useProviderComparison must be used within ComparisonProvider");
  }
  return context;
};
