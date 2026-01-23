import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade da plataforma Compra Coletiva. Saiba como coletamos, usamos e protegemos suas informações pessoais.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/campanhas"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-500">
            Última atualização: 7 de dezembro de 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
          {/* Introduction */}
          <section>
            <p className="text-base text-gray-700 leading-relaxed">
              Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas
              informações pessoais quando você utiliza nossa plataforma de compras coletivas.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              1. Informações que Coletamos
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  1.1 Informações de Cadastro
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Quando você cria uma conta, coletamos:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha criptografada</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  1.2 Informações de Uso
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Coletamos automaticamente informações sobre como você interage com a plataforma,
                  incluindo páginas visitadas, ações realizadas e horários de acesso.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              2. Como Usamos suas Informações
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Comunicar atualizações e novidades da plataforma</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              3. Compartilhamento de Dados
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Organizadores de campanhas (apenas informações necessárias para os pedidos)</li>
              <li>Provedores de serviços essenciais (hospedagem, e-mail)</li>
              <li>Autoridades legais quando exigido por lei</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              4. Segurança dos Dados
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas
              informações, incluindo criptografia de senhas, conexões seguras (HTTPS) e acesso
              restrito aos dados.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              5. Seus Direitos
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              De acordo com a LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              6. Contato
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em
              contato através do e-mail:{' '}
              <a
                href="mailto:gustavolendimuth@gmail.com"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                gustavolendimuth@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
