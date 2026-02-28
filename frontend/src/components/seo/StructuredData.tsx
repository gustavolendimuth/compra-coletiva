import Script from 'next/script';

interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

type StructuredDataProps =
  | { type: 'organization'; data: Omit<OrganizationSchema, '@context' | '@type'> }
  | { type: 'website'; data: Omit<WebSiteSchema, '@context' | '@type'> }
  | { type: 'breadcrumb'; data: Omit<BreadcrumbSchema, '@context' | '@type'> }
  | { type: 'custom'; data: Record<string, unknown> };

/**
 * Componente para adicionar dados estruturados (JSON-LD) para SEO
 *
 * @example
 * // Organização
 * <StructuredData type="organization" data={{
 *   name: "Compra Coletiva",
 *   url: "https://compracoletiva.app",
 *   description: "Plataforma de compras coletivas"
 * }} />
 *
 * // Website com busca
 * <StructuredData type="website" data={{
 *   name: "Compra Coletiva",
 *   url: "https://compracoletiva.app",
 *   potentialAction: {
 *     target: "https://compracoletiva.app/campanhas?q={search_term}",
 *     "query-input": "required name=search_term"
 *   }
 * }} />
 *
 * // Breadcrumb
 * <StructuredData type="breadcrumb" data={{
 *   itemListElement: [
 *     { position: 1, name: "Home", item: "https://compracoletiva.app" },
 *     { position: 2, name: "Campanhas", item: "https://compracoletiva.app/campanhas" },
 *     { position: 3, name: "Nome da Campanha" }
 *   ]
 * }} />
 */
export function StructuredData({ type, data }: StructuredDataProps) {
  let schema: Record<string, unknown>;

  switch (type) {
    case 'organization':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        ...data,
      };
      break;
    case 'website':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        ...data,
      };
      break;
    case 'breadcrumb':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        ...data,
      };
      break;
    case 'custom':
      schema = data;
      break;
  }

  return (
    <Script
      id={`structured-data-${type}-${Math.random().toString(36).slice(2, 9)}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

