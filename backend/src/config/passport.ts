import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { prisma } from '../index';
import { capitalizeName } from '../utils/nameFormatter';
import { queueWelcomeEmail } from '../services/email/emailQueue';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

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

            const formattedName = capitalizeName(profile.displayName || email.split('@')[0]);

            // First, try to find user by googleId (handles deleted users trying to login again)
            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            if (user) {
              const emailChanged = user.email !== email;
              const needsReactivation = !!user.deletedAt || !!user.deletedReason;
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

                  // Email is already in use by another account; move googleId to that account
                  user = await prisma.$transaction(async (tx) => {
                    await tx.user.update({
                      where: { id: user!.id },
                      data: { googleId: null },
                    });

                    return tx.user.update({
                      where: { id: emailOwner.id },
                      data: {
                        googleId,
                        name: formattedName,
                        deletedAt: null,
                        deletedReason: null,
                      },
                    });
                  });

                  console.log(
                    `[Google OAuth] Moved googleId to existing email owner ${user.id}`
                  );
                  return done(null, user);
                }
              }

              if (emailChanged || needsReactivation || needsNameUpdate) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    ...(emailChanged && { email }),
                    ...(needsNameUpdate && { name: formattedName }),
                    ...(needsReactivation && { deletedAt: null, deletedReason: null }),
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

              // User exists with this email but no googleId - link the accounts
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId,
                  name: formattedName,
                  deletedAt: null,
                  deletedReason: null,
                },
              });
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
                role: 'CUSTOMER', // Default role
                phoneCompleted: false, // OAuth users need to complete phone
                addressCompleted: false, // OAuth users need to complete address
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
  } else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
  }

  // Serialize user for session (not used with JWT, but required by Passport)
  passport.serializeUser((user: any, done) => {
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
