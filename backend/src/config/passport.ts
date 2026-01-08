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

            // First, try to find user by googleId (handles deleted users trying to login again)
            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            if (user) {
              // User with this googleId exists
              // If email changed (e.g., user was deleted and email was anonymized), update it
              if (user.email !== email) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    email,
                    name: capitalizeName(profile.displayName || email.split('@')[0]),
                    deletedAt: null, // Reactivate if was soft-deleted
                    deletedReason: null,
                  },
                });
                console.log(`[Google OAuth] Reactivated user ${user.id} with email ${email}`);
              }
            } else {
              // No user with this googleId, check by email
              user = await prisma.user.findUnique({
                where: { email },
              });

              if (user) {
                // User exists with this email but no googleId - link the accounts
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId },
                });
                console.log(`[Google OAuth] Linked Google account to existing user ${user.id}`);
              } else {
                // Create new user
                user = await prisma.user.create({
                  data: {
                    email,
                    name: capitalizeName(profile.displayName || email.split('@')[0]),
                    googleId,
                    password: null, // No password for Google OAuth users
                    role: 'CUSTOMER', // Default role
                    phoneCompleted: false, // OAuth users need to complete phone
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
              }
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
