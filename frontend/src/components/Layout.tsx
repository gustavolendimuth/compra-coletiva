import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <Users className="w-6 h-6" />
              Compra Coletiva
            </Link>

            <div className="flex gap-4">
              <Link
                to="/campaigns"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  location.pathname.includes('/campaigns')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Grupos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="container-custom py-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="container-custom py-6 text-center text-sm text-gray-500">
          <p>Sistema de Gerenciamento de Compras Coletivas</p>
        </div>
      </footer>
    </div>
  );
}
