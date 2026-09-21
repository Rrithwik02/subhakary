import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Clock, Search } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { blogCategories, blogPosts } from "@/data/blogData";

const Blog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const selectedCategory = searchParams.get("category") || "";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const posts = useMemo(() => blogPosts.filter((post) => (!selectedCategory || post.category === selectedCategory) && (!searchQuery || `${post.title} ${post.excerpt}`.toLowerCase().includes(searchQuery.toLowerCase()))), [searchQuery, selectedCategory]);
  const feature = posts[0];
  const rest = posts.slice(1);
  const chooseCategory = (category: string) => setSearchParams(category ? { category } : {});

  return <main className="min-h-screen bg-cream"><Navbar />
    <section className="border-b border-gold/10 bg-[linear-gradient(180deg,rgba(255,255,255,.45),transparent)] pb-10 pt-32"><div className="container mx-auto px-4"><button type="button" onClick={() => navigate("/")} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-brown hover:text-gold"><ArrowLeft className="h-4 w-4" />Back to Home</button>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-brown/60">The Subhakary Journal</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end"><div><h1 className="max-w-4xl font-display text-4xl leading-[.95] text-brown-dark sm:text-5xl md:text-6xl">Tradition &amp; Culture Blog</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Discover the rich heritage of Indian traditions, wedding customs, and ceremonial practices. Get expert guidance on performing rituals, planning celebrations, and preserving cultural values.</p></div><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search articles..." className="h-12 rounded-xl border-brown/15 bg-white pl-10" /></div></div>
      <div className="mt-7 flex gap-2 overflow-x-auto pb-1"><button onClick={() => chooseCategory("")} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${!selectedCategory ? "bg-brown text-cream" : "border border-brown/15 bg-white text-brown"}`}>All Articles</button>{blogCategories.map((category) => <button key={category} onClick={() => chooseCategory(category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${selectedCategory === category ? "bg-brown text-cream" : "border border-brown/15 bg-white text-brown"}`}>{category}</button>)}</div>
    </div></section>
    <section className="px-4 py-12"><div className="mx-auto max-w-7xl">{feature ? <>
      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-2"><Link to={`/blog/${feature.slug}`} className="min-h-[280px] overflow-hidden"><img src={feature.image} alt={feature.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" /></Link><div className="flex flex-col justify-center p-7 sm:p-10"><span className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">{feature.category}</span><h2 className="font-display text-3xl leading-tight text-brown-dark sm:text-4xl"><Link to={`/blog/${feature.slug}`}>{feature.title}</Link></h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.excerpt}</p><div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{feature.date}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{feature.readTime}</span></div><Link to={`/blog/${feature.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brown hover:text-gold">Read article <ArrowRight className="h-4 w-4" /></Link></div></motion.article>
      <div className="mt-14 flex items-end justify-between border-b border-border pb-4"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-brown/60">The editorial collection</p><h2 className="mt-2 font-display text-3xl text-brown-dark">Featured Articles</h2></div><span className="text-xs text-muted-foreground">{posts.length} article{posts.length === 1 ? "" : "s"}</span></div>
      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((post, index) => <motion.article key={post.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .04 }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden"><img src={post.image} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link><div className="p-5"><div className="flex items-center justify-between text-xs text-muted-foreground"><span className="font-semibold text-gold">{post.category}</span><span>{post.readTime}</span></div><h3 className="mt-3 font-display text-2xl leading-tight text-brown-dark"><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs"><span className="text-muted-foreground">{post.date}</span><Link to={`/blog/${post.slug}`} className="font-semibold text-brown">Read more</Link></div></div></motion.article>)}</div>
    </> : <div className="py-20 text-center text-muted-foreground">No articles found. Try a different search or category.</div>}</div></section>
    <Footer />
  </main>;
};

export default Blog;
