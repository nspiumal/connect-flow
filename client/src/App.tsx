import { ReactNotifications } from "react-notifications-component";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "@/store";
import { ThemeContextProvider } from "@/vendor/facit/contexts/themeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout, AppLayoutNoSidebar } from "@/components/layout/AppLayout";
import { RequirePermission } from "@/components/RequirePermission";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import BranchRequests from "./pages/BranchRequests";
import UsersPage from "./pages/Users";
import Roles from "./pages/Roles";
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

const App = () => (
  <ReduxProvider store={store}>
    <ThemeContextProvider>
      <ReactNotifications />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<RequirePermission permission="dashboard.view"><Dashboard /></RequirePermission>} />
              <Route path="/branches" element={<RequirePermission permission="branches.view"><Branches /></RequirePermission>} />
              <Route path="/branch-requests" element={<RequirePermission permission="branchRequests.view"><BranchRequests /></RequirePermission>} />
              <Route path="/users" element={<RequirePermission permission="users.view"><UsersPage /></RequirePermission>} />
              <Route path="/roles" element={<RequirePermission permission="roles.manage"><Roles /></RequirePermission>} />
              <Route path="/item-types" element={<RequirePermission permission="itemTypes.view"><ItemTypes /></RequirePermission>} />
              <Route path="/transactions" element={<RequirePermission permission="tickets.view"><Transactions /></RequirePermission>} />
              <Route path="/transactions/edit/:id" element={<RequirePermission permission="tickets.edit"><TransactionEdit /></RequirePermission>} />
              <Route path="/transactions/info/:id" element={<RequirePermission permission="tickets.view.detail"><TransactionInfo /></RequirePermission>} />
              <Route path="/transactions/redeem/:id" element={<RequirePermission permission="redemption.view.balance"><TransactionRedeem /></RequirePermission>} />
              <Route path="/transactions/profit/:id" element={<RequirePermission permission="profit.record"><TransactionProfit /></RequirePermission>} />
              <Route path="/profited-items" element={<RequirePermission permission="profit.view.list"><ProfitedItems /></RequirePermission>} />
              <Route path="/customers" element={<RequirePermission permission="customers.view"><Customers /></RequirePermission>} />
              <Route path="/blacklist" element={<RequirePermission permission="blacklist.view"><Blacklist /></RequirePermission>} />
              <Route path="/interest-rates" element={<RequirePermission permission="interestRates.view"><InterestRates /></RequirePermission>} />
              <Route path="/reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />
              <Route path="/audit-logs" element={<RequirePermission permission="auditLogs.view"><AuditLogs /></RequirePermission>} />
              <Route path="/activity-logs" element={<RequirePermission permission="activityLogs.view"><ActivityLogs /></RequirePermission>} />
              <Route path="/transactions/create-new" element={<RequirePermission permission="tickets.create.alt"><CreatePawning /></RequirePermission>} />
            </Route>
            <Route element={<AppLayoutNoSidebar />}>
              <Route path="/transactions/create" element={<RequirePermission permission="tickets.create"><CreatePawningSample /></RequirePermission>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeContextProvider>
  </ReduxProvider>
);

export default App;
