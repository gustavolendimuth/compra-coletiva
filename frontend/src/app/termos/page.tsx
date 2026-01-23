import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Serviço',
  description: 'Termos de serviço da plataforma Compra Coletiva. Leia atentamente antes de utilizar nossos serviços.',
};

export default function TermsOfServicePage() {
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
            Termos de Serviço
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
              Bem-vindo à nossa plataforma de compras coletivas. Ao utilizar nossos serviços,
              você concorda com estes Termos de Serviço. Leia atentamente.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Ao acessar ou usar a plataforma, você concorda em ficar vinculado a estes Termos
              de Serviço e à nossa Política de Privacidade. Se você não concordar com algum
              destes termos, não utilize nossos serviços.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              2. Descrição do Serviço
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Nossa plataforma permite que usuários organizem e participem de compras coletivas,
              facilitando a gestão de pedidos, produtos e distribuição de custos de frete.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              3. Responsabilidades do Usuário
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              Ao utilizar a plataforma, você se compromete a:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a segurança de suas credenciais de acesso</li>
              <li>Não utilizar a plataforma para fins ilegais ou fraudulentos</li>
              <li>Respeitar outros usuários e organizadores</li>
              <li>Cumprir com os compromissos assumidos em campanhas</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              4. Campanhas e Pedidos
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  4.1 Organizadores
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Os organizadores são responsáveis por gerenciar suas campanhas, incluindo
                  definição de produtos, preços, prazos e distribuição de frete. A plataforma
                  atua apenas como facilitadora.
                </p>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  4.2 Participantes
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Os participantes devem verificar as informações das campanhas antes de realizar
                  pedidos e cumprir com os pagamentos conforme acordado com o organizador.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              5. Limitação de Responsabilidade
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              A plataforma não se responsabiliza por transações entre usuários, qualidade dos
              produtos, entregas ou quaisquer disputas entre organizadores e participantes.
              Recomendamos que transações sejam realizadas apenas com pessoas de confiança.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              6. Propriedade Intelectual
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Este é um projeto open source. O código-fonte está disponível sob licença que
              permite uso, modificação e distribuição, desde que respeitados os termos da licença.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              7. Modificações
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. Alterações
              significativas serão comunicadas aos usuários. O uso continuado da plataforma
              após modificações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              8. Contato
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato através do e-mail:{' '}
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
