import { motion } from "framer-motion";
import { 
  Search, 
  MessageSquare, 
  CalendarCheck, 
  CheckCircle2, 
  Star,
  Briefcase,
  ClipboardCheck,
  Users,
  BadgeCheck,
  ArrowRight
} from "lucide-react";

const customerSteps = [
  {
    icon: Search,
    title: "Find Providers",
    description: "Browse verified service providers by category, location, or use AI search",
    microcopy: null,
  },
  {
    icon: MessageSquare,
    title: "Chat & Discuss",
    description: "Connect with providers to discuss your requirements before booking",
    microcopy: null,
  },
  {
    icon: CalendarCheck,
    title: "Check Availability",
    description: "Select your preferred date and time, then check if the provider is available",
    microcopy: "No payment required. Most providers respond within a few hours.",
  },
  {
    icon: CheckCircle2,
    title: "Get Confirmation",
    description: "Provider reviews and accepts your booking, you get notified instantly",
    microcopy: null,
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "After service completion, share your experience to help others",
    microcopy: null,
  },
];

const providerSteps = [
  {
    icon: Briefcase,
    title: "Create Your Profile",
    description: "Add your service details and upload a document that proves your business ownership (GST, Trade License, etc.)",
    microcopy: null,
  },
  {
    icon: BadgeCheck,
    title: "Get Verified",
    description: "Our team reviews your application and approves your profile",
    microcopy: null,
  },
  {
    icon: Users,
    title: "Receive Inquiries",
    description: "Customers can chat with you and send booking requests",
    microcopy: "You'll start receiving booking requests once customers search for your service. Try to respond within a few hours!",
  },
  {
    icon: ClipboardCheck,
    title: "Manage Bookings",
    description: "Accept or decline bookings, manage your calendar and availability",
    microcopy: null,
  },
  {
    icon: Star,
    title: "Get More Bookings",
    description: "Build trust with reviews and receive more customer requests",
    microcopy: null,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const BookingFlowSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4"
          >
            Simple Booking Process
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Whether you're looking for services or offering them, our platform makes it easy
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Customer Flow */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                For Customers
              </h3>
            </div>
            
            <div className="space-y-4">
              {customerSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Step {index + 1}
                      </span>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    {step.microcopy && (
                      <p className="text-xs text-primary/80 mt-1.5 italic">{step.microcopy}</p>
                    )}
                  </div>
                  {index < customerSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30 flex-shrink-0 hidden sm:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Provider Flow */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                For Service Providers
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-8 ml-[52px]">
              No upfront cost. No obligation to accept bookings.
            </p>
            
            <div className="space-y-4">
              {providerSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-secondary/30 transition-colors"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        Step {index + 1}
                      </span>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    {step.microcopy && (
                      <p className="text-xs text-secondary/80 mt-1.5 italic">{step.microcopy}</p>
                    )}
                  </div>
                  {index < providerSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30 flex-shrink-0 hidden sm:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
