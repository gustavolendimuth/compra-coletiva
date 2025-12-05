import { useState, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, MessageCircle } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';
import { HamburgerButton } from './HamburgerButton';
import { MobileMenu } from './MobileMenu';
import { FeedbackModal } from './FeedbackModal';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleMenuToggle = () => {
    console.log('handleMenuToggle called, current:', isMobileMenuOpen, 'new will be:', !isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCloseMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

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
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleCloseMenu} />

      <main className="flex-1 pt-16 md:pt-20">
        <div className="container-custom py-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        title="Enviar Feedback"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <footer className="bg-white border-t hidden md:block">
        <div className="container-custom py-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Este é um projeto pessoal de código aberto</p>
              <p className="mt-1">
                Se você acha este projeto útil, considere apoiar seu desenvolvimento contínuo
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://apoia.se/gustavolendimuth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                Apoiar no apoia.se
              </a>
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar Feedback
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <p>Encontrou um bug? Tem uma sugestão? Envie seu feedback!</p>
              <p className="mt-1">Sistema de Gerenciamento de Compras Coletivas</p>
            </div>
          </div>
        </div>
      </footer>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
