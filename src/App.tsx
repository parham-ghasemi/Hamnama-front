import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home/Home"
import ScrollToTop from "./components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
import { ThemeProvider } from "./context/ThemeContext";
import PlanUsers from "./pages/userDashboard/planUsers/PlanUsers";
import { AuthProvider } from "./context/AuthContext";


const queryClient = new QueryClient({});


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="w-full min-h-screen font-fa cursor-default" dir="rtl" >
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ScrollToTop />
              <Toaster position="top-right" />
              <Routes>

                <Route path="join-room" element={<Join />} />

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
                  <Route index element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/plan-details" element={<PlanDetails />} />
                  <Route path="*" element={<p className="text-6xl font-black text-center my-60">THIS PAGE WAS NOT FOUND!</p>} />
                </Route>

              </Routes>
            </BrowserRouter>
            <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
          </QueryClientProvider>
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
