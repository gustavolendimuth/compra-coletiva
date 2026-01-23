'use client';

import Link from 'next/link';
import { Users, MessageCircle, Heart, Mail, ExternalLink } from 'lucide-react';

interface FooterProps {
  onFeedbackClick: () => void;
}

export function Footer({ onFeedbackClick }: FooterProps) {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
      <div className="container-custom py-6 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 lg:gap-8 pb-6 md:pb-8 border-b border-gray-200">
          {/* About Section */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
              <h3 className="text-base md:text-lg font-bold text-gray-900">Compra Coletiva</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sistema open source para gerenciamento inteligente de compras coletivas com controle de pedidos e distribuição automática de frete.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/gustavolendimuth"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="GitHub"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="mailto:gustavolendimuth@gmail.com"
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Email"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Hidden on mobile */}
          <div className="hidden md:block space-y-4">
            <h3 className="text-base font-bold text-gray-900">Links Rápidos</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/campanhas"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Campanhas Ativas</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <button
                  onClick={onFeedbackClick}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Enviar Feedback</span>
                  <MessageCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Política de Privacidade</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Termos de Serviço</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/gustavolendimuth/compra-coletiva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Código Fonte</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Features - Hidden on mobile */}
          <div className="hidden md:block space-y-4">
            <h3 className="text-base font-bold text-gray-900">Funcionalidades</h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></span>
                <span>Criação e gestão de campanhas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></span>
                <span>Distribuição automática de frete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></span>
                <span>Chat e Q&A em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 flex-shrink-0"></span>
                <span>Controle financeiro preciso</span>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base font-bold text-gray-900">Apoie o Projeto</h3>
            <p className="text-sm text-gray-600 leading-relaxed hidden md:block">
              Este é um projeto open source. Seu apoio ajuda a manter e melhorar a plataforma.
            </p>
            <div className="space-y-2.5">
              <a
                href="https://apoia.se/gustavolendimuth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all hover:shadow-md font-medium text-sm w-full md:w-auto justify-center"
              >
                <Heart className="w-4 h-4" />
                Apoiar no apoia.se
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar - With extra padding on mobile */}
        <div className="pt-4 md:pt-6 flex flex-col items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            <Link
              href="/privacidade"
              className="text-xs md:text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Privacidade
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/termos"
              className="text-xs md:text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Termos
            </Link>
          </div>
          <p className="text-center">
            © {new Date().getFullYear()} Compra Coletiva. Projeto open source.
          </p>
          <p className="text-center text-xs">
            Desenvolvido com <Heart className="w-3 h-3 inline text-red-500 fill-current" /> por{' '}
            <a
              href="https://github.com/gustavolendimuth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Gustavo Lendimuth
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
