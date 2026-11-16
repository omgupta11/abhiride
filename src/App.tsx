
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import RideHome from './pages/customer/RideHome'
import RideResults from './pages/customer/RideResults'

import DriverLogin from './pages/driver/DriverLogin'
import DriverRegistration from './pages/driver/DriverRegistration'
import DriverDashboard from './pages/driver/DriverDashboard'
import DriverPasswordReset from './pages/driver/DriverPasswordReset'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RideHome />} />
        <Route path="/search" element={<RideResults />} />

        <Route path="/drivers" element={<DriverLogin />} />
        <Route path="/drivers/register" element={<DriverRegistration />} />
        <Route path="/drivers/dashboard" element={<DriverDashboard />} />

        <Route
          path="/drivers/reset-password"
          element={<DriverPasswordReset />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
