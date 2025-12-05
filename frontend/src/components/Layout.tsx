import { useState, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, MessageCircle } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';
import { HamburgerButton } from './HamburgerButton';
import { MobileMenu } from './MobileMenu';
import { FeedbackModal } from './FeedbackModal';
import { Footer } from './Footer';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Show footer only on campaigns list page for mobile (not on detail pages)
  const isCampaignsListPage = location.pathname === '/campaigns' || location.pathname === '/';

  // Check if on campaign detail page (has action bar on mobile)
  const isCampaignDetailPage = location.pathname.startsWith('/campaigns/') && location.pathname !== '/campaigns';

  const handleMenuToggle = () => {
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
        className={`fixed right-4 md:bottom-6 md:right-6 z-[60] bg-primary-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isCampaignDetailPage ? 'bottom-20' : 'bottom-6'
          }`}
        title="Enviar Feedback"
        aria-label="Enviar Feedback"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Footer - Show on mobile only on campaigns list page, always show on desktop */}
      <div className={isCampaignsListPage ? 'block' : 'hidden md:block'}>
        <Footer onFeedbackClick={() => setIsFeedbackModalOpen(true)} />
      </div>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
