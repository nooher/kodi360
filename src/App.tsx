import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import { AuthProvider } from './hooks/useAuth';
import { TraderAuthProvider } from './hooks/useTraderAuth';
import { InstallPromptProvider } from './hooks/useInstallPrompt';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import TraderProtectedRoute from './components/TraderProtectedRoute';
import Home from './pages/Home';
import Rasimisha from './pages/Rasimisha';
import TraderLogin from './pages/TraderLogin';
import Kadirio from './pages/Kadirio';
import EfdLite from './pages/EfdLite';
import Utatuzi from './pages/Utatuzi';
import AkiliWaKodi from './pages/AkiliWaKodi';
import OfficerLogin from './pages/OfficerLogin';
import Officer from './pages/Officer';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <TraderAuthProvider>
          <InstallPromptProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="rasimisha" element={<Rasimisha />} />
                  <Route path="trader/login" element={<TraderLogin />} />
                  <Route path="kadirio" element={<Kadirio />} />
                  <Route
                    path="efd-lite"
                    element={
                      <TraderProtectedRoute>
                        <EfdLite />
                      </TraderProtectedRoute>
                    }
                  />
                  <Route
                    path="utatuzi"
                    element={
                      <TraderProtectedRoute>
                        <Utatuzi />
                      </TraderProtectedRoute>
                    }
                  />
                  <Route path="akili-wa-kodi" element={<AkiliWaKodi />} />
                  <Route path="officer/login" element={<OfficerLogin />} />
                  <Route
                    path="officer"
                    element={
                      <ProtectedRoute>
                        <Officer />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </InstallPromptProvider>
        </TraderAuthProvider>
      </AuthProvider>
    </LangProvider>
  );
}
