import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';
import { HamburgerButton } from './HamburgerButton';
import { MobileMenu } from './MobileMenu';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    console.log('Menu toggle clicked, current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  console.log('Layout render, isMobileMenuOpen:', isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-600 shadow-md">
        <div className="container-custom py-3 md:py-4">
          <div className="flex items-center justify-between h-10 md:h-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-white">
              <Users className="w-6 h-6" />
              <span className="text-lg">Compra Coletiva</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 h-full">
              <Link
                to="/campaigns"
                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-base ${location.pathname.includes('/campaigns')
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-white hover:bg-primary-700'
                  }`}
              >
                Campanhas
              </Link>

              <NewCampaignButton />

              <div className="flex items-center gap-2 bg-white rounded-lg px-2 h-full">
                <NotificationIcon />
                <UserMenu />
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={handleMenuToggle}
              />
              {/* Debug indicator */}
              <span className="ml-2 text-xs text-white">
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

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
