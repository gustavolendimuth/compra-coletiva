import shell from 'shelljs';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import readline from 'readline';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '../../backups');

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function restore() {
  console.log('♻️  RESTORE DO BANCO DE DADOS\n');

  // Validar DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada no arquivo .env');
    console.error('   Certifique-se de que o arquivo backend/.env existe e contém DATABASE_URL');
    process.exit(1);
  }

  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`📍 Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}`);

  // Verificar se diretório de backups existe
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('\n❌ Diretório de backups não encontrado!');
    console.error(`   Esperado em: ${BACKUP_DIR}`);
    console.error('   Execute "npm run backup" primeiro para criar um backup.');
    process.exit(1);
  }

  // Listar backups disponíveis
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        size: stat.size,
        date: stat.mtime,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (backupFiles.length === 0) {
    console.error('\n❌ Nenhum backup encontrado!');
    console.error(`   Diretório: ${BACKUP_DIR}`);
    console.error('   Execute "npm run backup" primeiro para criar um backup.');
    process.exit(1);
  }

  console.log('\n📚 Backups disponíveis:\n');
  backupFiles.forEach((b, i) => {
    const sizeInMB = (b.size / (1024 * 1024)).toFixed(2);
    const sizeInKB = (b.size / 1024).toFixed(2);
    const sizeStr = Number(sizeInMB) >= 1 ? sizeInMB + ' MB' : sizeInKB + ' KB';
    const dateStr = b.date.toLocaleString('pt-BR');
    console.log(`   ${i + 1}. ${b.name}`);
    console.log(`      Tamanho: ${sizeStr} | Data: ${dateStr}`);
    console.log('');
  });

  // Solicitar escolha
  const answer = await askQuestion('Digite o número do backup ou caminho completo do arquivo: ');

  let backupFile: string;
  if (answer.match(/^\d+$/)) {
    const index = parseInt(answer) - 1;
    if (index < 0 || index >= backupFiles.length) {
      console.error('\n❌ Número inválido!');
      process.exit(1);
    }
    backupFile = backupFiles[index].path;
  } else {
    backupFile = path.isAbsolute(answer) ? answer : path.join(BACKUP_DIR, answer);
  }

  if (!fs.existsSync(backupFile)) {
    console.error('\n❌ Arquivo não encontrado:', backupFile);
    process.exit(1);
  }

  const backupInfo = backupFiles.find(b => b.path === backupFile);
  const sizeInMB = backupInfo ? (backupInfo.size / (1024 * 1024)).toFixed(2) : 'N/A';

  console.log('\n⚠️  ATENÇÃO: OPERAÇÃO DESTRUTIVA!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Esta operação irá:');
  console.log('  1. APAGAR TODOS os dados atuais do banco');
  console.log('  2. Restaurar os dados do backup selecionado');
  console.log('  3. Esta ação NÃO PODE ser desfeita!\n');
  console.log(`Arquivo: ${path.basename(backupFile)}`);
  console.log(`Tamanho: ${sizeInMB} MB`);
  console.log(`Data: ${backupInfo?.date.toLocaleString('pt-BR')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const confirm = await askQuestion('Digite "CONFIRMAR" (em maiúsculas) para continuar: ');

  if (confirm !== 'CONFIRMAR') {
    console.log('\n❌ Operação cancelada pelo usuário.');
    process.exit(0);
  }

  // Verificar se psql está disponível
  if (!shell.which('psql')) {
    console.error('\n❌ psql não encontrado!');
    console.error('   Instale o PostgreSQL client:');
    console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client');
    console.error('   - macOS: brew install postgresql');
    console.error('   - Windows: https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  console.log('\n🔄 Restaurando banco de dados...\n');

  // O backup já inclui DROP commands graças ao --clean --if-exists
  // Então apenas precisamos executar o arquivo SQL
  const startTime = Date.now();
  const result = shell.exec(
    `psql "${DATABASE_URL}" < "${backupFile}"`,
    { silent: false }
  );

  if (result.code !== 0) {
    console.error('\n❌ Erro ao restaurar backup!');
    console.error('   Detalhes:', result.stderr);
    console.error('\n⚠️  O banco pode estar em estado inconsistente!');
    console.error('   Tente restaurar outro backup ou entre em contato com suporte.');
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n✅ Restore concluído com sucesso!');
  console.log(`   ⏱️  Tempo: ${duration}s`);
  console.log(`   📂 Arquivo: ${path.basename(backupFile)}`);

  console.log('\n💡 Próximos passos recomendados:');
  console.log('   1. Verificar se os dados foram restaurados corretamente');
  console.log('   2. Testar a aplicação');
  console.log('   3. Executar: npx prisma generate (se necessário)');
}

restore().catch((error) => {
  console.error('\n❌ Erro inesperado:', error.message);
  process.exit(1);
});
