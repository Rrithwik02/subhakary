import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-brown mb-4">
              Privacy Policy
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
                <h2 className="font-display text-2xl text-brown mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Subhakary ("we," "our," or "us"). We are committed to protecting your personal 
                  information and your right to privacy. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you visit our website www.subhakary.com and 
                  use our services.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong className="text-brown">Personal Information:</strong> Name, email address, phone number, and address when you create an account or make a booking.</li>
                  <li><strong className="text-brown">Profile Information:</strong> Profile photos, preferences, and any other information you choose to provide.</li>
                  <li><strong className="text-brown">Payment Information:</strong> Payment details processed securely through our payment partners.</li>
                  <li><strong className="text-brown">Communication Data:</strong> Messages exchanged between you and service providers through our platform.</li>
                  <li><strong className="text-brown">Usage Data:</strong> Information about how you use our website, including pages visited, time spent, and interactions.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process bookings and transactions</li>
                  <li>Connect you with verified service providers</li>
                  <li>Send you notifications about your bookings and account</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong className="text-brown">With Service Providers:</strong> When you make a booking, we share relevant information with the service provider to facilitate the service.</li>
                  <li><strong className="text-brown">With Third-Party Partners:</strong> We may share data with partners who help us operate our platform (payment processors, analytics providers).</li>
                  <li><strong className="text-brown">For Legal Reasons:</strong> When required by law or to protect our rights and safety.</li>
                  <li><strong className="text-brown">With Your Consent:</strong> When you explicitly authorize us to share your information.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your 
                  personal information against unauthorized access, alteration, disclosure, or destruction. 
                  However, no method of transmission over the Internet is 100% secure, and we cannot 
                  guarantee absolute security.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong className="text-brown">Access:</strong> Request access to your personal data we hold.</li>
                  <li><strong className="text-brown">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                  <li><strong className="text-brown">Deletion:</strong> Request deletion of your personal data (subject to legal requirements).</li>
                  <li><strong className="text-brown">Portability:</strong> Request a copy of your data in a structured format.</li>
                  <li><strong className="text-brown">Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">7. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to collect information about your 
                  browsing activities. You can control cookies through your browser settings. Disabling 
                  cookies may affect some features of our website.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">8. Third-Party Links</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our website may contain links to third-party websites. We are not responsible for the 
                  privacy practices of these external sites. We encourage you to read their privacy policies 
                  before providing any personal information.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not intended for individuals under the age of 18. We do not knowingly 
                  collect personal information from children. If we become aware that we have collected 
                  data from a child, we will take steps to delete it promptly.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="font-display text-2xl text-brown mb-4">10. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date. We encourage 
                  you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-brown mb-4">11. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-cream rounded-xl">
                  <p className="text-brown font-medium">Subhakary</p>
                  <p className="text-muted-foreground">Email: privacy@subhakary.com</p>
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

export default PrivacyPolicy;
