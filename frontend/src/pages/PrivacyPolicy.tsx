import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/campaigns"
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
                  1.2 Autenticação via Google
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Quando você utiliza o login com Google, recebemos:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Nome e foto do perfil do Google</li>
                  <li>Endereço de e-mail verificado</li>
                  <li>ID único do Google (não compartilhamos com terceiros)</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2 italic">
                  Não temos acesso à sua senha do Google e não armazenamos credenciais da sua conta Google.
                </p>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                  1.3 Informações de Uso
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  Coletamos dados sobre como você usa a plataforma:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-base text-gray-700">
                  <li>Campanhas criadas e participadas</li>
                  <li>Pedidos realizados</li>
                  <li>Mensagens enviadas</li>
                  <li>Feedback e sugestões</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              2. Como Usamos suas Informações
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Criar e gerenciar sua conta</li>
                <li>Processar suas compras e pedidos</li>
                <li>Enviar notificações sobre campanhas e pedidos</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Prevenir fraudes e spam</li>
                <li>Fornecer suporte ao cliente</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              3. Compartilhamento de Informações
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                <strong>Não vendemos suas informações pessoais.</strong> Compartilhamos dados apenas quando:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>
                  <strong>Necessário para o serviço:</strong> Seu nome e informações de pedido são
                  compartilhados com o organizador da campanha para processar sua compra
                </li>
                <li>
                  <strong>Obrigação legal:</strong> Quando exigido por lei ou autoridades competentes
                </li>
                <li>
                  <strong>Proteção de direitos:</strong> Para proteger nossos direitos, privacidade,
                  segurança ou propriedade
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              4. Segurança de Dados
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Implementamos medidas de segurança para proteger suas informações:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Senhas criptografadas com bcrypt</li>
                <li>Conexões HTTPS seguras</li>
                <li>Tokens de autenticação com expiração</li>
                <li>Proteção contra XSS e injeção de código</li>
                <li>Sistema de detecção de spam</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              5. Seus Direitos (LGPD)
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar consentimento a qualquer momento</li>
                <li>Exportar seus dados em formato estruturado</li>
              </ul>
              <p className="text-base text-gray-700 leading-relaxed mt-3">
                Para exercer esses direitos, entre em contato através do e-mail:{' '}
                <a href="mailto:privacidade@compracoletiva.com" className="text-blue-600 hover:text-blue-700">
                  privacidade@compracoletiva.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              6. Cookies e Armazenamento Local
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Utilizamos armazenamento local do navegador para:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
                <li>Manter sua sessão ativa</li>
                <li>Lembrar suas preferências</li>
                <li>Melhorar o desempenho da aplicação</li>
              </ul>
              <p className="text-base text-gray-700 leading-relaxed mt-3">
                Você pode limpar esses dados a qualquer momento através das configurações do seu navegador.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              7. Integração com Google
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Nossa integração com o Google OAuth 2.0 segue as{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  políticas de dados de usuário da Google API
                </a>
                , incluindo requisitos de uso e divulgação limitados.
              </p>
              <p className="text-base text-gray-700 leading-relaxed">
                Usamos e transferimos informações recebidas das APIs do Google aderindo às{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  políticas de uso limitado dos serviços de API do Google
                </a>
                .
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              8. Retenção de Dados
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para
                fornecer nossos serviços. Você pode solicitar a exclusão de sua conta a qualquer momento.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              9. Alterações nesta Política
            </h2>
            <div className="space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">
                Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças
                significativas através de e-mail ou aviso na plataforma.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              10. Contato
            </h2>
            <div className="space-y-2">
              <p className="text-base text-gray-700 leading-relaxed">
                Para questões sobre esta Política de Privacidade, entre em contato:
              </p>
              <p className="text-base text-gray-700">
                <strong>E-mail:</strong>{' '}
                <a href="mailto:privacidade@compracoletiva.com" className="text-blue-600 hover:text-blue-700">
                  privacidade@compracoletiva.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/terms"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Ver Termos de Serviço
          </Link>
        </div>
      </div>
    </div>
  );
}
