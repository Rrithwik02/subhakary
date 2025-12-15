import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "About Us", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Blog", href: "#blog" },
  { name: "Contact", href: "#contact" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-4 left-4 right-4 z-50 flex justify-center"
    >
      <div className="glass-nav rounded-full px-4 lg:px-6 py-3 flex items-center justify-between gap-4 max-w-7xl w-full">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
            <Flame className="w-5 h-5 text-brown-dark" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg lg:text-xl font-semibold tracking-wide text-foreground">
              SUBHAKARY
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 tracking-widest">
              शुभकार्य
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors duration-200 whitespace-nowrap"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#track"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors duration-200 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            Track Booking
          </a>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" className="font-medium">
            Sign In
          </Button>
          <Button variant="gold" size="sm" className="font-medium rounded-full px-5">
            Join Us
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-foreground"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-2 glass-nav rounded-2xl p-4"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#track"
                className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary py-2"
              >
                <Search className="w-4 h-4" />
                Track Booking
              </a>
              <div className="flex gap-3 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1">
                  Sign In
                </Button>
                <Button variant="gold" size="sm" className="flex-1">
                  Join Us
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
