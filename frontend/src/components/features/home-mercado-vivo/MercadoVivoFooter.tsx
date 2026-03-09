"use client";

import Link from "next/link";

export function MercadoVivoFooter() {
  return (
    <footer className="bg-sky-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Compra Coletiva</h4>
            <p className="text-sky-300/60 text-sm leading-relaxed">Conectando vizinhos para comprar melhor, economizar mais e fortalecer a comunidade local.</p>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-sky-200">Plataforma</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li><Link href="/campanhas" className="hover:text-white transition-colors">Campanhas</Link></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#comunidade" className="hover:text-white transition-colors">Comunidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-sky-200">Suporte</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li><button onClick={() => window.dispatchEvent(new CustomEvent("openAuthModal"))} className="hover:text-white transition-colors">Entrar</button></li>
              <li><a href="https://github.com/gustavolendimuth/compra-coletiva" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-sky-200">Legal</h4>
            <ul className="space-y-2.5 text-sm text-sky-300/60">
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos de uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sky-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sky-400/50">&copy; {new Date().getFullYear()} Compra Coletiva. Feito com amor pela comunidade.</p>
        </div>
      </div>
    </footer>
  );
}
