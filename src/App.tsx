import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Inventory from "./pages/Inventory.tsx";
import Rentals from "./pages/Rentals.tsx";
import VehicleDetail from "./pages/VehicleDetail.tsx";
import TestDriveBooking from "./pages/TestDriveBooking.tsx";
import Compare from "./pages/Compare.tsx";
import Reviews from "./pages/Reviews.tsx";
import FinanceCalculator from "./pages/FinanceCalculator.tsx";
import Account from "./pages/Account.tsx";
import Trips from "./pages/Trips.tsx";
import DealerHub from "./pages/DealerHub.tsx";
import DealerVehicleEdit from "./pages/DealerVehicleEdit.tsx";
import OwnerHub from "./pages/OwnerHub.tsx";
import OwnerVehicleEdit from "./pages/OwnerVehicleEdit.tsx";
import Admin from "./pages/Admin.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/test-drive/:id" element={<TestDriveBooking />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/finance/calculator" element={<FinanceCalculator />} />
          <Route path="/account" element={<Account />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/dealer" element={<DealerHub />} />
          <Route path="/dealer/vehicles/:id" element={<DealerVehicleEdit />} />
          <Route path="/owner" element={<OwnerHub />} />
          <Route path="/owner/vehicles/:id" element={<OwnerVehicleEdit />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
