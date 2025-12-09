import { Routes, Route, Navigate } from "react-router";
import Account from "../pages/Account";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import HowItWorks from "../pages/HowItWorks";
import DocsFaqs from "../pages/DocsFaqs";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Account />} />
      <Route path="/account" element={<Navigate to="/" replace />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/docs-faqs" element={<DocsFaqs />} />
    </Routes>
  );
};

export default AppRoutes;
