import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./Shell";
import { LoginPage } from "@/features/auth/LoginPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { InvoicesPage } from "@/features/invoices/InvoicesPage";
import { BrandingPage } from "@/features/branding/BrandingPage";
import { CampaignsPage } from "@/features/campaigns/CampaignsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="branding" element={<BrandingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
