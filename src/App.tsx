import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Rasimisha from './pages/Rasimisha';
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
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="rasimisha" element={<Rasimisha />} />
              <Route path="kadirio" element={<Kadirio />} />
              <Route path="efd-lite" element={<EfdLite />} />
              <Route path="utatuzi" element={<Utatuzi />} />
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
      </AuthProvider>
    </LangProvider>
  );
}
