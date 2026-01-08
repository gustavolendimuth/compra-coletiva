/**
 * Script de teste para disparar notificação de email
 * Uso: tsx test-email-notification.ts
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './src/services/notificationService';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧪 Iniciando teste de notificação por email...\n');

    // 1. Buscar um usuário válido
    const user = await prisma.user.findFirst({
      where: {
        email: {
          endsWith: '@gmail.com'
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      console.error('❌ Nenhum usuário encontrado com email @gmail.com');
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // 2. Buscar uma campanha válida
    const campaign = await prisma.campaign.findFirst({
      select: {
        id: true,
        slug: true,
        name: true
      }
    });

    if (!campaign) {
      console.error('❌ Nenhuma campanha encontrada');
      process.exit(1);
    }

    console.log(`✅ Campanha encontrada: ${campaign.name}\n`);

    // 3. Criar notificação de teste (NEW_MESSAGE)
    console.log('📧 Criando notificação NEW_MESSAGE...');

    const notification = await NotificationService.createNotification(
      user.id,
      'NEW_MESSAGE',
      '🧪 Teste de notificação por email',
      'Esta é uma mensagem de teste para verificar o envio de emails.',
      {
        campaignId: campaign.id,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        messageId: 'test-message-id',
        isQuestion: true,
        senderName: 'Sistema de Testes'
      }
    );

    console.log(`✅ Notificação criada: ${notification.id}`);
    console.log('\n⏳ Aguardando processamento do email...');
    console.log('📋 Verifique os logs do backend e sua caixa de email.\n');
    console.log('💡 Para monitorar os logs em tempo real:');
    console.log('   docker-compose logs backend -f | grep -E "(EmailWorker|EmailService|GmailProvider)"\n');

    // Aguardar 5 segundos para dar tempo do worker processar
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Verificar EmailLog
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        notificationId: notification.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (emailLogs.length > 0) {
      const log = emailLogs[0];
      console.log('📨 Email Log:');
      console.log(`   Status: ${log.status}`);
      console.log(`   Provider: ${log.provider}`);
      console.log(`   Para: ${log.to}`);
      console.log(`   Assunto: ${log.subject}`);
      console.log(`   Tentativas: ${log.attempts}`);

      if (log.status === 'SENT') {
        console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
        console.log(`📬 Verifique sua caixa de email: ${user.email}`);
      } else if (log.status === 'FAILED') {
        console.log(`\n❌ FALHA AO ENVIAR EMAIL: ${log.error}`);
      } else {
        console.log(`\n⏳ Status: ${log.status}`);
      }
    } else {
      console.log('\n⚠️  Nenhum log de email encontrado. Verifique se o worker está processando.');
    }

  } catch (error) {
    console.error('\n❌ Erro durante teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
