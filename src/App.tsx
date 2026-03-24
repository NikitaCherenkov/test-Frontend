import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Theme, presetGpnDefault } from '@consta/uikit/Theme'
import Navigation from './components/Navigation'
import CustomersPage from './pages/CustomersPage'
import LotsPage from './pages/LotsPage'
import CustomerLotsPage from './pages/CustomerLotsPage'
import { NotificationProvider } from './context/NotificationContext'

function App() {
  return (
    <BrowserRouter>
      <Theme preset={presetGpnDefault}>
        <NotificationProvider position="top-right" maxNotifications={5}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden'
          }}>
            <Navigation />
            <div style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative'
            }}>
              <Routes>
                <Route path="/" element={<CustomersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomersPage />} />
                <Route path="/lots" element={<LotsPage />} />
                <Route path="/customers/:id/lots" element={<CustomerLotsPage />} />
              </Routes>
            </div>
          </div>
        </NotificationProvider>
      </Theme>
    </BrowserRouter>
  )
}

export default App