import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-600 shadow-md">
        <div className="container-custom py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg md:text-xl font-bold text-white">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              Compra Coletiva
            </Link>

            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/campaigns"
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors font-semibold text-sm md:text-base ${
                  location.pathname.includes('/campaigns')
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-white hover:bg-primary-700'
                }`}
              >
                Campanhas
              </Link>

              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                <NotificationIcon />
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16 md:pt-20">
        <div className="container-custom py-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t hidden md:block">
        <div className="container-custom py-6 text-center text-sm text-gray-500">
          <p>Sistema de Gerenciamento de Compras Coletivas</p>
        </div>
      </footer>
    </div>
  );
}
