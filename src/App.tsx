import { lazy, Suspense } from "react";
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
import { ScrollToTop } from "@/components/ScrollToTop";
import { RouteLoadingFallback } from "@/components/RouteLoadingFallback";

// Index stays eager: it's the highest-traffic, most crawled page and should
// render with no extra request/JS-parse waterfall for LCP. Everything else
// is code-split so the homepage (and every other single route) doesn't ship
// the admin dashboard, checkout, chat, and Wedding OS in its own bundle.
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const BecomeProvider = lazy(() => import("./pages/BecomeProvider"));
const Providers = lazy(() => import("./pages/Providers"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const ProviderSettings = lazy(() => import("./pages/ProviderSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Chat = lazy(() => import("./pages/Chat"));
const InquiryChat = lazy(() => import("./pages/InquiryChat"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));
const ServiceCategory = lazy(() => import("./pages/ServiceCategory"));
const ServiceLocation = lazy(() => import("./pages/ServiceLocation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WeddingOnboarding = lazy(() => import("./pages/WeddingOnboarding"));
const WeddingDashboard = lazy(() => import("./pages/WeddingDashboard"));
const WeddingEventWorkspace = lazy(() => import("./pages/WeddingEventWorkspace"));
const WeddingJoin = lazy(() => import("./pages/WeddingJoin"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Compare = lazy(() => import("./pages/Compare"));
const Install = lazy(() => import("./pages/Install"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const PlanWedding = lazy(() => import("./pages/PlanWedding"));
const Journey = lazy(() => import("./pages/Journey"));
const SaaSLanding = lazy(() => import("./pages/SaaSLanding"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ComparisonProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteLoadingFallback />}>
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
              <Route path="/signup" element={<Auth />} />

              {/* Guests can browse and search approved providers without an account */}
              <Route path="/providers" element={<Providers />} />
              <Route path="/provider/:id" element={<ProviderProfile />} />
              <Route path="/providers/:id" element={<ProviderProfile />} />

              {/* Authenticated Customer Routes */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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
            </Suspense>
            <CompareBar />
            <PWAInstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
      </ComparisonProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
