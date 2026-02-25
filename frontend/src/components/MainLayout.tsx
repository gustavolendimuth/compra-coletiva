'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationIcon } from './NotificationIcon';
import { NewCampaignButton } from './NewCampaignButton';
import { HamburgerButton } from './HamburgerButton';
import { MobileMenu } from './MobileMenu';
import { FeedbackModal } from './FeedbackModal';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isCampaignsListPage = pathname === '/campanhas' || pathname === '/';
  const isCampaignDetailPage = pathname?.startsWith('/campanhas/') && pathname !== '/campanhas';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleCloseMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fefdf8' }}>
      <nav className={`navbar-glass fixed top-0 left-0 right-0 z-50 ${isScrolled ? 'scrolled' : 'bg-transparent'}`}>
        <div className="container-custom py-4">
          <div className="flex items-center justify-between h-10 md:h-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-200/50 group-hover:shadow-sky-300/60 transition-shadow">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-sky-900 tracking-tight">Compra Coletiva</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 h-full">
              <Link
                href="/campanhas"
                className={`text-sm font-medium transition-colors ${
                  pathname?.includes('/campanhas')
                    ? 'text-sky-900 font-semibold'
                    : 'text-sky-800/70 hover:text-sky-900'
                }`}
              >
                Campanhas
              </Link>

              <div className="h-5 w-px bg-sky-200" />

              <div className="flex items-center gap-3">
                <NotificationIcon />
                <UserMenu />
              </div>

              <NewCampaignButton />
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={handleMenuToggle}
              />
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleCloseMenu} />

      <main className="flex-1 pt-20 md:pt-24">
        <div className="container-custom py-8">
          {children}
        </div>
      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className={`fixed right-4 md:bottom-6 md:right-6 z-[60] bg-gradient-to-r from-sky-500 to-sky-600 text-white p-3 md:p-4 rounded-full shadow-lg shadow-sky-300/40 hover:shadow-sky-400/50 hover:from-sky-600 hover:to-sky-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 ${
          isCampaignDetailPage ? 'bottom-20' : 'bottom-6'
        }`}
        title="Enviar Feedback"
        aria-label="Enviar Feedback"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>

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
