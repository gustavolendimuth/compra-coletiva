import { prisma } from "../index";
import { TokenService } from "./tokenService";

function parseEnvNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const DEFAULT_PASSWORD_RESET_RETENTION_DAYS = 30;
const DEFAULT_LEGAL_LOG_RETENTION_DAYS = 1825; // 5 anos

export async function cleanupLegalAndSecurityData() {
  const sessionsDeleted = await TokenService.cleanupExpiredSessions();

  const passwordResetRetentionDays = parseEnvNumber(
    process.env.PASSWORD_RESET_TOKEN_RETENTION_DAYS,
    DEFAULT_PASSWORD_RESET_RETENTION_DAYS
  );
  const passwordResetCutoff = new Date();
  passwordResetCutoff.setDate(
    passwordResetCutoff.getDate() - passwordResetRetentionDays
  );

  const passwordResetDeleted = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          used: true,
          createdAt: {
            lt: passwordResetCutoff,
          },
        },
      ],
    },
  });

  const legalLogRetentionDays = parseEnvNumber(
    process.env.LEGAL_ACCEPTANCE_LOG_RETENTION_DAYS,
    DEFAULT_LEGAL_LOG_RETENTION_DAYS
  );
  const legalLogCutoff = new Date();
  legalLogCutoff.setDate(legalLogCutoff.getDate() - legalLogRetentionDays);

  const legalLogsDeleted = await prisma.legalAcceptanceLog.deleteMany({
    where: {
      acceptedAt: {
        lt: legalLogCutoff,
      },
    },
  });

  const deletedTotal =
    sessionsDeleted + passwordResetDeleted.count + legalLogsDeleted.count;

  if (deletedTotal > 0) {
    console.log(
      `[LegalRetention] Cleanup complete: sessions=${sessionsDeleted}, resetTokens=${passwordResetDeleted.count}, legalLogs=${legalLogsDeleted.count}`
    );
  }

  return {
    sessionsDeleted,
    passwordResetDeleted: passwordResetDeleted.count,
    legalLogsDeleted: legalLogsDeleted.count,
  };
}

export function startLegalDataRetentionScheduler(
  intervalMs: number = parseEnvNumber(
    process.env.LEGAL_RETENTION_INTERVAL_MS,
    DEFAULT_INTERVAL_MS
  )
) {
  console.log("[LegalRetention] Starting scheduler...");

  void cleanupLegalAndSecurityData();

  const interval = setInterval(() => {
    void cleanupLegalAndSecurityData();
  }, intervalMs);

  return () => {
    clearInterval(interval);
    console.log("[LegalRetention] Scheduler stopped");
  };
}
