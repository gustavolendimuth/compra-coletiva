import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da plataforma Compra Coletiva, com base na LGPD e descrição dos direitos dos titulares.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
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
          <p className="text-sm text-gray-500">Versão: 2026-03-12</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
          <section>
            <p className="text-base text-gray-700 leading-relaxed">
              Esta Política descreve como tratamos dados pessoais no Compra Coletiva,
              em conformidade com a Lei nº 13.709/2018 (LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              1. Dados que Coletamos
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Dados cadastrais: nome, e-mail, telefone e senha criptografada.</li>
              <li>Dados de perfil: endereço para cálculo de distância/logística.</li>
              <li>Dados operacionais: campanhas, pedidos, mensagens e notificações.</li>
              <li>Dados técnicos: IP, dispositivo, logs de autenticação e segurança.</li>
              <li>Registros de consentimento: versão e data de aceites legais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              2. Finalidades e Bases Legais
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Execução da plataforma e funcionalidades contratadas.</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
              <li>Prevenção a fraude, abuso e incidentes de segurança.</li>
              <li>Legítimo interesse para melhoria do serviço e auditoria.</li>
              <li>Consentimento, quando exigido para finalidades específicas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              3. Compartilhamento de Dados
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-3">
              Não vendemos dados pessoais. Compartilhamos apenas o necessário para:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Operação da plataforma entre participantes e organizadores.</li>
              <li>Prestadores essenciais (hospedagem, banco de dados, e-mail).</li>
              <li>Atendimento de ordens judiciais ou dever legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              4. Retenção e Eliminação
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Mantemos dados pelo tempo necessário para cumprir as finalidades
              informadas, requisitos legais e segurança. Sessões e tokens expirados
              são removidos periodicamente, e contas excluídas passam por anonimização.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              5. Direitos do Titular
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-3">
              Você pode solicitar, observados os limites legais:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Confirmação de tratamento e acesso aos dados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Portabilidade e eliminação de dados, quando cabível.</li>
              <li>Informações sobre compartilhamentos realizados.</li>
              <li>Revogação de consentimento para tratamentos baseados em consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              6. Segurança da Informação
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Adotamos controles técnicos e organizacionais para proteger os dados,
              incluindo criptografia de senha, autenticação, segregação de acesso e logs.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              7. Canal de Privacidade
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Para exercer direitos da LGPD ou esclarecer dúvidas:
              {" "}
              <a
                href="mailto:gustavolendimuth@gmail.com"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                gustavolendimuth@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
