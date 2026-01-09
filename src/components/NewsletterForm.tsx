import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { trackNewsletterSignup } from "@/lib/analytics";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);

interface NewsletterFormProps {
  source?: string;
  className?: string;
}

export const NewsletterForm = ({ source = "website", className = "" }: NewsletterFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email: validation.data, source });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed to our newsletter!");
        } else {
          throw error;
        }
      } else {
        toast.success("Thank you for subscribing to our newsletter!");
        trackNewsletterSignup(source);
        setEmail("");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-full border border-brown/20 bg-cream focus:outline-none focus:border-gold"
        required
      />
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-gold hover:bg-gold/90 text-brown px-8 rounded-full"
      >
        {isLoading ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
};
