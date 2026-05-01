import { Routes, Route, useLocation } from 'react-router'
import { AppLayout } from './components/AppLayout'
import WelcomePage from './pages/Welcome'
import HomePage from './pages/Home'
import GeneratePage from './pages/Generate'
import LibraryPage from './pages/Library'
import ChatPage from './pages/Chat'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import PremiumPage from './pages/Premium'
import NotFound from './pages/NotFound'

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const noLayoutRoutes = ['/welcome', '/login', '/register']
  const hideLayout = noLayoutRoutes.some(r => location.pathname.startsWith(r))
  
  if (hideLayout) {
    return <>{children}</>
  }
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <LayoutWrapper>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LayoutWrapper>
  )
}
