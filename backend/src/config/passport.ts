import passport from 'passport';
import type { Request } from 'express';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Prisma, User } from '@prisma/client';
import { prisma } from '../index';
import { capitalizeName } from '../utils/nameFormatter';
import { queueWelcomeEmail } from '../services/email/emailQueue';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

/**
 * Vincula o Google a uma conta local existente (o Google já comprovou o email).
 * Conta nunca confirmada pode ter sido cadastrada por outra pessoa com este email:
 * perde a senha e as sessões, e passa a contar como verificada.
 */
async function linkGoogleAccount(
  tx: Prisma.TransactionClient,
  target: User,
  googleId: string,
  name: string
): Promise<User> {
  const wasUnverified = !target.emailVerifiedAt;
  if (wasUnverified) {
    await tx.session.deleteMany({ where: { userId: target.id } });
  }

  return tx.user.update({
    where: { id: target.id },
    data: {
      googleId,
      name,
      ...(wasUnverified && {
        password: null,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }),
    },
  });
}

const isGoogleEmailVerified = (profile: Profile): boolean => {
  const rawVerified = profile.emails?.[0]?.verified as unknown;
  return rawVerified === true || rawVerified === 'true';
};

/**
 * Vincula o Google à conta logada (perfil → "Vincular conta Google").
 * Só aceita uma conta Google com o mesmo email da conta: o login com Google
 * acha a conta pelo googleId e trocaria o email dela pelo do Google.
 * Falhas viram `info.message`, que o callback repassa ao frontend.
 */
export async function verifyGoogleLink(
  req: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback
): Promise<void> {
  try {
    const userId = req.oauthLinkUserId;
    const target = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!target || target.deletedAt) {
      return done(null, false, { message: 'auth_required' });
    }

    const googleId = profile.id;
    if (target.googleId) {
      return target.googleId === googleId
        ? done(null, target)
        : done(null, false, { message: 'already_linked' });
    }

    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email || !isGoogleEmailVerified(profile)) {
      return done(null, false, { message: 'email_not_verified' });
    }
    if (email !== target.email) {
      return done(null, false, { message: 'email_mismatch' });
    }

    const owner = await prisma.user.findUnique({ where: { googleId } });
    if (owner && !owner.deletedAt) {
      return done(null, false, { message: 'google_in_use' });
    }

    const user = await prisma.$transaction(async (tx) => {
      // Conta excluída não segura o googleId
      if (owner) {
        await tx.user.update({ where: { id: owner.id }, data: { googleId: null } });
      }
      return tx.user.update({ where: { id: target.id }, data: { googleId } });
    });
    console.log(`[Google OAuth] Linked Google account to logged-in user ${user.id}`);
    return done(null, user);
  } catch (error) {
    return done(error as Error, undefined);
  }
}

export const configurePassport = () => {
  // Only configure Google OAuth if credentials are available
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured');

    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile: Profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;

            if (!email) {
              return done(new Error('No email found in Google profile'), undefined);
            }

            const emailVerified = isGoogleEmailVerified(profile);

            const formattedName = capitalizeName(profile.displayName || email.split('@')[0]);

            // First, try to find user by googleId
            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            // Conta excluída não é reativada: libera o googleId e segue o fluxo de conta nova
            if (user && user.deletedAt) {
              await prisma.user.update({
                where: { id: user.id },
                data: { googleId: null },
              });
              console.log(`[Google OAuth] Released googleId from deleted user ${user.id}`);
              user = null;
            }

            if (user) {
              const emailChanged = user.email !== email;
              const needsNameUpdate = user.name !== formattedName;

              if (emailChanged) {
                const emailOwner = await prisma.user.findUnique({
                  where: { email },
                });

                if (emailOwner && emailOwner.id !== user.id) {
                  if (emailOwner.googleId && emailOwner.googleId !== googleId) {
                    return done(
                      new Error('Email already linked to another Google account'),
                      undefined
                    );
                  }

                  // E-mail não verificado pelo Google não vincula conta local existente
                  if (!emailVerified) {
                    return done(null, false, { message: 'email_not_verified' });
                  }

                  // Email is already in use by another account; move googleId to that account
                  user = await prisma.$transaction(async (tx) => {
                    await tx.user.update({
                      where: { id: user!.id },
                      data: { googleId: null },
                    });

                    return linkGoogleAccount(tx, emailOwner, googleId, formattedName);
                  });

                  console.log(
                    `[Google OAuth] Moved googleId to existing email owner ${user.id}`
                  );
                  return done(null, user);
                }
              }

              if (emailChanged || needsNameUpdate) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    ...(emailChanged && { email }),
                    ...(needsNameUpdate && { name: formattedName }),
                  },
                });
                console.log(`[Google OAuth] Updated user ${user.id} after login`);
              }

              return done(null, user);
            }

            // No user with this googleId, check by email
            user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) {
              if (user.googleId && user.googleId !== googleId) {
                return done(
                  new Error('Email already linked to another Google account'),
                  undefined
                );
              }

              // E-mail não verificado pelo Google não vincula conta local existente
              if (!emailVerified) {
                console.log(`[Google OAuth] Unverified email; not linking user ${user.id}`);
                return done(null, false, { message: 'email_not_verified' });
              }

              // User exists with this email but no googleId - link the accounts
              const existingUser = user;
              user = await prisma.$transaction((tx) =>
                linkGoogleAccount(tx, existingUser, googleId, formattedName)
              );
              console.log(`[Google OAuth] Linked Google account to existing user ${user.id}`);
              return done(null, user);
            }

            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                name: formattedName,
                googleId,
                password: null, // No password for Google OAuth users
                emailVerifiedAt: emailVerified ? new Date() : null,
                role: 'CUSTOMER', // Default role
                phoneCompleted: false, // OAuth users need to complete phone
                addressCompleted: false, // OAuth users need to complete address
                legalAcceptanceRequired: true, // Aceite legal obrigatório para novos usuários OAuth
              },
            });

            // Enfileirar email de boas-vindas (não bloqueia o OAuth flow)
            try {
              await queueWelcomeEmail(user.id, user.name, user.email);
              console.log(`[Google OAuth] Welcome email queued for new user ${user.id}`);
            } catch (emailError) {
              console.error('[Google OAuth] Failed to queue welcome email:', emailError);
              // Não falha o OAuth se o email falhar
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );

    passport.use(
      'google-link',
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
          passReqToCallback: true,
        },
        verifyGoogleLink
      )
    );
  } else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
  }

  // Serialize user for session (not used with JWT, but required by Passport)
  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
