import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description:
    "Termos de Serviço da plataforma Compra Coletiva, incluindo regras de uso e isenção de responsabilidade por vendas entre usuários.",
};

export default function TermsOfServicePage() {
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
            Termos de Serviço
          </h1>
          <p className="text-sm text-gray-500">
            Versão: 2026-03-12
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
          <section>
            <p className="text-base text-gray-700 leading-relaxed">
              Estes Termos de Serviço regulam o uso da plataforma Compra Coletiva.
              Ao criar conta ou utilizar o sistema, você declara que leu e concorda
              com este documento e com a Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              1. Objeto da Plataforma
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              A plataforma oferece infraestrutura digital para organização de
              campanhas, registro de pedidos, comunicação e acompanhamento de
              status entre usuários.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              2. Cadastro e Conta
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>Você deve fornecer dados verdadeiros e atualizados.</li>
              <li>Você é responsável pela segurança da sua conta e credenciais.</li>
              <li>Contas podem ser suspensas em caso de fraude, abuso ou uso indevido.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              3. Regras de Uso
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-2 text-base text-gray-700">
              <li>É proibido usar a plataforma para fins ilegais.</li>
              <li>É proibido publicar conteúdo enganoso, ofensivo ou fraudulento.</li>
              <li>Usuários devem respeitar prazos e condições informadas nas campanhas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              4. Campanhas, Pedidos e Pagamentos
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Organizadores definem produtos, preços, frete, condições e prazos.
              Participantes são responsáveis por validar essas informações antes
              de concluir seus pedidos e pagamentos.
            </p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              5. Isenção de Responsabilidade por Vendas
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-3">
              A plataforma <strong>não é vendedora, revendedora, fornecedora ou intermediadora financeira</strong>.
              A relação de compra e venda ocorre exclusivamente entre os usuários.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Não nos responsabilizamos por preço, qualidade, quantidade, entrega,
              trocas, devoluções, inadimplência, chargeback, golpes, vícios de produto
              ou qualquer disputa entre organizadores e participantes.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              6. Limitação de Responsabilidade Técnica
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Empregamos medidas razoáveis de segurança e disponibilidade, mas não
              garantimos operação ininterrupta ou sem falhas. Em caso de
              indisponibilidade, responsabilidade máxima limita-se ao restabelecimento
              técnico do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              7. Privacidade e LGPD
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              O tratamento de dados pessoais segue a Política de Privacidade e a
              legislação aplicável, incluindo a Lei nº 13.709/2018 (LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              8. Alterações destes Termos
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Podemos atualizar estes Termos periodicamente. A versão vigente estará
              sempre publicada nesta página. O uso contínuo após atualização indica
              concordância com o novo texto.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              9. Contato
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Para dúvidas jurídicas, privacidade ou exercício de direitos, utilize:
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
