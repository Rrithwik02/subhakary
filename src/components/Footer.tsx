import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-white.png";

const footerLinks = {
  services: [
    { label: "Poojari / Priest", href: "/services/poojari" },
    { label: "Photography", href: "/services/photographer" },
    { label: "Makeup Artist", href: "/services/makeup-artist" },
    { label: "Mehandi", href: "/services/mehandi-artist" },
    { label: "Decoration", href: "/services/decoration" },
    { label: "Catering", href: "/services/catering" },
    { label: "Function Halls", href: "/services/function-halls" },
    { label: "Event Managers", href: "/services/event-managers" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/about" },
    { label: "Become a Provider", href: "/become-provider" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-brown-dark text-cream/90">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Subhakary" className="h-14 w-auto" />
            </Link>
            <p className="text-cream/70 mb-6 max-w-sm">
              India's most trusted platform for booking traditional and cultural
              services. Making sacred ceremonies accessible to everyone.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Hyderabad, Telangana, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gold" />
                <span>+91 99999 99999</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gold" />
                <span>contact@subhakary.com</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream mb-4">
              Services
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg font-semibold text-cream mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Popular Cities for SEO */}
        <div className="mt-12 pt-8 border-t border-cream/10">
          <h4 className="font-display text-lg font-semibold text-cream mb-4">
            Popular Cities
          </h4>
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { city: "Hyderabad", slug: "hyderabad" },
              { city: "Bangalore", slug: "bengaluru" },
              { city: "Chennai", slug: "chennai" },
              { city: "Mumbai", slug: "mumbai" },
              { city: "Delhi", slug: "new-delhi" },
              { city: "Pune", slug: "pune" },
              { city: "Vijayawada", slug: "vijayawada" },
              { city: "Kolkata", slug: "kolkata" },
            ].map((item) => (
              <Link
                key={item.slug}
                to={`/services/poojari/${item.slug}`}
                className="text-xs text-cream/60 hover:text-gold transition-colors"
              >
                {item.city}
              </Link>
            ))}
          </div>
          
          {/* Quick Service Links by City */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-cream/50 mb-8">
            <div>
              <p className="font-medium text-cream/70 mb-2">Hyderabad</p>
              <Link to="/services/poojari/hyderabad" className="block hover:text-gold">Poojari in Hyderabad</Link>
              <Link to="/services/photographer/hyderabad" className="block hover:text-gold">Photographer in Hyderabad</Link>
              <Link to="/services/catering/hyderabad" className="block hover:text-gold">Catering in Hyderabad</Link>
            </div>
            <div>
              <p className="font-medium text-cream/70 mb-2">Bangalore</p>
              <Link to="/services/poojari/bengaluru" className="block hover:text-gold">Poojari in Bangalore</Link>
              <Link to="/services/photographer/bengaluru" className="block hover:text-gold">Photographer in Bangalore</Link>
              <Link to="/services/catering/bengaluru" className="block hover:text-gold">Catering in Bangalore</Link>
            </div>
            <div>
              <p className="font-medium text-cream/70 mb-2">Chennai</p>
              <Link to="/services/poojari/chennai" className="block hover:text-gold">Poojari in Chennai</Link>
              <Link to="/services/photographer/chennai" className="block hover:text-gold">Photographer in Chennai</Link>
              <Link to="/services/catering/chennai" className="block hover:text-gold">Catering in Chennai</Link>
            </div>
            <div>
              <p className="font-medium text-cream/70 mb-2">Mumbai</p>
              <Link to="/services/poojari/mumbai" className="block hover:text-gold">Poojari in Mumbai</Link>
              <Link to="/services/photographer/mumbai" className="block hover:text-gold">Photographer in Mumbai</Link>
              <Link to="/services/catering/mumbai" className="block hover:text-gold">Catering in Mumbai</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cream/50">
            © 2025 Subhakary. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="text-sm text-cream/50 hover:text-gold transition-colors">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-cream/50 hover:text-gold transition-colors">
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-cream/50">Available in:</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded text-xs bg-cream/10">English</span>
              <span className="px-2 py-1 rounded text-xs bg-cream/10">తెలుగు</span>
              <span className="px-2 py-1 rounded text-xs bg-cream/10">हिंदी</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
