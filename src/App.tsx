import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home/Home"
import ScrollToTop from "./components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import DesktopLayout from "./layouts/DesktopLayout";
import Auth from "./pages/Auth/Auth";

const queryClient = new QueryClient({});

function App() {

  return (
    <div className="w-full min-h-screen font-fa" dir="rtl">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Toaster position="top-right" />
          <Routes>
            <Route element={<DesktopLayout />}>
              <Route index element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<p className="text-6xl font-black text-center my-60">THIS PAGE WAS NOT FOUND!</p>} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
      </QueryClientProvider>
    </div>
  )
}

export default App
