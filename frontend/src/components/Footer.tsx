'use client';

import Link from 'next/link';
import { Users, MessageCircle, Heart, Mail, ExternalLink } from 'lucide-react';

interface FooterProps {
  onFeedbackClick: () => void;
}

export function Footer({ onFeedbackClick }: FooterProps) {
  return (
    <footer className="bg-sky-950 text-white">
      <div className="container-custom py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 pb-10 border-b border-sky-800/50">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-700 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Compra Coletiva</span>
            </div>
            <p className="text-sm text-sky-300/60 leading-relaxed">
              Conectando vizinhos para comprar melhor, economizar mais e fortalecer a comunidade local.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/gustavolendimuth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-sky-800/50 flex items-center justify-center hover:bg-sky-700/50 transition-colors"
                title="GitHub"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="mailto:gustavolendimuth@gmail.com"
                className="w-9 h-9 rounded-full bg-sky-800/50 flex items-center justify-center hover:bg-sky-700/50 transition-colors"
                title="Email"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="hidden md:block space-y-4">
            <h4 className="font-display font-bold text-sm text-sky-200">Plataforma</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li>
                <Link href="/campanhas" className="hover:text-white transition-colors">
                  Campanhas Ativas
                </Link>
              </li>
              <li>
                <button onClick={onFeedbackClick} className="hover:text-white transition-colors">
                  Enviar Feedback
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/gustavolendimuth/compra-coletiva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Código Fonte
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="hidden md:block space-y-4">
            <h4 className="font-display font-bold text-sm text-sky-200">Funcionalidades</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li>Criação e gestão de campanhas</li>
              <li>Distribuição automática de frete</li>
              <li>Chat e Q&A em tempo real</li>
              <li>Controle financeiro preciso</li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-sky-200">Legal</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <a
                href="https://apoia.se/gustavolendimuth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-xl hover:from-sky-700 hover:to-sky-800 transition-all font-medium text-sm"
              >
                <Heart className="w-4 h-4" />
                Apoiar no apoia.se
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sky-400/50">
            © {new Date().getFullYear()} Compra Coletiva. Feito com{' '}
            <Heart className="w-3 h-3 inline text-red-400 fill-current" /> pela comunidade.
          </p>
          <p className="text-sm text-sky-400/50">
            Desenvolvido por{' '}
            <a
              href="https://github.com/gustavolendimuth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-white font-medium transition-colors"
            >
              Gustavo Lendimuth
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
