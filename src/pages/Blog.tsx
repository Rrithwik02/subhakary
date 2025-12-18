import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { blogPosts, blogCategories } from "@/data/blogData";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const selectedCategory = searchParams.get("category") || "";

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory = selectedCategory
        ? post.category === selectedCategory
        : true;
      const matchesSearch = searchQuery
        ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (category: string) => {
    if (category === selectedCategory) {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl text-brown mb-4"
          >
            Tradition & Culture Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Discover the rich heritage of Indian traditions, wedding customs, and ceremonial
            practices. Get expert guidance on performing rituals, planning celebrations, and
            preserving cultural values.
          </motion.p>
        </div>
      </section>

      {/* Search and Categories */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 rounded-full border-brown/20"
              />
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <h3 className="font-display text-2xl text-brown mb-6">Explore by Category</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleCategoryClick("")}
                className={`transition-all duration-300 ${
                  !selectedCategory
                    ? "bg-brown text-cream"
                    : "bg-background border-brown/10 hover:bg-brown hover:text-cream"
                }`}
              >
                All
              </Button>
              {blogCategories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => handleCategoryClick(category)}
                  className={`transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-brown text-cream"
                      : "bg-background border-brown/10 hover:bg-brown hover:text-cream"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl text-brown text-center mb-12"
          >
            {selectedCategory ? `${selectedCategory} Articles` : "Featured Articles"}
          </motion.h2>

          {filteredPosts.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-lg"
            >
              No articles found. Try a different search or category.
            </motion.p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-3 gap-8"
            >
              {filteredPosts.map((post) => (
                <motion.article
                  key={post.id}
                  variants={itemVariants}
                  className="bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-gold/20 to-brown/20 flex items-center justify-center">
                    <span className="text-6xl">
                      {post.category === "Wedding Traditions" && "💒"}
                      {post.category === "Home Ceremonies" && "🏠"}
                      {post.category === "Beauty & Style" && "💄"}
                      {post.category === "Photography Tips" && "📸"}
                      {post.category === "Catering Ideas" && "🍽️"}
                      {post.category === "Decoration Trends" && "🎊"}
                      {post.category === "Festival Celebrations" && "🪔"}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-gold/10 text-brown border-gold/30">
                        {post.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>

                    <h4 className="font-display text-xl text-brown mb-2 line-clamp-2 hover:text-gold transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h4>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>

                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <Link to={`/blog/${post.slug}`}>
                      <Button
                        variant="outline"
                        className="w-full border-brown/20 hover:bg-brown hover:text-cream"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h3 className="font-display text-3xl text-brown mb-4">
              Stay Updated with Tradition
            </h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter to receive the latest articles on Indian traditions,
              ceremony guides, and cultural insights directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full border border-brown/20 bg-cream focus:outline-none focus:border-gold"
              />
              <Button className="bg-gold hover:bg-gold/90 text-brown px-8 rounded-full">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Blog;
