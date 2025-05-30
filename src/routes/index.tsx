import { Routes, Route } from 'react-router'
import Home from '../pages/Home'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import HowItWorks from '../pages/HowItWorks'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
    </Routes>
  )
}

export default AppRoutes