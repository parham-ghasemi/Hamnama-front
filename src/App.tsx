import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import Home from "./pages/home/Home"
import ScrollToTop from "./components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DesktopLayout from "./layouts/mainLayout/MainLayout";
import Auth from "./pages/Auth/Auth";
import PlanDetails from "./pages/planDetails/PlanDetails";
import UserDashboardLayout from "./layouts/userDashboardLayout/UserDashboardLayout";
import UserInfo from "./pages/userDashboard/userInfo/UserInfo";
import Payments from "./pages/userDashboard/payments/Payments";
import Tickets from "./pages/userDashboard/tickets/Tickets";
import TicketChat from "./pages/userDashboard/tickets/ticketChat/TicketChat";
import Leaderboard from "./pages/userDashboard/leaderboard/Leaderboard";
import Join from "./pages/room/join/Join";
import PlanUsers from "./pages/userDashboard/planUsers/PlanUsers";
import PaymentResult from "./pages/paymentResult/PaymentResult";
import PlanInvite from "./pages/planInvite/PlanInvite";
import { AuthProvider } from "./context/AuthContext";
import RoomPage from "./pages/room/roomPage/RoomPage";
import AdminLayout from "./layouts/adminLayout/AdminLayout";
import AdminRoute from "./components/adminRoute/AdminRoute";
import { AdminDashboard, AdminTickets, AdminUsers, AdminRooms, AdminSettings, AdminArchive, AdminPlanPayments } from "./pages/admin";
import { ConfirmationModalProvider } from "./context/ConfirmModalContext/ConfirmaModalContext";
import PaymentCallback from "./pages/paymentCallback/PaymentCallback";
import NotFound from "./components/notFound/NotFound";
import { Toaster } from "./components/toast";
import About from "./pages/about/About";
import Tutorial from "./pages/tutorial/Tutorial";
import { AdminSupport } from "./pages/admin";
import WebsiteAnnouncements from "./components/websiteAnnouncements/WebsiteAnnouncements";
import PageLoader from "./components/pageLoader/PageLoader";

const queryClient = new QueryClient({});

function App() {
  return (
    <AuthProvider>
      <div className="w-full min-h-screen font-fa cursor-default" dir="rtl" >
        <ConfirmationModalProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ScrollToTop />
              <Toaster position="top-right" />
              <WebsiteAnnouncements />
              <PageLoader />
              <Routes>
                <Route path="user" element={<UserDashboardLayout />}>
                  <Route index element={<Navigate to={"info"} replace />} />
                  <Route path="info" element={<UserInfo />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="plan-users" element={<PlanUsers />} />
                  <Route path="ticket" element={<Tickets />} />
                  <Route path="ticket/:id" element={<TicketChat />} />
                </Route>

                <Route element={<DesktopLayout />}>
                  <Route index element={<PaymentCallback />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/about-us" element={<About />} />
                  <Route path="/tutorial" element={<Tutorial />} />
                  <Route path="/plan-details" element={<PlanDetails />} />
                  <Route path="/payment-result" element={<PaymentResult />} />
                  <Route path="/plan-invite" element={<PlanInvite />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="rooms" element={<AdminRooms />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="archive" element={<AdminArchive />} />
                  <Route path="plan-payments" element={<AdminPlanPayments />} />
                </Route>

                <Route path="join-room" element={<Join />} />
                <Route path="/room/:id" element={<RoomPage />} />
              </Routes>
            </BrowserRouter>
            {/* <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" /> */}
          </QueryClientProvider>
        </ConfirmationModalProvider>
      </div>
    </AuthProvider>
  )
}

export default App
