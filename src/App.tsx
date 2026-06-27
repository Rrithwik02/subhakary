import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ComparisonProvider } from "@/hooks/useProviderComparison";
import { AdminRoute } from "@/components/AdminRoute";
import { CompareBar } from "@/components/CompareBar";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BecomeProvider from "./pages/BecomeProvider";
import Providers from "./pages/Providers";
import ProviderProfile from "./pages/ProviderProfile";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderSettings from "./pages/ProviderSettings";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Chat from "./pages/Chat";
import InquiryChat from "./pages/InquiryChat";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import ServiceCategory from "./pages/ServiceCategory";
import ServiceLocation from "./pages/ServiceLocation";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import WeddingOnboarding from "./pages/WeddingOnboarding";
import WeddingDashboard from "./pages/WeddingDashboard";
import WeddingEventWorkspace from "./pages/WeddingEventWorkspace";
import WeddingJoin from "./pages/WeddingJoin";
import Notifications from "./pages/Notifications";
import Compare from "./pages/Compare";
import Install from "./pages/Install";
import Checkout from "./pages/Checkout";
import PaymentHistory from "./pages/PaymentHistory";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/SearchResults";
import PlanWedding from "./pages/PlanWedding";
import Journey from "./pages/Journey";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ComparisonProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Core & Auth */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Provider Flow */}
              <Route path="/become-provider" element={<BecomeProvider />} />
              <Route path="/provider-dashboard" element={<ProviderDashboard />} />
              <Route path="/provider-settings" element={<ProviderSettings />} />
              <Route path="/provider/:id" element={<ProviderProfile />} />
              <Route path="/providers/:id" element={<ProviderProfile />} />
              <Route path="/providers" element={<Providers />} />

              {/* Booking & Payments */}
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/booking/:bookingId" element={<BookingDetails />} />
              <Route path="/checkout/:paymentId" element={<Checkout />} />
              <Route path="/payment-history" element={<PaymentHistory />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Discovery & Search */}
              <Route path="/services" element={<Services />} />
              <Route path="/services/:service" element={<ServiceCategory />} />
              <Route path="/services/:service/:city" element={<ServiceLocation />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/compare" element={<Compare />} />

              {/* Communication */}
              <Route path="/chat" element={<Chat />} />
              <Route path="/inquiry/:providerId" element={<InquiryChat />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* Content Pages */}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* Wedding OS (V2 Core) */}
              <Route path="/wedding/new" element={<WeddingOnboarding />} />
              <Route path="/wedding/:weddingId" element={<WeddingDashboard />} />
              <Route path="/wedding/join/:inviteCode" element={<WeddingJoin />} />
              <Route path="/wedding/:weddingId/events/:eventId" element={<WeddingEventWorkspace />} />

              {/* Legacy/Redirect paths */}
              <Route path="/wedding-dashboard" element={<WeddingDashboard />} />
              <Route path="/plan-wedding" element={<PlanWedding />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/install" element={<Install />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CompareBar />
            <PWAInstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
      </ComparisonProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
