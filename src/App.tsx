import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { ThemeProvider } from "next-themes";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { lazy, Suspense } from "react";
import { GlobalLoadingState } from "@/components/common/GlobalLoadingState";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bookings = lazy(() => import("./pages/Bookings"));
const RecurringBookings = lazy(() => import("./pages/RecurringBookings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CashierRoomDetail = lazy(() => import("./pages/cashier/RoomDetail"));
const WaiterRoomDetail = lazy(() => import("./pages/waiter/RoomDetail"));
const CustomerDisplayPage = lazy(() => import("./pages/CustomerDisplay"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AuthStateListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        queryClient.clear();
        navigate('/login');
      } else if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function ConditionalFloatingChat() {
  const location = useLocation();
  const showChat = location.pathname === '/dashboard';

  return showChat ? <FloatingChatButton /> : null;
}

// Page loading fallback
function PageLoader() {
  return <GlobalLoadingState isLoading={true} message="Memuat halaman..." variant="overlay" />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <DemoModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PWAInstallPrompt />
              <BrowserRouter>
                <AuthStateListener />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/cashier/room/:roomId" element={<CashierRoomDetail />} />
                    <Route path="/waiter/room/:roomId" element={<WaiterRoomDetail />} />
                    <Route path="/customer-display" element={<CustomerDisplayPage />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/recurring-bookings" element={<RecurringBookings />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <ConditionalFloatingChat />
              </BrowserRouter>
            </TooltipProvider>
          </DemoModeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
