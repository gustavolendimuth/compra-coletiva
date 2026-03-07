#!/usr/bin/env node

/**
 * Script para migração de usuários legados
 *
 * Este script cria usuários virtuais individuais para cada customerName
 * que estava agrupado sob "Sistema (Legado)", resolvendo o problema de
 * agregação incorreta no Railway.
 *
 * Uso:
 *   npm run fix:legacy-users
 *
 * Ou via Railway CLI:
 *   railway run npm run fix:legacy-users
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração de usuários legados...\n');

  try {
    // Step 1: Verificar usuários legados existentes
    console.log('📊 Step 1: Verificando estado atual...');

    const legacySystemUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['system@legacy.local', 'sistema@compracoletiva.internal']
        }
      },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    if (legacySystemUsers.length === 0) {
      console.log('ℹ️  Nenhum usuário "Sistema (Legado)" encontrado.');
      console.log('✅ Migração já foi aplicada ou não é necessária.\n');
      return;
    }

    console.log(`   Encontrados ${legacySystemUsers.length} usuário(s) "Sistema (Legado)"`);
    legacySystemUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): ${user._count.orders} pedidos`);
    });

    // Step 2: Buscar todos os customerNames distintos dos pedidos legados
    console.log('\n📋 Step 2: Identificando clientes legados únicos...');

    const legacyOrders = await prisma.order.findMany({
      where: {
        userId: {
          in: legacySystemUsers.map(u => u.id)
        },
        customerName: {
          not: null,
          not: ''
        }
      },
      select: {
        customerName: true
      },
      distinct: ['customerName']
    });

    const uniqueCustomerNames = legacyOrders
      .map(o => o.customerName)
      .filter(Boolean);

    console.log(`   Encontrados ${uniqueCustomerNames.length} clientes legados únicos`);

    if (uniqueCustomerNames.length === 0) {
      console.log('⚠️  Nenhum pedido legado com customerName encontrado.');
      console.log('   Nada a migrar.\n');
      return;
    }

    // Step 3: Criar usuários virtuais
    console.log('\n👥 Step 3: Criando usuários virtuais...');

    const crypto = require('crypto');
    let created = 0;
    let skipped = 0;

    for (const customerName of uniqueCustomerNames) {
      // Gerar ID e email únicos baseados no customerName
      const hash = crypto.createHash('sha256').update(customerName).digest('hex');
      const virtualUserId = `legacy-user-${hash}`;
      const virtualUserEmail = `legacy-${hash}@legacy.local`;

      try {
        // Verificar se usuário virtual já existe
        const existing = await prisma.user.findUnique({
          where: { email: virtualUserEmail }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Criar usuário virtual
        await prisma.user.create({
          data: {
            id: virtualUserId,
            email: virtualUserEmail,
            name: customerName,
            role: 'CUSTOMER',
            password: null,
            isLegacyUser: true
          }
        });

        created++;
        process.stdout.write(`\r   Criados: ${created} | Ignorados: ${skipped}`);
      } catch (error) {
        console.error(`\n   ❌ Erro ao criar usuário para "${customerName}":`, error.message);
      }
    }

    console.log(`\n   ✅ Total: ${created} usuários criados, ${skipped} já existiam`);

    // Step 4: Re-vincular pedidos aos usuários virtuais
    console.log('\n🔗 Step 4: Re-vinculando pedidos aos usuários virtuais...');

    let updated = 0;

    for (const customerName of uniqueCustomerNames) {
      const hash = crypto.createHash('sha256').update(customerName).digest('hex');
      const virtualUserEmail = `legacy-${hash}@legacy.local`;

      try {
        // Buscar usuário virtual
        const virtualUser = await prisma.user.findUnique({
          where: { email: virtualUserEmail }
        });

        if (!virtualUser) {
          console.log(`\n   ⚠️  Usuário virtual não encontrado para "${customerName}"`);
          continue;
        }

        // Atualizar pedidos
        const result = await prisma.order.updateMany({
          where: {
            userId: {
              in: legacySystemUsers.map(u => u.id)
            },
            customerName: customerName
          },
          data: {
            userId: virtualUser.id
          }
        });

        updated += result.count;
        process.stdout.write(`\r   Atualizados: ${updated} pedidos`);
      } catch (error) {
        console.error(`\n   ❌ Erro ao atualizar pedidos de "${customerName}":`, error.message);
      }
    }

    console.log(`\n   ✅ Total: ${updated} pedidos re-vinculados`);

    // Step 5: Marcar usuários "Sistema (Legado)" como legados
    console.log('\n🏷️  Step 5: Marcando usuários "Sistema (Legado)" como legados...');

    await prisma.user.updateMany({
      where: {
        email: {
          in: ['system@legacy.local', 'sistema@compracoletiva.internal']
        }
      },
      data: {
        isLegacyUser: true
      }
    });

    console.log('   ✅ Usuários marcados como legados');

    // Step 6: Relatório final
    console.log('\n📊 Step 6: Verificação final...');

    const finalLegacyUsers = await prisma.user.findMany({
      where: {
        isLegacyUser: true
      },
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: 10
    });

    console.log('\n   Top 10 usuários legados (por quantidade de pedidos):');
    console.log('   ┌─────────────────────────────────┬──────────┐');
    console.log('   │ Nome                            │ Pedidos  │');
    console.log('   ├─────────────────────────────────┼──────────┤');

    finalLegacyUsers.forEach(user => {
      const name = user.name.padEnd(31).substring(0, 31);
      const orders = String(user._count.orders).padStart(8);
      console.log(`   │ ${name} │ ${orders} │`);
    });

    console.log('   └─────────────────────────────────┴──────────┘');

    const totalLegacyOrders = await prisma.order.count({
      where: {
        customer: {
          isLegacyUser: true
        }
      }
    });

    console.log(`\n   Total de usuários legados: ${finalLegacyUsers.length}`);
    console.log(`   Total de pedidos legados: ${totalLegacyOrders}`);

    console.log('\n✅ Migração concluída com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
