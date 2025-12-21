import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-6 text-brown hover:text-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gold/10 text-gold">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-brown mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 21, 2024
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto bg-card rounded-2xl border border-border p-8 md:p-12"
          >
            <div className="prose prose-brown max-w-none">
              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Subhakary's website (www.subhakary.com) and services, you agree to 
                  be bound by these Terms of Service. If you do not agree to these terms, please do not use 
                  our platform. These terms apply to all users, including customers and service providers.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">2. Description of Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Subhakary is an online platform that connects customers with verified service providers 
                  for traditional and cultural services including, but not limited to, priests (Poojari), 
                  photographers, makeup artists, mehandi artists, decorators, and caterers. We act as an 
                  intermediary platform and are not directly involved in the provision of services.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To use certain features of our platform, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access to your account</li>
                  <li>Be responsible for all activities that occur under your account</li>
                  <li>Not share your account with others or transfer your account</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">4. Booking and Payments</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-brown mb-2">4.1 Booking Process</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      When you make a booking through our platform, you enter into a direct agreement with 
                      the service provider. We facilitate this connection but are not a party to the contract 
                      between you and the provider.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brown mb-2">4.2 Payments</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Payment terms are agreed upon between you and the service provider. Some bookings may 
                      require advance payments. All payments are processed securely through our payment partners.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brown mb-2">4.3 Cancellations and Refunds</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Cancellation policies vary by service provider. Please review the provider's cancellation 
                      policy before making a booking. Refunds, if applicable, will be processed according to 
                      the provider's policy and our refund guidelines.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">5. Service Provider Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you register as a service provider, you additionally agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide accurate information about your services, qualifications, and pricing</li>
                  <li>Maintain all necessary licenses and certifications</li>
                  <li>Deliver services as described and agreed upon with customers</li>
                  <li>Respond to booking requests and inquiries in a timely manner</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not engage in fraudulent or misleading practices</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">6. User Conduct</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When using our platform, you agree not to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Post false, misleading, or fraudulent content</li>
                  <li>Harass, abuse, or harm other users or service providers</li>
                  <li>Attempt to circumvent our platform to avoid fees</li>
                  <li>Use automated systems to access our platform without permission</li>
                  <li>Interfere with the proper functioning of our website</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">7. Reviews and Ratings</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users may leave reviews and ratings for service providers. Reviews must be honest, accurate, 
                  and based on genuine experiences. We reserve the right to remove reviews that violate our 
                  guidelines or contain inappropriate content. Service providers may not incentivize or 
                  manipulate reviews in any way.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">8. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content on our platform, including logos, text, images, and software, is the property 
                  of Subhakary or its licensors and is protected by intellectual property laws. You may not 
                  copy, reproduce, modify, or distribute our content without prior written permission.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform is provided "as is" without warranties of any kind. We do not guarantee the 
                  quality, accuracy, or reliability of services provided by service providers. We are not 
                  responsible for any disputes between users and service providers. Your use of our platform 
                  is at your own risk.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, Subhakary shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages arising from your use of our 
                  platform or services. Our total liability shall not exceed the amount paid by you to us 
                  in the twelve months preceding the claim.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">11. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify and hold harmless Subhakary, its officers, directors, employees, 
                  and agents from any claims, damages, losses, or expenses arising from your use of our 
                  platform, violation of these terms, or infringement of any rights of third parties.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">12. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of 
                  these terms or for any other reason at our discretion. Upon termination, your right to 
                  use our platform will immediately cease. Provisions that by their nature should survive 
                  termination shall remain in effect.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">13. Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Any disputes arising from these terms or your use of our platform shall be resolved 
                  through arbitration in accordance with Indian law. The arbitration shall be conducted 
                  in Hyderabad, Telangana, India. You agree to waive any right to a jury trial or 
                  participation in a class action.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">14. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Service shall be governed by and construed in accordance with the laws 
                  of India. The courts of Hyderabad, Telangana shall have exclusive jurisdiction over 
                  any disputes arising from these terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">15. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify these Terms of Service at any time. We will notify you of significant 
                  changes by posting a notice on our website or sending you an email. Your continued 
                  use of our platform after such changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-brown mb-4">16. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-cream rounded-xl">
                  <p className="text-brown font-medium">Subhakary</p>
                  <p className="text-muted-foreground">Email: legal@subhakary.com</p>
                  <p className="text-muted-foreground">Address: Hyderabad, Telangana, India</p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default TermsOfService;
