// Generates public/sitemap.xml.
//
// IMPORTANT: /services/:service/:city pages are only included here when at
// least one *approved* provider actually serves that service+city combo in
// the database. Previously this script cross-multiplied every service by
// every city (10 x 39 = 390 URLs) regardless of real coverage, indexing
// hundreds of "Best X in Y" pages that had zero providers and would show an
// empty state — exactly the thin-content pattern search engines and AI
// answer engines penalize. /services/:service (one page per service,
// aggregating all cities) stays indexed unconditionally since it's always a
// legitimate, useful page regardless of current city-level density.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional locally (e.g. CI supplies real env vars directly)
}

const siteUrl = "https://www.subhakary.com";
const outputPath = path.resolve("public", "sitemap.xml");
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/planning-os", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/become-provider", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms-of-service", changefreq: "monthly", priority: "0.5" },
  { path: "/install", changefreq: "monthly", priority: "0.6" },
];

// slug -> service_categories.slug (see src/data/seoData.ts `categorySlug`)
const services = [
  { slug: "poojari", categorySlug: "poojari" },
  { slug: "photographer", categorySlug: "photography" },
  { slug: "videographer", categorySlug: "videography" },
  { slug: "makeup-artist", categorySlug: "makeup" },
  { slug: "mehandi-artist", categorySlug: "mehandi" },
  { slug: "mangala-vadyam", categorySlug: "mangala-vadyam" },
  { slug: "decoration", categorySlug: "decoration" },
  { slug: "catering", categorySlug: "catering" },
  { slug: "function-halls", categorySlug: "function-halls" },
  { slug: "event-managers", categorySlug: "event-managers" },
];

const blogPosts = [
  "timeless-indian-wedding-traditions",
  "essential-indian-home-ceremonies",
  "indian-wedding-beauty-style-guide",
  "top-wedding-photography-tips",
  "top-7-wedding-catering-ideas-2025",
  "10-stunning-wedding-decoration-trends-2025",
  "celebrate-indian-festivals-in-style",
];

const slugify = (value) => value.toLowerCase().replace(/\s+/g, "-");

async function getRealServiceCityCombos() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — skipping " +
      "service+city sitemap URLs (only static + per-service pages will be emitted)."
    );
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  // public_service_providers is the anonymous-safe view (already pre-filtered
  // to approved providers) — the base service_providers table is RLS-locked
  // to logged-in users, so a raw anon-key query against it returns nothing.
  const { data, error } = await supabase
    .from("public_service_providers")
    .select("city, secondary_city, service_cities, service_categories!inner(slug)");

  if (error) {
    console.warn("Could not fetch providers for sitemap — falling back to static pages only:", error.message);
    return [];
  }

  const combos = new Set();
  for (const row of data ?? []) {
    const categorySlug = row.service_categories?.slug;
    const service = services.find((s) => s.categorySlug === categorySlug);
    if (!service) continue;

    const cities = [row.city, row.secondary_city, ...(row.service_cities ?? [])].filter(Boolean);
    for (const city of cities) {
      combos.add(`${service.slug}|${city}`);
    }
  }

  return Array.from(combos).map((key) => {
    const [service, city] = key.split("|");
    return { service, city };
  });
}

const realCombos = await getRealServiceCityCombos();

const urls = [
  ...staticPages.map((page) => ({
    loc: `${siteUrl}${page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: today,
  })),
  ...services.map((service) => ({
    loc: `${siteUrl}/services/${service.slug}`,
    changefreq: "weekly",
    priority: "0.9",
    lastmod: today,
  })),
  ...blogPosts.map((slug) => ({
    loc: `${siteUrl}/blog/${slug}`,
    changefreq: "monthly",
    priority: "0.8",
    lastmod: today,
  })),
  ...realCombos.map(({ service, city }) => ({
    loc: `${siteUrl}/services/${service}/${slugify(city)}`,
    changefreq: "weekly",
    priority: "0.75",
    lastmod: today,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Wrote ${urls.length} URLs to ${outputPath} (${realCombos.length} real service+city pages).`);
