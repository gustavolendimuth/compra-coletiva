'use client';

import Link from 'next/link';

export default function TermsOfService() {
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
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Ao acessar ou usar a plataforma, você concorda em ficar vinculado a estes Termos
                de Serviço e à nossa Política de Privacidade. Se você não concordar com algum
                destes termos, não utilize nossos serviços.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              2. Descrição do Serviço
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Nossa plataforma facilita a organização de compras coletivas, permitindo que:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Usuários criem campanhas de compra coletiva</li>
                <li>Participantes façam pedidos dentro das campanhas</li>
                <li>Organizadores gerenciem produtos, pedidos e entregas</li>
                <li>Todos se comuniquem através de mensagens e perguntas</li>
              </ul>
              <p className="text-base text-gray-700 leading-relaxed mt-3">
                <strong>Importante:</strong> Somos apenas uma plataforma facilitadora. Não somos
                responsáveis pela qualidade dos produtos, entregas ou transações entre usuários.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              3. Registro e Conta
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  3.1 Criação de Conta
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Você pode criar uma conta através de:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Registro com e-mail e senha</li>
                  <li>Login com Google OAuth 2.0</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  3.2 Responsabilidades do Usuário
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">Você concorda em:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Fornecer informações verdadeiras e atualizadas</li>
                  <li>Manter a segurança da sua senha</li>
                  <li>Não compartilhar sua conta com terceiros</li>
                  <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                  <li>Ser responsável por todas as atividades em sua conta</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  3.3 Contas com Google
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Ao usar o login com Google, você autoriza nossa plataforma a acessar seu nome,
                  e-mail e foto de perfil conforme nossa Política de Privacidade.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              4. Uso Aceitável
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                <strong>Você NÃO pode:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Usar a plataforma para atividades ilegais</li>
                <li>Publicar conteúdo ofensivo, fraudulento ou enganoso</li>
                <li>Enviar spam ou mensagens não solicitadas</li>
                <li>Tentar violar a segurança da plataforma</li>
                <li>Coletar dados de outros usuários sem consentimento</li>
                <li>Criar múltiplas contas para contornar restrições</li>
                <li>Usar bots ou scripts automatizados</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              5. Campanhas e Pedidos
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  5.1 Responsabilidade do Organizador
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  O organizador da campanha é responsável por:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Fornecer informações precisas sobre produtos</li>
                  <li>Calcular corretamente custos de frete</li>
                  <li>Processar pedidos de forma honesta</li>
                  <li>Entregar produtos conforme prometido</li>
                  <li>Comunicar-se de forma clara com participantes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  5.2 Responsabilidade do Participante
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Ao fazer um pedido, você concorda em:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Pagar o valor total do pedido</li>
                  <li>Fornecer informações de entrega corretas</li>
                  <li>Comunicar-se de forma respeitosa</li>
                  <li>Reportar problemas através da plataforma</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  5.3 Limitação de Responsabilidade
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  A plataforma <strong>NÃO é responsável</strong> por:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Qualidade ou veracidade de produtos anunciados</li>
                  <li>Atrasos ou problemas na entrega</li>
                  <li>Disputas entre organizadores e participantes</li>
                  <li>Perdas financeiras decorrentes de transações</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              6. Sistema de Reputação e Moderação
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Implementamos sistemas de moderação para proteger a comunidade:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>
                  <strong>Detecção de spam:</strong> Mensagens suspeitas recebem pontuação de spam
                </li>
                <li>
                  <strong>Limites de taxa:</strong> Restrições de envio de mensagens para prevenir abuso
                </li>
                <li>
                  <strong>Sistema de reputação:</strong> Rastreamento de comportamento do usuário
                </li>
                <li>
                  <strong>Banimento:</strong> Podemos banir usuários que violem estes termos
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              7. Propriedade Intelectual
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                A plataforma e seu conteúdo original são protegidos por direitos autorais.
                Você retém direitos sobre o conteúdo que publica (descrições, imagens), mas
                nos concede licença para exibir esse conteúdo na plataforma.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              8. Privacidade e Proteção de Dados
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Nossa coleta e uso de dados pessoais são regidos pela nossa{' '}
                <Link href="/privacidade" className="text-blue-600 hover:text-blue-700">
                  Política de Privacidade
                </Link>
                , que está em conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              9. Isenção de Garantias
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                A plataforma é fornecida "como está" e "conforme disponível", sem garantias
                de qualquer tipo. Não garantimos que o serviço será ininterrupto, seguro ou
                livre de erros.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              10. Limitação de Responsabilidade
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Na extensão máxima permitida por lei, não seremos responsáveis por quaisquer
                danos indiretos, incidentais, especiais ou consequentes decorrentes do uso ou
                incapacidade de usar a plataforma.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              11. Suspensão e Encerramento
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Podemos suspender ou encerrar sua conta a qualquer momento por:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Violação destes Termos de Serviço</li>
                <li>Comportamento fraudulento ou ilegal</li>
                <li>Envio de spam ou abuso da plataforma</li>
                <li>Solicitação do próprio usuário</li>
              </ul>
              <p className="text-base text-gray-700 leading-relaxed mt-3">
                Você pode encerrar sua conta a qualquer momento através das configurações ou
                entrando em contato conosco.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              12. Alterações nos Termos
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento.
                Mudanças significativas serão comunicadas através de e-mail ou aviso na plataforma.
                O uso continuado após as alterações constitui aceitação dos novos termos.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              13. Lei Aplicável
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.
                Qualquer disputa será resolvida nos tribunais brasileiros competentes.
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              14. Contato
            </h2>
            <div className="space-y-2">
              <p className="text-base text-gray-700 leading-relaxed">
                Para questões sobre estes Termos de Serviço, entre em contato:
              </p>
              <p className="text-base text-gray-700">
                <strong>E-mail:</strong>{' '}
                <a href="mailto:suporte@compracoletiva.com" className="text-blue-600 hover:text-blue-700">
                  suporte@compracoletiva.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/privacidade"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Ver Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
