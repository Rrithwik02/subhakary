export type ProviderSummary = {
  id: string;
  business_name: string;
  city: string | null;
  secondary_city?: string | null;
  service_cities?: string[] | null;
  description?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  base_price?: number | null;
  category_id?: string | null;
  service_type?: string | null;
  subcategory?: string | null;
  portfolio_images?: string[] | null;
  logo_url?: string | null;
  url_slug?: string | null;
  availability_status?: string | null;
};

export type ProviderSearchResult = ProviderSummary & {
  match_score: number;
  recommendation_reason: string;
  matched_services: string[];
  portfolio_thumbnail?: string | null;
};

