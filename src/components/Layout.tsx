import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { MODULE_NAMES } from '../lib/moduleNames';
import InstallButton from './InstallButton';

const NAV = [
  { to: '/', sw: 'Nyumbani', en: 'Home' },
  { to: '/rasimisha', ...MODULE_NAMES.rasimisha },
  { to: '/kadirio', ...MODULE_NAMES.kadirio },
  { to: '/efd-lite', ...MODULE_NAMES.efdLite },
  { to: '/utatuzi', ...MODULE_NAMES.utatuzi },
  { to: '/akili-wa-kodi', ...MODULE_NAMES.akiliWaKodi },
];

export default function Layout() {
  const { lang, toggle } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-tz-black/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <img src="/icons/icon.svg" alt="" className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-tz-black">KODI360</span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-tz-green text-white'
                      : 'text-tz-black/70 hover:bg-tz-black/5 hover:text-tz-black'
                  }`
                }
              >
                {t(lang, item)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <InstallButton compact />
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-lg border border-tz-black/15 px-3 py-1.5 text-sm font-semibold text-tz-black/80 hover:bg-tz-black/5"
              aria-label="Badilisha lugha / Switch language"
            >
              <Globe className="h-4 w-4" />
              {lang === 'sw' ? 'SW' : 'EN'}
            </button>
            <button
              className="lg:hidden rounded-lg border border-tz-black/15 p-2 text-tz-black/80 hover:bg-tz-black/5"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-tz-black/10 px-4 pb-3 pt-2 flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-tz-green text-white' : 'text-tz-black/80 hover:bg-tz-black/5'
                  }`
                }
              >
                {t(lang, item)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-tz-black/10 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-tz-black/60">
          <p>
            {t(lang, {
              sw: 'KODI360 — jukwaa la kodi kwa Tanzania. Linafanya kazi bila mtandao.',
              en: 'KODI360 — a tax platform for Tanzania. Works fully offline.',
            })}
          </p>
          <p className="flex items-center gap-3">
            <span>Laetoli · KODI360</span>
            <NavLink to="/officer/login" className="underline decoration-dotted hover:text-tz-black">
              {t(lang, { sw: 'Afisa wa TRA', en: 'TRA Officer' })}
            </NavLink>
          </p>
        </div>
      </footer>
    </div>
  );
}
