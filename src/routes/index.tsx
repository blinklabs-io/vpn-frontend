import { Routes, Route } from 'react-router'
import Home from '../pages/Home'
import Account from '../pages/Account'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
    </Routes>
  )
}

export default AppRoutes