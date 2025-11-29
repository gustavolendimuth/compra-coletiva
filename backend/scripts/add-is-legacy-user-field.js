/**
 * Script para adicionar o campo isLegacyUser à tabela users
 * Este script pode ser executado via npm run migration:add-legacy-field
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando adição do campo isLegacyUser...\n');

  try {
    // Verificar se a coluna já existe
    console.log('📊 Verificando se a coluna já existe...');
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'isLegacyUser'
    `);

    if (checkColumn.length > 0) {
      console.log('✅ A coluna isLegacyUser já existe! Nada a fazer.');
      return;
    }

    console.log('📝 Adicionando coluna isLegacyUser...');
    
    // Adicionar a coluna isLegacyUser
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" 
      ADD COLUMN "isLegacyUser" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✅ Coluna isLegacyUser adicionada com sucesso!');

    // Verificar se o índice único existe
    console.log('\n📊 Verificando índice único no campo name...');
    const checkIndex = await prisma.$queryRawUnsafe(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'users_name_key'
    `);

    if (checkIndex.length > 0) {
      console.log('📝 Removendo índice único simples...');
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "users_name_key"`);
      console.log('✅ Índice removido!');
    }

    // Criar índice único parcial
    console.log('\n📝 Criando índice único parcial (apenas para usuários não-legados)...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "users_name_key" 
      ON "users"("name") 
      WHERE "isLegacyUser" = false
    `);
    console.log('✅ Índice único parcial criado com sucesso!');

    console.log('\n🎉 Migração concluída com sucesso!\n');

    // Regenerar Prisma Client para incluir o novo campo
    console.log('🔄 Regenerando Prisma Client...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client regenerado!\n');
    } catch (err) {
      console.error('⚠️  Erro ao regenerar Prisma Client:', err.message);
      console.log('Execute manualmente: npx prisma generate\n');
    }

    console.log('📌 Próximo passo: Execute "npm run fix:legacy-users" para migrar os dados legados.');

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
