import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { GaragePage } from './pages/GaragePage'
import { BikeEditorPage } from './pages/BikeEditorPage'
import { SetupPage } from './pages/SetupPage'
import { SetupsPage } from './pages/SetupsPage'
import { SharedPage } from './pages/SharedPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<GaragePage />} />
        <Route path="/bike/new" element={<BikeEditorPage />} />
        <Route path="/bike/:id" element={<BikeEditorPage />} />
        <Route path="/bike/:id/setup" element={<SetupPage />} />
        <Route path="/bike/:id/setups" element={<SetupsPage />} />
        <Route path="/share/:code" element={<SharedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}
