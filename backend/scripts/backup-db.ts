import shell from 'shelljs';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '../../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milisegundos
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

async function backup() {
  console.log('🗄️  BACKUP DO BANCO DE DADOS\n');

  // Validar DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada no arquivo .env');
    console.error('   Certifique-se de que o arquivo backend/.env existe e contém DATABASE_URL');
    process.exit(1);
  }

  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`📍 Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}`);

  // Criar diretório de backups se não existir
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Diretório de backups criado: ${BACKUP_DIR}`);
  }

  console.log(`\n🔄 Iniciando backup...`);
  console.log(`   Arquivo: ${path.basename(BACKUP_FILE)}`);

  // Verificar se pg_dump está disponível
  if (!shell.which('pg_dump')) {
    console.error('\n❌ pg_dump não encontrado!');
    console.error('   Instale o PostgreSQL client:');
    console.error('   - Ubuntu/Debian: sudo apt-get install postgresql-client');
    console.error('   - macOS: brew install postgresql');
    console.error('   - Windows: https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  // Executar pg_dump
  const startTime = Date.now();
  const result = shell.exec(
    `pg_dump "${DATABASE_URL}" --no-owner --no-acl --clean --if-exists > "${BACKUP_FILE}"`,
    { silent: true }
  );

  if (result.code !== 0) {
    console.error('\n❌ Erro ao criar backup!');
    console.error('   Detalhes:', result.stderr);

    // Remover arquivo de backup incompleto
    if (fs.existsSync(BACKUP_FILE)) {
      fs.unlinkSync(BACKUP_FILE);
    }

    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const stats = fs.statSync(BACKUP_FILE);
  const fileSizeInKB = (stats.size / 1024).toFixed(2);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ Backup concluído com sucesso!');
  console.log(`   ⏱️  Tempo: ${duration}s`);
  console.log(`   📊 Tamanho: ${Number(fileSizeInMB) >= 1 ? fileSizeInMB + ' MB' : fileSizeInKB + ' KB'}`);
  console.log(`   📂 Local: ${BACKUP_FILE}`);

  // Listar backups existentes
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        size: stat.size,
        date: stat.mtime,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  if (backups.length > 1) {
    console.log(`\n📚 Últimos ${backups.length} backup(s):`);
    backups.forEach((b, i) => {
      const sizeInMB = (b.size / (1024 * 1024)).toFixed(2);
      const sizeInKB = (b.size / 1024).toFixed(2);
      const sizeStr = Number(sizeInMB) >= 1 ? sizeInMB + ' MB' : sizeInKB + ' KB';
      const dateStr = b.date.toLocaleString('pt-BR');
      const isCurrent = i === 0;
      console.log(`   ${isCurrent ? '→' : ' '} ${b.name} (${sizeStr}) - ${dateStr}`);
    });
  }

  // Alerta se houver muitos backups
  const totalBackups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql')).length;
  if (totalBackups > 10) {
    console.log(`\n⚠️  Você tem ${totalBackups} backups. Considere remover backups antigos.`);
  }

  console.log('\n💡 Para restaurar este backup, execute:');
  console.log(`   npm run restore --workspace=backend`);
}

backup().catch((error) => {
  console.error('\n❌ Erro inesperado:', error.message);
  process.exit(1);
});
