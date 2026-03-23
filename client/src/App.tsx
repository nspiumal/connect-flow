import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import BranchRequests from "./pages/BranchRequests";
import UsersPage from "./pages/Users";
import ItemTypes from "./pages/ItemTypes";
import Transactions from "./pages/Transactions";
import CreatePawning from "./pages/CreatePawning";
import CreatePawningSample from "./pages/CreatePawningSample";
import TransactionEdit from "./pages/TransactionEdit";
import TransactionInfo from "./pages/TransactionInfo";
import TransactionRedeem from "./pages/TransactionRedeem";
import TransactionProfit from "./pages/TransactionProfit";
import ProfitedItems from "./pages/ProfitedItems";
import Customers from "./pages/Customers";
import Blacklist from "./pages/Blacklist";
import InterestRates from "./pages/InterestRates";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import ActivityLogs from "./pages/ActivityLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branch-requests" element={<BranchRequests />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/item-types" element={<ItemTypes />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/create-new" element={<CreatePawning />} />
            <Route path="/transactions/create" element={<CreatePawningSample />} />
            <Route path="/transactions/edit/:id" element={<TransactionEdit />} />
            <Route path="/transactions/info/:id" element={<TransactionInfo />} />
            <Route path="/transactions/redeem/:id" element={<TransactionRedeem />} />
            <Route path="/transactions/profit/:id" element={<TransactionProfit />} />
            <Route path="/profited-items" element={<ProfitedItems />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/blacklist" element={<Blacklist />} />
            <Route path="/interest-rates" element={<InterestRates />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
