/**
 * Template Registry - Centraliza todos os templates de email
 * Renderiza templates React Email para HTML
 */

import { render } from '@react-email/components';
import { NotificationType } from '@prisma/client';
import { LinkBuilder, NotificationMetadata } from '../../../utils/linkBuilder';

// Import templates
import {
  CampaignReadyToSend,
  CampaignReadyToSendProps,
} from './notifications/CampaignReadyToSend';
import { NewMessage, NewMessageProps } from './notifications/NewMessage';
import { CampaignArchived, CampaignArchivedProps } from './notifications/CampaignArchived';
import { PaymentReleased, PaymentReleasedProps } from './notifications/PaymentReleased';
import { Welcome, WelcomeProps } from './system/Welcome';
import { PasswordReset, PasswordResetProps } from './system/PasswordReset';
import { OrderCreated, OrderCreatedProps } from './system/OrderCreated';
import { VerifyEmail, VerifyEmailProps } from './system/VerifyEmail';

export interface EmailTemplateData {
  userName: string;
  userId: string;
  title: string;
  message: string;
  metadata: NotificationMetadata;
}

export interface RenderedEmail {
  html: string;
  subject: string;
  templateName: string;
}

/**
 * Renderiza template de notificação
 */
export async function renderNotificationEmail(
  type: NotificationType,
  data: EmailTemplateData
): Promise<RenderedEmail> {
  const unsubscribeUrl = LinkBuilder.buildUnsubscribeLink(data.userId);
  const preferencesUrl = LinkBuilder.buildPreferencesLink();
  const actionUrl = LinkBuilder.buildNotificationLink(type, data.metadata);

  let html: string;
  let subject: string;
  let templateName: string;

  switch (type) {
    case 'CAMPAIGN_READY_TO_SEND': {
      const props: CampaignReadyToSendProps = {
        userName: data.userName,
        campaignName: data.metadata.campaignName || 'Campanha',
        actionUrl,
        unsubscribeUrl,
        preferencesUrl,
      };
      html = await render(CampaignReadyToSend(props));
      subject = `🎉 ${data.metadata.campaignName} pronta para enviar!`;
      templateName = 'campaign-ready-to-send';
      break;
    }

    case 'NEW_MESSAGE': {
      const props: NewMessageProps = {
        userName: data.userName,
        senderName: data.metadata.senderName || 'Usuário',
        messagePreview: data.message,
        campaignName: data.metadata.campaignName || 'Campanha',
        isQuestion: data.metadata.isQuestion || false,
        actionUrl,
        unsubscribeUrl,
        preferencesUrl,
      };
      html = await render(NewMessage(props));
      subject = data.metadata.isQuestion
        ? `❓ Nova pergunta em ${data.metadata.campaignName}`
        : `💬 Nova mensagem em ${data.metadata.campaignName}`;
      templateName = 'new-message';
      break;
    }

    case 'CAMPAIGN_ARCHIVED': {
      const props: CampaignArchivedProps = {
        userName: data.userName,
        campaignName: data.metadata.campaignName || 'Campanha',
        actionUrl,
        unsubscribeUrl,
        preferencesUrl,
      };
      html = await render(CampaignArchived(props));
      subject = `📦 ${data.metadata.campaignName} foi arquivada`;
      templateName = 'campaign-archived';
      break;
    }

    case 'CAMPAIGN_STATUS_CHANGED': {
      // Reutilizar template de archived por enquanto
      const props: CampaignArchivedProps = {
        userName: data.userName,
        campaignName: data.metadata.campaignName || 'Campanha',
        actionUrl,
        unsubscribeUrl,
        preferencesUrl,
      };
      html = await render(CampaignArchived(props));
      subject = `📢 Status alterado: ${data.metadata.campaignName}`;
      templateName = 'campaign-status-changed';
      break;
    }

    case 'PAYMENT_RELEASED': {
      const props: PaymentReleasedProps = {
        userName: data.userName,
        campaignName: data.metadata.campaignName || 'Campanha',
        pixKey: data.metadata.pixKey?.toString() || 'Consulte na campanha',
        pixType: data.metadata.pixType?.toString() || 'PIX',
        pixName: data.metadata.pixName?.toString(),
        actionUrl,
        unsubscribeUrl,
        preferencesUrl,
      };
      html = await render(PaymentReleased(props));
      subject = `💰 Pagamento liberado: ${data.metadata.campaignName || 'Campanha'}`;
      templateName = 'payment-released';
      break;
    }

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  return { html, subject, templateName };
}

/**
 * Renderiza template de boas-vindas
 */
export async function renderWelcomeEmail(
  userName: string,
  userId: string
): Promise<RenderedEmail> {
  const homeUrl = LinkBuilder.buildHomeLink();
  const unsubscribeUrl = LinkBuilder.buildUnsubscribeLink(userId);
  const preferencesUrl = LinkBuilder.buildPreferencesLink();

  const props: WelcomeProps = {
    userName,
    homeUrl,
    unsubscribeUrl,
    preferencesUrl,
  };

  const html = await render(Welcome(props));
  const subject = '👋 Bem-vindo ao Compra Coletiva!';
  const templateName = 'welcome';

  return { html, subject, templateName };
}

/**
 * Renderiza template de reset de senha
 */
export async function renderPasswordResetEmail(
  userName: string,
  userId: string,
  resetToken: string,
  expiresIn: string = '1 hora'
): Promise<RenderedEmail> {
  const resetUrl = `${LinkBuilder.buildHomeLink()}/reset-password?token=${resetToken}`;
  const unsubscribeUrl = LinkBuilder.buildUnsubscribeLink(userId);
  const preferencesUrl = LinkBuilder.buildPreferencesLink();

  const props: PasswordResetProps = {
    userName,
    resetUrl,
    expiresIn,
    unsubscribeUrl,
    preferencesUrl,
  };

  const html = await render(PasswordReset(props));
  const subject = '🔒 Redefinir sua senha';
  const templateName = 'password-reset';

  return { html, subject, templateName };
}

/**
 * Renderiza template de confirmação do email do cadastro
 */
export async function renderSignupVerificationEmail(
  userName: string,
  userId: string,
  verificationToken: string
): Promise<RenderedEmail> {
  const props: VerifyEmailProps = {
    userName,
    verifyUrl: `${LinkBuilder.buildHomeLink()}/verify-email?token=${verificationToken}`,
    heading: 'Confirme seu email',
    intro: 'Falta pouco para usar sua conta no Compra Coletiva. Confirme que este email e seu:',
    buttonLabel: 'Confirmar email',
    expiresIn: '24 horas',
    unsubscribeUrl: LinkBuilder.buildUnsubscribeLink(userId),
    preferencesUrl: LinkBuilder.buildPreferencesLink(),
  };

  const html = await render(VerifyEmail(props));
  return { html, subject: '✉️ Confirme seu email', templateName: 'signup-verification' };
}

/**
 * Renderiza template de confirmação da troca de email
 */
export async function renderEmailChangeVerificationEmail(
  userName: string,
  userId: string,
  verificationToken: string
): Promise<RenderedEmail> {
  const props: VerifyEmailProps = {
    userName,
    verifyUrl: `${LinkBuilder.buildHomeLink()}/perfil/verificar-email?token=${verificationToken}`,
    heading: 'Confirme seu novo email',
    intro: 'Voce pediu para trocar o email da sua conta no Compra Coletiva. Confirme o novo endereco:',
    buttonLabel: 'Confirmar novo email',
    expiresIn: '24 horas',
    unsubscribeUrl: LinkBuilder.buildUnsubscribeLink(userId),
    preferencesUrl: LinkBuilder.buildPreferencesLink(),
  };

  const html = await render(VerifyEmail(props));
  return { html, subject: '✉️ Confirme seu novo email', templateName: 'email-change-verification' };
}

/**
 * Renderiza template de pedido criado
 */
export async function renderOrderCreatedEmail(
  userName: string,
  userId: string,
  campaignName: string,
  campaignSlug: string
): Promise<RenderedEmail> {
  const actionUrl = LinkBuilder.buildCampaignLink(campaignSlug);
  const unsubscribeUrl = LinkBuilder.buildUnsubscribeLink(userId);
  const preferencesUrl = LinkBuilder.buildPreferencesLink();

  const props: OrderCreatedProps = {
    userName,
    campaignName,
    actionUrl,
    unsubscribeUrl,
    preferencesUrl,
  };

  const html = await render(OrderCreated(props));
  const subject = `🛒 Pedido criado em ${campaignName}`;
  const templateName = 'order-created';

  return { html, subject, templateName };
}
