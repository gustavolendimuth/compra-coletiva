/**
 * Configuração centralizada do sistema de email
 */

export interface EmailConfig {
  // Provider selection
  provider: 'auto' | 'resend' | 'gmail';
  enabled: boolean;

  // Resend configuration
  resend: {
    apiKey?: string;
    fromEmail: string;
    fromName: string;
  };

  // Gmail SMTP configuration
  gmail: {
    user?: string;
    appPassword?: string;
    fromEmail: string;
    fromName: string;
  };

  // Redis configuration for BullMQ
  redis: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    url?: string;
  };

  // Queue configuration
  queue: {
    maxAttempts: number;
    retryDelay: number; // milliseconds
    rateLimit: number; // emails per minute
  };

  // Frontend URL for deep links
  frontendUrl: string;
}

/**
 * Carrega configuração de email do ambiente
 */
export function getEmailConfig(): EmailConfig {
  const config: EmailConfig = {
    // Provider selection (auto, resend, or gmail)
    provider: (process.env.EMAIL_PROVIDER || 'auto') as 'auto' | 'resend' | 'gmail',
    enabled: process.env.EMAIL_ENABLED !== 'false',

    // Resend configuration
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'Compra Coletiva <noreply@compracoletiva.com>',
      fromName: process.env.RESEND_FROM_NAME || 'Compra Coletiva',
    },

    // Gmail SMTP configuration
    gmail: {
      user: process.env.GMAIL_USER,
      appPassword: process.env.GMAIL_APP_PASSWORD,
      fromEmail: process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@gmail.com',
      fromName: process.env.GMAIL_FROM_NAME || 'Compra Coletiva',
    },

    // Redis configuration
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      username: process.env.REDIS_USERNAME || process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      url: process.env.REDIS_URL,
    },

    // Queue configuration
    queue: {
      maxAttempts: parseInt(process.env.EMAIL_MAX_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '60000', 10), // 1 minute
      rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT || '10', 10), // 10 emails/min
    },

    // Frontend URL for deep links
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };

  return config;
}

/**
 * Valida configuração de email
 * @throws Error se configuração inválida
 */
export function validateEmailConfig(config: EmailConfig): void {
  if (!config.enabled) {
    console.log('[EmailConfig] Email system is disabled (EMAIL_ENABLED=false)');
    return;
  }

  // Validate provider selection
  if (config.provider === 'resend') {
    if (!config.resend.apiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }
  } else if (config.provider === 'gmail') {
    if (!config.gmail.user || !config.gmail.appPassword) {
      throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required when EMAIL_PROVIDER=gmail');
    }
  } else if (config.provider === 'auto') {
    // Auto mode: check if at least one provider is configured
    const hasResend = !!config.resend.apiKey;
    const hasGmail = !!(config.gmail.user && config.gmail.appPassword);

    if (!hasResend && !hasGmail) {
      throw new Error(
        'EMAIL_PROVIDER=auto requires at least one provider configured:\n' +
        '- Resend: Set RESEND_API_KEY\n' +
        '- Gmail: Set GMAIL_USER and GMAIL_APP_PASSWORD'
      );
    }
  } else {
    throw new Error(`Invalid EMAIL_PROVIDER: ${config.provider}. Must be 'auto', 'resend', or 'gmail'`);
  }

  // Validate Redis configuration
  if (!config.redis.url && !config.redis.host) {
    throw new Error('Redis configuration required: Set REDIS_HOST or REDIS_URL');
  }

  // Validate frontend URL
  if (!config.frontendUrl) {
    throw new Error('FRONTEND_URL is required for deep links');
  }

  console.log('[EmailConfig] Configuration validated successfully');
  console.log('[EmailConfig] Provider:', config.provider);
  console.log('[EmailConfig] Resend configured:', !!config.resend.apiKey);
  console.log('[EmailConfig] Gmail configured:', !!(config.gmail.user && config.gmail.appPassword));
  console.log('[EmailConfig] Redis:', config.redis.url || `${config.redis.host}:${config.redis.port}`);
  console.log('[EmailConfig] Frontend URL:', config.frontendUrl);
}

/**
 * Retorna configuração de email validada
 * Lança erro se configuração inválida
 */
export function getValidatedEmailConfig(): EmailConfig {
  const config = getEmailConfig();
  validateEmailConfig(config);
  return config;
}
