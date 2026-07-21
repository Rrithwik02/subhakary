import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object | object[];
}

export const SEOHead = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  jsonLd
}: SEOHeadProps) => {
  const resolvedOgImage = ogImage || `${window.location.origin}/subhakary-og-image.png`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Primary meta tags
    updateMeta("description", description);
    if (keywords) updateMeta("keywords", keywords);

    // Open Graph
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:image", resolvedOgImage, true);
    updateMeta("og:image:width", "1200", true);
    updateMeta("og:image:height", "630", true);
    updateMeta("og:image:type", "image/png", true);
    updateMeta("og:image:alt", "Subhakary preview image", true);
    updateMeta("og:type", ogType, true);
    if (canonicalUrl) updateMeta("og:url", canonicalUrl, true);

    // Twitter
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", resolvedOgImage);
    updateMeta("twitter:image:alt", "Subhakary preview image");
    updateMeta("twitter:site", "@Subhakary");

    // Update canonical link
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Add JSON-LD structured data
    if (jsonLd) {
      // Remove existing dynamic JSON-LD
      const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
      existingScripts.forEach(script => script.remove());

      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach((schema, index) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", `true`);
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }

    // Cleanup on unmount
    return () => {
      const dynamicScripts = document.querySelectorAll('script[data-seo-jsonld]');
      dynamicScripts.forEach(script => script.remove());
    };
  }, [title, description, keywords, canonicalUrl, resolvedOgImage, ogType, jsonLd]);

  return null;
};

// Helper to generate Service schema
export const generateServiceSchema = (
  serviceName: string,
  serviceDescription: string,
  cityName?: string,
  stateName?: string
) => {
  const areaServed = cityName && stateName ? {
    "@type": "City",
    "name": cityName,
    "containedInPlace": {
      "@type": "State",
      "name": stateName,
      "containedInPlace": {
        "@type": "Country",
        "name": "India"
      }
    }
  } : {
    "@type": "Country",
    "name": "India"
  };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${serviceName}${cityName ? ` in ${cityName}` : ""}`,
    "description": serviceDescription,
    "provider": {
      "@type": "Organization",
      "name": "Subhakary",
      "url": "https://subhakary.com"
    },
    "areaServed": areaServed,
    "serviceType": serviceName
  };
};

// Helper to generate LocalBusiness schema for city pages
export const generateLocalBusinessSchema = (
  serviceName: string,
  cityName: string,
  stateName: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Subhakary - ${serviceName} in ${cityName}`,
    "description": `Find and book verified ${serviceName.toLowerCase()} services in ${cityName}, ${stateName}. Trusted professionals for weddings and events.`,
    "url": `https://subhakary.com/services/${serviceName.toLowerCase().replace(/\s+/g, "-")}/${cityName.toLowerCase().replace(/\s+/g, "-")}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": stateName,
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "100"
    }
  };
};

// Helper to generate BreadcrumbList schema
export const generateBreadcrumbSchema = (
  items: { name: string; url: string }[]
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};
