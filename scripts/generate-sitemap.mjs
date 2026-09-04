import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://subhakary.com";
const outputPath = path.resolve("public", "sitemap.xml");
const today = "2026-09-04";

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

const services = [
  "poojari",
  "photographer",
  "videographer",
  "makeup-artist",
  "mehandi-artist",
  "mangala-vadyam",
  "decoration",
  "catering",
  "function-halls",
  "event-managers",
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

const cities = [
  { name: "Hyderabad", priority: 1 },
  { name: "Bengaluru", priority: 1 },
  { name: "Chennai", priority: 1 },
  { name: "Mumbai", priority: 1 },
  { name: "New Delhi", priority: 1 },
  { name: "Kolkata", priority: 1 },
  { name: "Pune", priority: 1 },
  { name: "Ahmedabad", priority: 1 },
  { name: "Vijayawada", priority: 2 },
  { name: "Visakhapatnam", priority: 2 },
  { name: "Jaipur", priority: 2 },
  { name: "Lucknow", priority: 2 },
  { name: "Kochi", priority: 2 },
  { name: "Coimbatore", priority: 2 },
  { name: "Indore", priority: 2 },
  { name: "Nagpur", priority: 2 },
  { name: "Surat", priority: 2 },
  { name: "Vadodara", priority: 2 },
  { name: "Patna", priority: 2 },
  { name: "Bhopal", priority: 2 },
  { name: "Warangal", priority: 3 },
  { name: "Guntur", priority: 3 },
  { name: "Tirupati", priority: 3 },
  { name: "Nellore", priority: 3 },
  { name: "Rajahmundry", priority: 3 },
  { name: "Madurai", priority: 3 },
  { name: "Mysore", priority: 3 },
  { name: "Mangalore", priority: 3 },
  { name: "Thiruvananthapuram", priority: 3 },
  { name: "Nashik", priority: 3 },
  { name: "Kanpur", priority: 3 },
  { name: "Varanasi", priority: 3 },
  { name: "Agra", priority: 3 },
  { name: "Amritsar", priority: 3 },
  { name: "Ludhiana", priority: 3 },
  { name: "Ranchi", priority: 3 },
  { name: "Bhubaneswar", priority: 3 },
  { name: "Guwahati", priority: 3 },
  { name: "Chandigarh", priority: 3 },
  { name: "Dehradun", priority: 3 },
];

const slugify = (value) => value.toLowerCase().replace(/\s+/g, "-");

const urls = [
  ...staticPages.map((page) => ({
    loc: `${siteUrl}${page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
    lastmod: today,
  })),
  ...services.map((service) => ({
    loc: `${siteUrl}/services/${service}`,
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
  ...services.flatMap((service) =>
    cities.map((city) => ({
      loc: `${siteUrl}/services/${service}/${slugify(city.name)}`,
      changefreq: "weekly",
      priority: city.priority === 1 ? "0.8" : "0.7",
      lastmod: today,
    })),
  ),
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
console.log(`Wrote ${urls.length} URLs to ${outputPath}`);
