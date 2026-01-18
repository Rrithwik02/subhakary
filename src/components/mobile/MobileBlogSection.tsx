import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { blogPosts } from "@/data/blogData";

export const MobileBlogSection = () => {
  const navigate = useNavigate();
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Inspiration & Trends
        </h2>
        <button
          onClick={() => navigate("/blog")}
          className="text-xs font-medium text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {featuredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/blog/${post.id}`)}
            className="flex-shrink-0 w-48 bg-card rounded-xl overflow-hidden border border-border/50 touch-active"
          >
            <div className="h-28 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                {post.title}
              </h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
