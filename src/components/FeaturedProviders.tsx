import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { Button } from "@/components/ui/button";

export const FeaturedProviders = () => {
  const navigate = useNavigate();
  const rail = useRef<HTMLDivElement>(null);
  const lastScrollBrowse = useRef(0);
  const [browses, setBrowses] = useState(0);
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["featured-providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("public_service_providers").select("id, business_name, city, description, rating, total_reviews, is_verified, logo_url, portfolio_images, url_slug, category:service_categories(name, slug)").eq("status", "approved").order("rating", { ascending: false }).limit(12);
      if (error) throw error;
      return data;
    },
  });
  const browse = (direction: 1 | -1) => {
    rail.current?.scrollBy({ left: direction * Math.min(360, rail.current.clientWidth * .8), behavior: "smooth" });
    setBrowses((value) => value + 1);
  };
  const onScroll = () => {
    const now = Date.now();
    if (now - lastScrollBrowse.current > 350) {
      lastScrollBrowse.current = now;
      setBrowses((value) => value + 1);
    }
  };
  if (!isLoading && providers.length === 0) return null;

  return <section className="bg-cream px-4 py-20"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brown/65">Featured providers</p><h2 className="mt-2 font-display text-3xl text-brown-dark sm:text-4xl">Top Rated Wedding Artisans &amp; Service Providers</h2></div><div className="hidden gap-2 sm:flex"><Button variant="outline" size="icon" aria-label="Previous providers" onClick={() => browse(-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Next providers" onClick={() => browse(1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    <div ref={rail} onScroll={onScroll} className="flex snap-x gap-5 overflow-x-auto pb-5 [scrollbar-width:thin]">{isLoading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[330px] w-[280px] shrink-0 animate-pulse rounded-2xl bg-muted" />) : providers.map((provider) => <article key={provider.id} className="w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="aspect-[16/10] bg-muted"><ProviderAvatar name={provider.business_name} logoUrl={provider.logo_url} sizeClassName="h-full w-full" className="rounded-none border-0" imageClassName="object-cover" fallbackClassName="rounded-none bg-muted text-4xl" /></div><div className="p-5"><div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="truncate">{provider.category?.name || "Service"}</span>{provider.is_verified && <span className="rounded-full bg-gold/10 px-2 py-1 font-semibold text-brown">Verified</span>}</div><h3 className="mt-3 line-clamp-2 font-display text-2xl leading-tight text-brown-dark">{provider.business_name}</h3><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gold" />{provider.city || "Location available"}</span>{provider.rating != null && <span className="flex items-center gap-1 font-semibold text-brown"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{provider.rating.toFixed(1)}{provider.total_reviews ? ` (${provider.total_reviews})` : ""}</span>}</div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{provider.description || ""}</p><Button variant="outline" className="mt-5 w-full border-brown/20" onClick={() => navigate(`/provider/${provider.url_slug || provider.id}`)}>View Details</Button></div></article>)}</div>
    {browses >= 2 && <div className="mt-2 text-center"><Button variant="gold" onClick={() => navigate("/providers?limit=20")}>View All Providers</Button></div>}
  </div></section>;
};
