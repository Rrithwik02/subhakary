/**
 * GA4 Analytics Utility
 * Centralized tracking for conversion events
 */

// Extend window to include gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Helper to safely call gtag
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// ============ CONVERSION EVENTS ============

/**
 * Track when a user sends a booking inquiry
 */
export const trackBookingInquiry = (data: {
  providerId: string;
  providerName: string;
  serviceType?: string;
}) => {
  gtag('event', 'booking_inquiry_sent', {
    provider_id: data.providerId,
    provider_name: data.providerName,
    service_type: data.serviceType || 'general',
  });
};

/**
 * Track when a booking request is submitted
 */
export const trackBookingRequest = (data: {
  providerId: string;
  providerName: string;
  totalDays?: number;
  serviceDate?: string;
}) => {
  gtag('event', 'booking_request_submitted', {
    provider_id: data.providerId,
    provider_name: data.providerName,
    total_days: data.totalDays || 1,
    service_date: data.serviceDate,
  });
};

/**
 * Track when a user clicks to contact a provider (WhatsApp, call, etc.)
 */
export const trackProviderContact = (data: {
  providerId: string;
  providerName: string;
  contactMethod: 'whatsapp' | 'phone' | 'chat' | 'inquiry';
}) => {
  gtag('event', 'provider_contact_click', {
    provider_id: data.providerId,
    provider_name: data.providerName,
    contact_method: data.contactMethod,
  });
};

/**
 * Track when a provider profile is viewed
 */
export const trackProviderView = (data: {
  providerId: string;
  providerName: string;
  category?: string;
  city?: string;
}) => {
  gtag('event', 'provider_profile_view', {
    provider_id: data.providerId,
    provider_name: data.providerName,
    category: data.category,
    city: data.city,
  });
};

// ============ FORM SUBMISSION EVENTS ============

/**
 * Track contact form submissions
 */
export const trackContactFormSubmit = () => {
  gtag('event', 'form_submission', {
    form_type: 'contact',
  });
};

/**
 * Track newsletter signup
 */
export const trackNewsletterSignup = (source?: string) => {
  gtag('event', 'newsletter_signup', {
    source: source || 'website',
  });
};

/**
 * Track provider application submission
 */
export const trackProviderApplicationSubmit = (data: {
  businessName: string;
  category?: string;
}) => {
  gtag('event', 'provider_application_submitted', {
    business_name: data.businessName,
    category: data.category,
  });
};

// ============ ENGAGEMENT EVENTS ============

/**
 * Track when a user adds a provider to favorites
 */
export const trackFavoriteAdded = (data: {
  providerId: string;
}) => {
  gtag('event', 'favorite_added', {
    provider_id: data.providerId,
  });
};

/**
 * Track when a user removes a provider from favorites
 */
export const trackFavoriteRemoved = (data: {
  providerId: string;
}) => {
  gtag('event', 'favorite_removed', {
    provider_id: data.providerId,
  });
};

/**
 * Track when a chat/conversation is started
 */
export const trackChatStarted = (data: {
  providerId: string;
  providerName: string;
}) => {
  gtag('event', 'chat_started', {
    provider_id: data.providerId,
    provider_name: data.providerName,
  });
};

/**
 * Track when a message is sent in chat
 */
export const trackMessageSent = (data: {
  providerId: string;
  conversationId: string;
}) => {
  gtag('event', 'message_sent', {
    provider_id: data.providerId,
    conversation_id: data.conversationId,
  });
};

/**
 * Track search performed
 */
export const trackSearch = (data: {
  searchQuery?: string;
  filters?: Record<string, string>;
  resultsCount?: number;
}) => {
  gtag('event', 'search_performed', {
    search_query: data.searchQuery,
    filters: JSON.stringify(data.filters || {}),
    results_count: data.resultsCount,
  });
};

// ============ AUTH EVENTS ============

/**
 * Track successful signup
 */
export const trackSignup = (method: 'email' | 'google') => {
  gtag('event', 'signup_completed', {
    method,
  });
};

/**
 * Track successful login
 */
export const trackLogin = (method: 'email' | 'google') => {
  gtag('event', 'login_completed', {
    method,
  });
};

// ============ BUNDLE BOOKING EVENTS ============

/**
 * Track when a bundle package is booked
 */
export const trackBundleBooking = (data: {
  bundleId: string;
  bundleName: string;
  providerId: string;
  providerName: string;
  price: number;
}) => {
  gtag('event', 'bundle_booking_submitted', {
    bundle_id: data.bundleId,
    bundle_name: data.bundleName,
    provider_id: data.providerId,
    provider_name: data.providerName,
    value: data.price,
    currency: 'INR',
  });
};
