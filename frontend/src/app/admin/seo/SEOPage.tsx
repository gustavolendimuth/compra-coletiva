'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { campaignApi } from '@/api';

interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  twitterHandle: string;
  googleVerification: string;
}

const defaultSettings: SEOSettings = {
  title: 'Compra Coletiva - Organize suas compras em grupo',
  description: 'Plataforma para organizar compras coletivas com amigos, família e comunidades. Economize comprando junto!',
  keywords: 'compra coletiva, compras em grupo, economia, comunidade, organização',
  ogImage: '/og-image.png',
  twitterHandle: '@compracoletiva',
  googleVerification: '',
};

export function SEOPage() {
  const [settings, setSettings] = useState<SEOSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'overview' | 'meta' | 'sitemap' | 'robots' | 'schema'>('overview');

  // Fetch campaigns for sitemap preview
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: () => campaignApi.list({ status: 'ACTIVE' }),
  });

  const campaigns = campaignsData?.data;

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'meta', label: 'Meta Tags' },
    { id: 'sitemap', label: 'Sitemap' },
    { id: 'robots', label: 'Robots.txt' },
    { id: 'schema', label: 'Schema.org' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Configurações de SEO</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações de SEO do site</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sitemap</p>
                <p className="font-semibold text-gray-900">Ativo</p>
              </div>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Ver sitemap.xml
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Robots.txt</p>
                <p className="font-semibold text-gray-900">Configurado</p>
              </div>
            </div>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Ver robots.txt
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Meta Tags</p>
                <p className="font-semibold text-gray-900">Configuradas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Graph</p>
                <p className="font-semibold text-gray-900">Ativo</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Schema.org</p>
                <p className="font-semibold text-gray-900">JSON-LD Ativo</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Campanhas Indexadas</p>
                <p className="font-semibold text-gray-900">
                  {isLoadingCampaigns ? '...' : campaigns?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Meta Tags Tab */}
      {activeTab === 'meta' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meta Tags Globais</h2>
          <p className="text-sm text-gray-600 mb-6">
            Estas configurações são definidas no código e servem como padrão para páginas que não têm meta tags específicas.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título Padrão</label>
              <Input
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Editável via código em src/app/layout.tsx</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Padrão</label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                rows={3}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Editável via código em src/app/layout.tsx</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
              <Input
                value={settings.keywords}
                onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Editável via código em src/app/layout.tsx</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Dica</h3>
            <p className="text-sm text-blue-800">
              As meta tags são geradas dinamicamente para cada página de campanha, incluindo título, descrição e imagem Open Graph específicos da campanha.
            </p>
          </div>
        </Card>
      )}

      {/* Sitemap Tab */}
      {activeTab === 'sitemap' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sitemap</h2>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Abrir sitemap.xml
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            O sitemap é gerado dinamicamente e inclui todas as páginas públicas do site.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Páginas Estáticas</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  / (Home) - Prioridade: 1.0
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  /campanhas - Prioridade: 0.9
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  /privacidade - Prioridade: 0.3
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  /termos - Prioridade: 0.3
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Campanhas Ativas ({isLoadingCampaigns ? '...' : campaigns?.length || 0})</h3>
              {isLoadingCampaigns ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : campaigns && campaigns.length > 0 ? (
                <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <li key={campaign.id} className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      /campanhas/{campaign.slug} - Prioridade: 0.8
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma campanha ativa</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Robots.txt Tab */}
      {activeTab === 'robots' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Robots.txt</h2>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Abrir robots.txt
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Configuração atual do arquivo robots.txt para controlar a indexação pelos mecanismos de busca.
          </p>

          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100">
            <pre>{`User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /perfil/
Disallow: /api/
Disallow: /auth/

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://compracoletiva.app'}/sitemap.xml`}</pre>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-900">Diretórios Bloqueados:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-100 px-1 rounded">/admin/</code> - Painel administrativo</li>
              <li>• <code className="bg-gray-100 px-1 rounded">/perfil/</code> - Páginas de perfil do usuário</li>
              <li>• <code className="bg-gray-100 px-1 rounded">/api/</code> - Endpoints da API</li>
              <li>• <code className="bg-gray-100 px-1 rounded">/auth/</code> - Páginas de autenticação</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Schema.org Tab */}
      {activeTab === 'schema' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados Estruturados (Schema.org)</h2>

          <p className="text-sm text-gray-600 mb-6">
            Dados estruturados JSON-LD são gerados automaticamente para cada página de campanha, permitindo que os mecanismos de busca entendam melhor o conteúdo.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Exemplo de JSON-LD para Campanhas</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-100 overflow-x-auto">
                <pre>{`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nome da Campanha",
  "description": "Descrição da campanha",
  "image": "URL da imagem",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "0"
  }
}`}</pre>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">✅ Benefícios dos Dados Estruturados</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Rich snippets nos resultados de busca</li>
                <li>• Melhor entendimento do conteúdo pelos buscadores</li>
                <li>• Possibilidade de aparecer em carrosséis de produtos</li>
                <li>• Melhoria na CTR (taxa de cliques)</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
