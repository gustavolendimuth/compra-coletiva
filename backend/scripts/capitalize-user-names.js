#!/usr/bin/env node

/**
 * Script para capitalizar nomes de usuários
 *
 * Este script atualiza todos os nomes de usuários no banco de dados,
 * capitalizando a primeira letra de cada palavra.
 *
 * Uso:
 *   npm run capitalize:names
 *
 * Ou via Railway CLI:
 *   railway run npm run capitalize:names
 *
 * Ou diretamente:
 *   node scripts/capitalize-user-names.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Capitaliza a primeira letra de cada palavra em um nome
 * @param {string} name Nome a ser capitalizado
 * @returns {string} Nome com a primeira letra de cada palavra em maiúscula
 */
function capitalizeName(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }

  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

async function main() {
  console.log('🚀 Iniciando capitalização de nomes de usuários...\n');

  try {
    // Step 1: Buscar todos os usuários
    console.log('📊 Step 1: Buscando todos os usuários...');

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`   Encontrados ${allUsers.length} usuários no banco de dados\n`);

    if (allUsers.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado.\n');
      return;
    }

    // Step 2: Identificar usuários que precisam de atualização
    console.log('🔍 Step 2: Identificando usuários que precisam de atualização...');

    const usersToUpdate = allUsers.filter(user => {
      const capitalizedName = capitalizeName(user.name);
      return user.name !== capitalizedName;
    });

    console.log(`   ${usersToUpdate.length} usuários precisam de atualização`);
    console.log(`   ${allUsers.length - usersToUpdate.length} usuários já estão corretos\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ Todos os nomes já estão capitalizados corretamente!\n');
      return;
    }

    // Step 3: Mostrar exemplos de mudanças
    console.log('📋 Step 3: Exemplos de mudanças (primeiros 10):');
    console.log('   ┌────────────────────────────┬────────────────────────────┐');
    console.log('   │ Nome Atual                 │ Nome Capitalizado          │');
    console.log('   ├────────────────────────────┼────────────────────────────┤');

    usersToUpdate.slice(0, 10).forEach(user => {
      const oldName = user.name.padEnd(26).substring(0, 26);
      const newName = capitalizeName(user.name).padEnd(26).substring(0, 26);
      console.log(`   │ ${oldName} │ ${newName} │`);
    });

    console.log('   └────────────────────────────┴────────────────────────────┘');

    if (usersToUpdate.length > 10) {
      console.log(`   ... e mais ${usersToUpdate.length - 10} usuários\n`);
    } else {
      console.log('');
    }

    // Step 4: Atualizar nomes
    console.log('✏️  Step 4: Atualizando nomes...');

    let updated = 0;
    let errors = 0;

    for (const user of usersToUpdate) {
      try {
        const capitalizedName = capitalizeName(user.name);

        await prisma.user.update({
          where: { id: user.id },
          data: { name: capitalizedName },
        });

        updated++;
        process.stdout.write(`\r   Atualizados: ${updated}/${usersToUpdate.length} | Erros: ${errors}`);
      } catch (error) {
        errors++;
        process.stdout.write(`\r   Atualizados: ${updated}/${usersToUpdate.length} | Erros: ${errors}`);
        console.error(`\n   ❌ Erro ao atualizar usuário ${user.id} (${user.name}):`, error.message);
      }
    }

    console.log('\n');

    // Step 5: Relatório final
    console.log('📊 Step 5: Relatório final...');

    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });

    console.log('\n   Primeiros 10 usuários após atualização:');
    console.log('   ┌────────────────────────────────────────┐');
    console.log('   │ Nome                                   │');
    console.log('   ├────────────────────────────────────────┤');

    finalUsers.forEach(user => {
      const name = user.name.padEnd(38).substring(0, 38);
      console.log(`   │ ${name} │`);
    });

    console.log('   └────────────────────────────────────────┘');

    console.log(`\n   ✅ Total de usuários atualizados: ${updated}`);
    if (errors > 0) {
      console.log(`   ⚠️  Total de erros: ${errors}`);
    }
    console.log(`   📝 Total de usuários no banco: ${allUsers.length}`);

    console.log('\n✅ Capitalização concluída com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro durante a capitalização:', error);
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
