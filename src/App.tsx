import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ComparisonProvider } from "@/hooks/useProviderComparison";
import { AdminRoute } from "@/components/AdminRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import SaaSLanding from "./pages/SaaSLanding";

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
              {/* Public Marketing Website / Guest Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/planning-os" element={<SaaSLanding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:service" element={<ServiceCategory />} />
              <Route path="/services/:service/:city" element={<ServiceLocation />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/install" element={<Install />} />
              <Route path="/become-provider" element={<BecomeProvider />} />

              {/* Authenticated Customer Routes */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute allowedRole="customer"><Providers /></ProtectedRoute>} />
              <Route path="/provider/:id" element={<ProtectedRoute allowedRole="customer"><ProviderProfile /></ProtectedRoute>} />
              <Route path="/providers/:id" element={<ProtectedRoute allowedRole="customer"><ProviderProfile /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute allowedRole="customer"><MyBookings /></ProtectedRoute>} />
              <Route path="/booking/:bookingId" element={<ProtectedRoute allowedRole="customer"><BookingDetails /></ProtectedRoute>} />
              <Route path="/checkout/:paymentId" element={<ProtectedRoute allowedRole="customer"><Checkout /></ProtectedRoute>} />
              <Route path="/payment-history" element={<ProtectedRoute allowedRole="customer"><PaymentHistory /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute allowedRole="customer"><Favorites /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute allowedRole="customer"><Compare /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute allowedRole="customer"><Chat /></ProtectedRoute>} />
              <Route path="/inquiry/:providerId" element={<ProtectedRoute allowedRole="customer"><InquiryChat /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowedRole="customer"><Notifications /></ProtectedRoute>} />

              {/* Wedding OS (Customer Wedding Planner) */}
              <Route path="/wedding/new" element={<ProtectedRoute allowedRole="customer"><WeddingOnboarding /></ProtectedRoute>} />
              <Route path="/wedding/:weddingId" element={<ProtectedRoute allowedRole="customer"><WeddingDashboard /></ProtectedRoute>} />
              <Route path="/wedding/join/:inviteCode" element={<ProtectedRoute allowedRole="customer"><WeddingJoin /></ProtectedRoute>} />
              <Route path="/wedding/:weddingId/events/:eventId" element={<ProtectedRoute allowedRole="customer"><WeddingEventWorkspace /></ProtectedRoute>} />
              <Route path="/wedding-dashboard" element={<ProtectedRoute allowedRole="customer"><WeddingDashboard /></ProtectedRoute>} />
              <Route path="/plan-wedding" element={<ProtectedRoute allowedRole="customer"><PlanWedding /></ProtectedRoute>} />
              <Route path="/journey" element={<ProtectedRoute allowedRole="customer"><Journey /></ProtectedRoute>} />

              {/* Authenticated Provider Routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRole="provider"><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/provider-dashboard" element={<ProtectedRoute allowedRole="provider"><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/provider-settings" element={<ProtectedRoute allowedRole="provider"><ProviderSettings /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

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
