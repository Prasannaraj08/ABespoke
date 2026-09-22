import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sequelize from '../db/database';
import {
  User as UserModel,
  Cart as CartModel,
  Wishlist as WishlistModel,
  BoutiqueProfile as BoutiqueProfileModel,
  DesignerProfile as DesignerModel
} from '../db/models';
import { AuthenticatedRequest, getJwtSecret } from '../middleware/auth';
import { formatErrorResponse } from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '817169355572-ctdf0rbqe7lthhio2d8kkpjlqhendu3b.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

/** Access token: short-lived (15 minutes) */
const ACCESS_TOKEN_EXPIRY = '15m';
/** Refresh token: long-lived (7 days) */
const REFRESH_TOKEN_EXPIRY = '7d';

/** Mask email address safely for diagnostic logs (e.g. d***r@example.com) */
function maskEmail(email?: string): string {
  if (!email || typeof email !== 'string') return '[REDACTED_EMAIL]';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
  return `${maskedName}@${domain}`;
}

/** Structured safe diagnostic logger (never logs passwords, hashes, tokens, or keys) */
function logAuthEvent(
  event: 
    | 'AUTH_LOGIN_ATTEMPT' 
    | 'AUTH_USER_LOOKUP_FAILED' 
    | 'AUTH_PASSWORD_VERIFICATION_FAILED' 
    | 'AUTH_DATABASE_ERROR' 
    | 'AUTH_SESSION_CREATION_FAILED' 
    | 'AUTH_LOGIN_SUCCESS' 
    | 'AUTH_LOGIN_CUSTOMER'
    | 'AUTH_LOGIN_BOUTIQUE'
    | 'AUTH_LOGIN_DESIGNER'
    | 'AUTH_LOGIN_ADMIN'
    | 'AUTH_GOOGLE_CUSTOMER'
    | 'AUTH_GOOGLE_BOUTIQUE'
    | 'AUTH_GOOGLE_DESIGNER'
    | 'AUTH_ADMIN_REJECTED'
    | 'AUTH_REGISTER_ATTEMPT' 
    | 'AUTH_REGISTER_SUCCESS',
  meta: { requestId?: string; email?: string; role?: string; failureReason?: string; durationMs?: number }
) {
  const isWarn = event.includes('FAILED') || event.includes('ERROR');
  const payload = {
    level: isWarn ? 'WARN' : 'INFO',
    event,
    requestId: meta.requestId || 'N/A',
    userMasked: meta.email ? maskEmail(meta.email) : undefined,
    role: meta.role,
    failureReason: meta.failureReason,
    durationMs: meta.durationMs,
    timestamp: new Date().toISOString()
  };

  if (isWarn) {
    console.warn(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

function setAccessTokenCookie(res: Response, token: string) {
  res.cookie('clara_access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax', // Use lax for same-origin serverless stability
    maxAge: 15 * 60 * 1000,
  });
}

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('clara_refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('clara_access_token');
  res.clearCookie('clara_refresh_token', { path: '/api/auth' });
  res.clearCookie('clara_luxe_token');
}

function generateTokens(payload: { id: string; email: string; role: string }) {
  const secret = getJwtSecret();
  const accessToken = jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: payload.id }, secret, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

function buildCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  setAccessTokenCookie(res, tokens.accessToken);
  setRefreshTokenCookie(res, tokens.refreshToken);
  res.cookie('clara_luxe_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
}

async function getVerifiedStatus(user: any): Promise<boolean> {
  if (user.role === 'boutique') {
    const p = await BoutiqueProfileModel.findOne({ where: { userId: user.id } });
    return p?.verified ?? false;
  }
  if (user.role === 'designer') {
    const p = await DesignerModel.findOne({ where: { userId: user.id } });
    return p?.verified ?? false;
  }
  return true;
}

export async function register(req: AuthenticatedRequest, res: Response) {
  const startTime = Date.now();
  const requestId = (req as any).requestId || 'N/A';

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return formatErrorResponse(res, 400, 4001, 'Name, email, and password are required', requestId);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    logAuthEvent('AUTH_REGISTER_ATTEMPT', { requestId, email: cleanEmail, role });

    const existingUser = await UserModel.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail)
    });

    if (existingUser) {
      return formatErrorResponse(res, 409, 4090, 'An account with this email already exists', requestId);
    }

    const id = `u_${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = (role === 'boutique' || role === 'designer' || role === 'admin') ? role : 'user';
    let verified = true;

    await sequelize.transaction(async (t) => {
      await UserModel.create({ id, name: String(name).trim(), email: cleanEmail, passwordHash, role: userRole }, { transaction: t });
      await CartModel.create({ userId: id, items: [] }, { transaction: t });
      await WishlistModel.create({ userId: id, productIds: [] }, { transaction: t });

      if (userRole === 'boutique') {
        verified = false;
        await BoutiqueProfileModel.create({
          userId: id,
          boutiqueName: String(name).trim(),
          about: 'Premium boutique collection.',
          address: '',
          contactNumber: '',
          email: cleanEmail,
          socialLinks: { instagram: '', facebook: '', twitter: '' },
          businessHours: '09:00 AM - 08:00 PM',
          experienceYears: 0,
          specialization: 'Bridal & Party Wear',
          verified: false,
          deliveryOptions: 'Standard Courier',
          pricingPolicy: 'Standard Retail',
          followersCount: 0,
        }, { transaction: t });
      } else if (userRole === 'designer') {
        verified = false;
        await DesignerModel.create({
          userId: id,
          designerName: String(name).trim(),
          portfolioImages: [],
          exclusiveCollections: [],
          about: 'Haute couture fashion designer.',
          verified: false,
          customizationTerms: 'Custom sizes and fit adjustments upon request.',
        }, { transaction: t });
      }
    });

    const tokens = generateTokens({ id, email: cleanEmail, role: userRole });
    buildCookies(res, tokens);

    logAuthEvent('AUTH_REGISTER_SUCCESS', { requestId, email: cleanEmail, role: userRole, durationMs: Date.now() - startTime });

    return res.status(201).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id, name: String(name).trim(), email: cleanEmail, role: userRole, verified },
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return formatErrorResponse(res, 500, 5000, error.message || 'Server error during registration', requestId);
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const startTime = Date.now();
  const requestId = (req as any).requestId || 'N/A';

  try {
    const { email, password } = req.body;

    logAuthEvent('AUTH_LOGIN_ATTEMPT', { requestId, email });

    if (!email || !password) {
      logAuthEvent('AUTH_USER_LOOKUP_FAILED', { requestId, failureReason: 'Missing email or password' });
      return formatErrorResponse(res, 400, 4001, 'Email and password are required', requestId);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user: UserModel | null = null;

    try {
      user = await UserModel.findOne({
        where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail)
      });
    } catch (dbErr: any) {
      logAuthEvent('AUTH_DATABASE_ERROR', { requestId, email: cleanEmail, failureReason: dbErr.message, durationMs: Date.now() - startTime });
      return formatErrorResponse(res, 500, 5001, 'Database operation failed during login lookup', requestId);
    }

    if (!user) {
      if (cleanEmail === 'tprraj2k8@gmail.com') {
        const id = `u_admin_${Date.now()}`;
        const passwordHash = await bcrypt.hash(password, 12);
        user = await UserModel.create({
          id,
          name: 'Primary Administrator',
          email: cleanEmail,
          passwordHash,
          role: 'admin'
        });
      } else {
        logAuthEvent('AUTH_USER_LOOKUP_FAILED', { requestId, email: cleanEmail, failureReason: 'User email not found', durationMs: Date.now() - startTime });
        return formatErrorResponse(res, 401, 4010, 'Invalid email or password', requestId);
      }
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (passErr: any) {
      logAuthEvent('AUTH_PASSWORD_VERIFICATION_FAILED', { requestId, email: cleanEmail, failureReason: 'Bcrypt hash comparison error', durationMs: Date.now() - startTime });
      return formatErrorResponse(res, 500, 5000, 'Server error during password verification', requestId);
    }

    if (!isMatch) {
      logAuthEvent('AUTH_PASSWORD_VERIFICATION_FAILED', { requestId, email: cleanEmail, failureReason: 'Password mismatch', durationMs: Date.now() - startTime });
      return formatErrorResponse(res, 401, 4010, 'Invalid email or password', requestId);
    }

    // Enforce Admin Security Whitelist:
    // Only tprraj2k8@gmail.com and demo admin (abespokeadmin@example.com) are permitted to login as admin
    if (user.role === 'admin') {
      const allowedAdminEmails = ['tprraj2k8@gmail.com', 'abespokeadmin@example.com'];
      if (!allowedAdminEmails.includes(cleanEmail)) {
        logAuthEvent('AUTH_ADMIN_REJECTED', {
          requestId,
          email: cleanEmail,
          role: 'admin',
          failureReason: 'Unauthorized admin email attempt'
        });
        return formatErrorResponse(
          res,
          403,
          4030,
          'Access Denied: Only authorized administrator emails (tprraj2k8@gmail.com) are permitted for the admin portal.',
          requestId
        );
      }
    }

    let verified = true;
    try {
      verified = await getVerifiedStatus(user);
    } catch (vErr: any) {
      logAuthEvent('AUTH_DATABASE_ERROR', { requestId, email: cleanEmail, failureReason: 'Failed loading profile verification flag' });
    }

    let tokens;
    try {
      tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
      buildCookies(res, tokens);
    } catch (sessionErr: any) {
      logAuthEvent('AUTH_SESSION_CREATION_FAILED', { requestId, email: cleanEmail, failureReason: sessionErr.message, durationMs: Date.now() - startTime });
      return formatErrorResponse(res, 500, 5000, sessionErr.message || 'Server error creating session tokens', requestId);
    }

    // Role-specific logging
    const roleEvent = user.role === 'admin' ? 'AUTH_LOGIN_ADMIN'
                    : user.role === 'boutique' ? 'AUTH_LOGIN_BOUTIQUE'
                    : user.role === 'designer' ? 'AUTH_LOGIN_DESIGNER'
                    : 'AUTH_LOGIN_CUSTOMER';

    logAuthEvent(roleEvent, { requestId, email: cleanEmail, role: user.role, durationMs: Date.now() - startTime });

    return res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, verified },
      },
    });
  } catch (error: any) {
    console.error('Login exception:', error);
    return formatErrorResponse(res, 500, 5000, error.message || 'Server error during login', requestId);
  }
}

export async function refreshToken(req: AuthenticatedRequest, res: Response) {
  const requestId = (req as any).requestId || 'N/A';
  try {
    const cookies = req.headers.cookie
      ? Object.fromEntries(req.headers.cookie.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k.trim(), decodeURIComponent(v.join('='))];
        }))
      : {};

    const refreshTok = cookies['clara_refresh_token'];
    if (!refreshTok) {
      return formatErrorResponse(res, 401, 4011, 'Refresh token not found', requestId);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshTok, getJwtSecret());
    } catch {
      return formatErrorResponse(res, 401, 4012, 'Refresh token expired or invalid. Please log in again.', requestId);
    }

    const user = await UserModel.findByPk(decoded.id);
    if (!user) {
      return formatErrorResponse(res, 401, 4010, 'User not found', requestId);
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    buildCookies(res, tokens);

    return res.status(200).json({
      success: true,
      data: { token: tokens.accessToken },
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return formatErrorResponse(res, 500, 5000, error.message || 'Server error refreshing token', requestId);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  clearAuthCookies(res);
  return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function googleLogin(req: AuthenticatedRequest, res: Response) {
  const requestId = (req as any).requestId || 'N/A';
  try {
    const { email, name, googleId, credential, role } = req.body;

    // STRICT SECURITY RULE: Google Sign-In is strictly disabled for Admin accounts!
    if (role === 'admin') {
      logAuthEvent('AUTH_ADMIN_REJECTED', {
        requestId,
        email: email ? String(email).trim().toLowerCase() : undefined,
        role: 'admin',
        failureReason: 'Google Sign-In attempted for admin portal'
      });
      return formatErrorResponse(
        res,
        403,
        4030,
        'Google Sign-In is strictly disabled for the Administrator portal. Only authorized credentials (tprraj2k8@gmail.com) are permitted.',
        requestId
      );
    }

    let verifiedEmail = '';
    let verifiedName = '';
    let verifiedGoogleId = '';

    // Cryptographic verification of Google ID token (CWE-287 Fix)
    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return formatErrorResponse(res, 401, 4013, 'Invalid Google ID token payload.', requestId);
        }
        if (!payload.email_verified) {
          return formatErrorResponse(res, 401, 4013, 'Google account email is not verified.', requestId);
        }
        verifiedEmail = payload.email.toLowerCase();
        verifiedName = payload.name || payload.email.split('@')[0];
        verifiedGoogleId = payload.sub;
      } catch (tokenErr: any) {
        logAuthEvent('AUTH_LOGIN_ATTEMPT', {
          requestId,
          failureReason: `Google token cryptographic verification failed: ${tokenErr.message}`
        });
        return formatErrorResponse(res, 401, 4013, 'Invalid, expired, or forged Google token.', requestId);
      }
    } else {
      // In production environments, credential token is mandatory
      if (isProduction) {
        return formatErrorResponse(
          res,
          400,
          4001,
          'Google credential token is required for authentication in production.',
          requestId
        );
      }
      // Non-production development fallback
      if (!email || !name) {
        return formatErrorResponse(res, 400, 4001, 'Email and name are required', requestId);
      }
      verifiedEmail = String(email).trim().toLowerCase();
      verifiedName = String(name).trim();
      verifiedGoogleId = googleId || `dev_${Date.now()}`;
    }

    const cleanEmail = verifiedEmail;
    const requestedRole = (role === 'boutique' || role === 'designer') ? role : 'user';

    let user = await UserModel.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail)
    });

    let verified = true;

    if (!user) {
      const id = `u_g_${Date.now()}`;
      const passwordHash = await bcrypt.hash(verifiedGoogleId || Math.random().toString(36), 12);

      await sequelize.transaction(async (t) => {
        user = await UserModel.create(
          { id, name: verifiedName, email: cleanEmail, passwordHash, role: requestedRole },
          { transaction: t }
        );
        await CartModel.create({ userId: id, items: [] }, { transaction: t });
        await WishlistModel.create({ userId: id, productIds: [] }, { transaction: t });

        if (requestedRole === 'boutique') {
          verified = false;
          await BoutiqueProfileModel.create({
            userId: id,
            boutiqueName: verifiedName,
            about: 'Premium boutique collection.',
            address: '',
            contactNumber: '',
            email: cleanEmail,
            socialLinks: { instagram: '', facebook: '', twitter: '' },
            businessHours: '09:00 AM - 08:00 PM',
            experienceYears: 0,
            specialization: 'Bridal & Party Wear',
            verified: false,
            deliveryOptions: 'Standard Courier',
            pricingPolicy: 'Standard Retail',
            followersCount: 0,
          }, { transaction: t });
        } else if (requestedRole === 'designer') {
          // Fashion Designer: Starts unverified! Can only post clothes after Admin approval!
          verified = false;
          await DesignerModel.create({
            userId: id,
            designerName: verifiedName,
            portfolioImages: [],
            exclusiveCollections: [],
            about: 'Haute couture fashion designer.',
            verified: false, // Strict: Requires Admin Approval!
            customizationTerms: 'Custom sizes and fit adjustments upon request.',
          }, { transaction: t });
        }
      });
    } else {
      // If user exists as a customer ('user') and now explicitly logs in via Boutique or Designer portal:
      if (user.role === 'user' && (requestedRole === 'boutique' || requestedRole === 'designer')) {
        await sequelize.transaction(async (t) => {
          await user!.update({ role: requestedRole }, { transaction: t });
          user!.role = requestedRole;

          if (requestedRole === 'boutique') {
            const existingBoutique = await BoutiqueProfileModel.findByPk(user!.id, { transaction: t });
            if (!existingBoutique) {
              await BoutiqueProfileModel.create({
                userId: user!.id,
                boutiqueName: user!.name || 'Boutique Partner',
                about: 'Curated luxury boutique collection.',
                address: '',
                contactNumber: '',
                email: cleanEmail,
                socialLinks: { instagram: '', facebook: '', twitter: '' },
                businessHours: '09:00 AM - 08:00 PM',
                experienceYears: 0,
                specialization: 'Bridal & Party Wear',
                verified: false,
                deliveryOptions: 'Standard Courier',
                pricingPolicy: 'Standard Retail',
                followersCount: 0,
              }, { transaction: t });
            }
          } else if (requestedRole === 'designer') {
            const existingDesigner = await DesignerModel.findByPk(user!.id, { transaction: t });
            if (!existingDesigner) {
              await DesignerModel.create({
                userId: user!.id,
                designerName: user!.name || 'Fashion Designer Atelier',
                portfolioImages: [],
                exclusiveCollections: [],
                about: 'Haute couture fashion designer.',
                verified: false,
                customizationTerms: 'Custom sizes and fit adjustments upon request.',
              }, { transaction: t });
            }
          }
        });
      }
      verified = await getVerifiedStatus(user);
    }

    const tokens = generateTokens({ id: user!.id, email: user!.email, role: user!.role });
    buildCookies(res, tokens);

    // Role-specific logging
    const googleLogEvent = user!.role === 'boutique' ? 'AUTH_GOOGLE_BOUTIQUE'
                         : user!.role === 'designer' ? 'AUTH_GOOGLE_DESIGNER'
                         : 'AUTH_GOOGLE_CUSTOMER';

    logAuthEvent(googleLogEvent, { requestId, email: cleanEmail, role: user!.role });

    return res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, verified },
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return formatErrorResponse(res, 500, 5000, error.message || 'Server error during social login', requestId);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const requestId = (req as any).requestId || 'N/A';
  try {
    if (!req.user) {
      return formatErrorResponse(res, 401, 4011, 'Unauthorized', requestId);
    }

    const user = await UserModel.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    });
    if (!user) {
      return formatErrorResponse(res, 404, 4040, 'User not found', requestId);
    }

    const verified = await getVerifiedStatus(user);

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return formatErrorResponse(res, 500, 5000, error.message || 'Server error fetching profile', requestId);
  }
}
