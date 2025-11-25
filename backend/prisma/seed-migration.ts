import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ===== CONFIGURAÇÕES DO ADMIN =====
const ADMIN_EMAIL = 'gustavolendimuth@gmail.com';
const ADMIN_NAME = 'Gustavo Lendimuth';
const ADMIN_PASSWORD = 'Admin123!'; // Você pode alterar depois via aplicação
const BCRYPT_ROUNDS = 10;
// ===================================

async function main() {
  console.log('🚀 Iniciando migração de dados para sistema de autenticação...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Criar usuário ADMIN (Gustavo)
    console.log('\n👤 CRIANDO USUÁRIO ADMIN');
    console.log('───────────────────────────────────────────────────');
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    const adminUser = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {},
      create: {
        email: ADMIN_EMAIL,
        password: adminPassword,
        name: ADMIN_NAME,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin criado com sucesso!`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Senha: ${ADMIN_PASSWORD} (você pode alterar depois)\n`);

    // 2. Criar usuário Sistema para pedidos antigos
    console.log('🤖 CRIANDO USUÁRIO SISTEMA');
    console.log('───────────────────────────────────────────────────');
    const systemUser = await prisma.user.upsert({
      where: { email: 'sistema@compracoletiva.internal' },
      update: {},
      create: {
        email: 'sistema@compracoletiva.internal',
        password: null, // Sem senha, não pode fazer login
        name: 'Sistema (Pedidos Antigos)',
        role: 'CUSTOMER',
      },
    });
    console.log(`✅ Usuário Sistema criado com sucesso!`);
    console.log(`   Nome: ${systemUser.name}`);
    console.log(`   Email: ${systemUser.email}`);
    console.log(`   ID: ${systemUser.id}`);
    console.log(`   Observação: Este usuário não pode fazer login (sem senha)\n`);

    // 3. Atualizar campanhas existentes
    console.log('📦 MIGRANDO CAMPANHAS EXISTENTES');
    console.log('───────────────────────────────────────────────────');
    const campaigns = await prisma.campaign.findMany({
      where: { creatorId: null },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    console.log(`   Encontradas ${campaigns.length} campanha(s) sem criador\n`);

    if (campaigns.length > 0) {
      for (const campaign of campaigns) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { creatorId: adminUser.id },
        });
        console.log(`   ✓ "${campaign.name}"`);
        console.log(`     Status: ${campaign.status}`);
        console.log(`     Criada em: ${campaign.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`     Atribuída a: ${adminUser.name}\n`);
      }
      console.log(`✅ ${campaigns.length} campanha(s) atribuída(s) ao admin\n`);
    } else {
      console.log('   ℹ️  Nenhuma campanha encontrada para migrar\n');
    }

    // 4. Atualizar pedidos existentes
    console.log('🛒 MIGRANDO PEDIDOS EXISTENTES');
    console.log('───────────────────────────────────────────────────');
    const orders = await prisma.order.findMany({
      where: { userId: null },
      select: {
        id: true,
        customerName: true,
        total: true,
        isPaid: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Encontrados ${orders.length} pedido(s) sem usuário\n`);

    if (orders.length > 0) {
      for (const order of orders) {
        await prisma.order.update({
          where: { id: order.id },
          data: { userId: systemUser.id },
        });
        const statusPagamento = order.isPaid ? '✓ Pago' : '✗ Não pago';
        console.log(`   ✓ Pedido de "${order.customerName}"`);
        console.log(`     Valor: R$ ${order.total.toFixed(2)}`);
        console.log(`     Status: ${statusPagamento}`);
        console.log(`     Data: ${order.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`     Atribuído a: ${systemUser.name}\n`);
      }
      console.log(`✅ ${orders.length} pedido(s) atribuído(s) ao Sistema\n`);
    } else {
      console.log('   ℹ️  Nenhum pedido encontrado para migrar\n');
    }

    // 5. Verificar mensagens (não deve ter, mas por garantia)
    console.log('💬 VERIFICANDO MENSAGENS');
    console.log('───────────────────────────────────────────────────');
    const messages = await prisma.orderMessage.count({
      where: { senderId: null },
    });

    if (messages > 0) {
      console.log(`   ⚠️  Encontradas ${messages} mensagem(s) sem senderId`);
      console.log('   Mensagens antigas não serão migradas automaticamente.');
      console.log('   O sistema de chat ainda não estava em produção.\n');
    } else {
      console.log('   ✅ Nenhuma mensagem para migrar (esperado)\n');
    }

    // 6. Estatísticas finais
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stats = {
      users: await prisma.user.count(),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      customers: await prisma.user.count({ where: { role: 'CUSTOMER' } }),
      campaignsWithCreator: await prisma.campaign.count({ where: { creatorId: { not: null } } }),
      totalCampaigns: await prisma.campaign.count(),
      ordersWithUser: await prisma.order.count({ where: { userId: { not: null } } }),
      totalOrders: await prisma.order.count(),
    };

    console.log(`   👥 Total de Usuários: ${stats.users}`);
    console.log(`      ├─ Admins: ${stats.admins}`);
    console.log(`      └─ Customers: ${stats.customers}\n`);

    console.log(`   📦 Campanhas: ${stats.campaignsWithCreator}/${stats.totalCampaigns} com criador\n`);
    console.log(`   🛒 Pedidos: ${stats.ordersWithUser}/${stats.totalOrders} com usuário\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  PRÓXIMOS PASSOS:');
    console.log('   1. Validar os dados no banco');
    console.log('   2. Testar login com as credenciais do admin');
    console.log('   3. Aplicar Migration 2 (tornar campos obrigatórios)');
    console.log('   4. Implementar rotas de autenticação\n');

    console.log('💡 CREDENCIAIS DE ACESSO:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log('   (Altere a senha após primeiro login)\n');

  } catch (error) {
    console.error('\n❌ ERRO durante a migração:', error);
    console.error('\n⚠️  A migração foi interrompida!');
    console.error('   Você pode restaurar o backup se necessário:');
    console.error('   npm run restore --workspace=backend\n');
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
