/**
 * Health Check Endpoint
 *
 * Endpoint simples para verificação de saúde da aplicação.
 * Usado pelo Railway e outros serviços de orquestração para
 * verificar se o container está saudável e pronto para receber tráfego.
 *
 * @returns JSON com status 200 e timestamp
 */
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'compra-coletiva-frontend'
    },
    { status: 200 }
  );
}
