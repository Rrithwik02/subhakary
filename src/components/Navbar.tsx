import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogOut, User, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
const navLinks = [{
  name: "Find Providers",
  href: "/providers"
}, {
  name: "About Us",
  href: "#about"
}, {
  name: "Services",
  href: "#services"
}, {
  name: "Blog",
  href: "/blog"
}, {
  name: "Contact",
  href: "#contact"
}];
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return <motion.nav initial={{
    y: -100,
    opacity: 0
  }} animate={{
    y: 0,
    opacity: 1
  }} transition={{
    duration: 0.6
  }} className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div className="glass-nav rounded-full px-4 lg:px-6 py-3 flex items-center justify-between gap-4 max-w-7xl w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="Subhakary" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map(link => link.href.startsWith("/") ? <Link key={link.name} to={link.href} className="text-sm font-medium hover:text-brown transition-colors duration-200 whitespace-nowrap">
                {link.name}
              </Link> : <a key={link.name} href={link.href} className="text-sm font-medium hover:text-brown transition-colors duration-200 whitespace-nowrap">
                {link.name}
              </a>)}
          <Link to="/my-bookings" className="flex items-center gap-2 text-sm font-medium hover:text-brown transition-colors duration-200 whitespace-nowrap">
            <Search className="w-4 h-4" />
            Track Booking
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
          {user ? <>
              <NotificationsCenter />
              <Link to="/chat">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/favorites">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="font-medium">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/become-provider">
                <Button variant="ghost" size="sm" className="font-medium">
                  Become a Provider
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="font-medium" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </> : <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="gold" size="sm" className="font-medium rounded-full px-5">
                  Join Us
                </Button>
              </Link>
            </>}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-foreground">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} transition={{
        duration: 0.2
      }} className="lg:hidden absolute top-full left-0 right-0 mt-2 mx-4 glass-nav rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => link.href.startsWith("/") ? <Link key={link.name} to={link.href} className="text-sm font-medium hover:text-brown transition-colors py-2" onClick={() => setIsOpen(false)}>
                  {link.name}
                </Link> : <a key={link.name} href={link.href} className="text-sm font-medium hover:text-brown transition-colors py-2" onClick={() => setIsOpen(false)}>
                  {link.name}
                </a>)}
              <Link to="/my-bookings" className="flex items-center gap-2 text-sm font-medium hover:text-brown py-2" onClick={() => setIsOpen(false)}>
                <Search className="w-4 h-4" />
                Track Booking
              </Link>
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                {user ? <>
                    <div className="flex items-center gap-2 pb-2">
                      <NotificationsCenter />
                      <Link to="/chat" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/favorites" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="icon">
                          <Heart className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                    <Link to="/profile" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Button>
                    </Link>
                    <Link to="/become-provider" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        Become Provider
                      </Button>
                    </Link>
                    <Button variant="gold" size="sm" className="w-full" onClick={() => {
                handleSignOut();
                setIsOpen(false);
              }}>
                      Sign Out
                    </Button>
                  </> : <>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="gold" size="sm" className="w-full">
                        Join Us
                      </Button>
                    </Link>
                  </>}
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </motion.nav>;
};