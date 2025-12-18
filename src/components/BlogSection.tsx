import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const BlogSection = () => {
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <section className="py-20 bg-cream">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl text-brown mb-4">
            Tradition & Culture Blog
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Discover the rich heritage of Indian traditions, wedding customs, and ceremonial
            practices. Get expert guidance on performing rituals, planning celebrations, and
            preserving cultural values.
          </p>
        </motion.div>

        {/* Featured Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="font-display text-2xl md:text-3xl text-brown text-center mb-10">
            Featured Articles
          </h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {featuredPosts.map((post) => (
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
        </motion.div>

        {/* Explore by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-16"
        >
          <h3 className="font-display text-2xl md:text-3xl text-brown mb-8">
            Explore by Category
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {blogCategories.map((category) => (
              <Link key={category} to={`/blog?category=${encodeURIComponent(category)}`}>
                <Button
                  variant="outline"
                  className="bg-background border-brown/10 hover:bg-brown hover:text-cream transition-all duration-300"
                >
                  {category}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-background/50 rounded-2xl p-10"
        >
          <h3 className="font-display text-2xl md:text-3xl text-brown mb-4">
            Stay Updated with Tradition
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Subscribe to our newsletter to receive the latest articles on Indian traditions, ceremony
            guides, and cultural insights directly in your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-brown/20 bg-background focus:outline-none focus:border-gold"
            />
            <Button className="bg-gold hover:bg-gold/90 text-brown px-8 rounded-full">
              Subscribe
            </Button>
          </div>
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link to="/blog">
            <Button
              variant="link"
              className="text-brown hover:text-gold text-lg font-display"
            >
              View All Articles
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
