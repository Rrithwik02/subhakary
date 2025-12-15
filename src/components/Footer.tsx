import { Flame, MapPin, Phone, Mail } from "lucide-react";

const footerLinks = {
  services: [
    "Poojari / Priest",
    "Photography",
    "Makeup Artist",
    "Mehandi",
    "Decoration",
    "Catering",
  ],
  company: ["About Us", "How It Works", "Become a Provider", "Blog", "Careers"],
  support: ["Contact Us", "FAQ", "Privacy Policy", "Terms of Service"],
};

export const Footer = () => {
  return (
    <footer className="bg-brown-dark text-cream/90">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center">
                <Flame className="w-6 h-6 text-brown-dark" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-semibold tracking-wide text-cream">
                  SUBHAKARY
                </span>
                <span className="text-xs text-cream/60 -mt-1 tracking-widest">
                  शुभकार्य
                </span>
              </div>
            </a>
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
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link}
                  </a>
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
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link}
                  </a>
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
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cream/50">
            © 2024 Subhakary. All rights reserved.
          </p>
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
