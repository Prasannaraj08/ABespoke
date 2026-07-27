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
import { AuthenticatedRequest } from '../middleware/auth';
import { JWT_SECRET_KEY } from '../middleware/auth';

const isProduction = process.env.NODE_ENV === 'production';

/** Access token: short-lived (15 minutes) */
const ACCESS_TOKEN_EXPIRY = '15m';
/** Refresh token: long-lived (7 days) */
const REFRESH_TOKEN_EXPIRY = '7d';

function setAccessTokenCookie(res: Response, token: string) {
  res.cookie('clara_access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('clara_refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth', // Restrict refresh token to auth routes only
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('clara_access_token');
  res.clearCookie('clara_refresh_token', { path: '/api/auth' });
  // Also clear old cookie name for backwards compat
  res.clearCookie('clara_luxe_token');
}

function generateTokens(payload: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: payload.id }, JWT_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

function buildCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  setAccessTokenCookie(res, tokens.accessToken);
  setRefreshTokenCookie(res, tokens.refreshToken);
  // Also set legacy cookie for backwards compatibility with existing localStorage reads
  res.cookie('clara_luxe_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
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
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required', errorCode: 4001 });
    }

    const existingUser = await UserModel.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists', errorCode: 4090 });
    }

    const id = `u_${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12); // Increased from 10 to 12 rounds
    const userRole = (role === 'boutique' || role === 'designer' || role === 'admin') ? role : 'user';
    let verified = true;

    await sequelize.transaction(async (t) => {
      await UserModel.create({ id, name, email: email.toLowerCase(), passwordHash, role: userRole }, { transaction: t });
      await CartModel.create({ userId: id, items: [] }, { transaction: t });
      await WishlistModel.create({ userId: id, productIds: [] }, { transaction: t });

      if (userRole === 'boutique') {
        verified = false;
        await BoutiqueProfileModel.create({
          userId: id,
          boutiqueName: name,
          about: 'Premium boutique collection.',
          address: '',
          contactNumber: '',
          email: email.toLowerCase(),
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
          designerName: name,
          portfolioImages: [],
          exclusiveCollections: [],
          about: 'Haute couture fashion designer.',
          verified: false,
          customizationTerms: 'Custom sizes and fit adjustments upon request.',
        }, { transaction: t });
      }
    });

    const tokens = generateTokens({ id, email: email.toLowerCase(), role: userRole });
    buildCookies(res, tokens);

    return res.status(201).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id, name, email: email.toLowerCase(), role: userRole, verified },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration', errorCode: 5000 });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', errorCode: 4001 });
    }

    const user = await UserModel.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', errorCode: 4010 });
    }

    const verified = await getVerifiedStatus(user);
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    buildCookies(res, tokens);

    return res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, verified },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login', errorCode: 5000 });
  }
}

export async function refreshToken(req: AuthenticatedRequest, res: Response) {
  try {
    // Read refresh token from cookie
    const cookies = req.headers.cookie
      ? Object.fromEntries(req.headers.cookie.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k.trim(), decodeURIComponent(v.join('='))];
        }))
      : {};

    const refreshTok = cookies['clara_refresh_token'];
    if (!refreshTok) {
      return res.status(401).json({ success: false, message: 'Refresh token not found', errorCode: 4011 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshTok, JWT_SECRET_KEY);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token expired or invalid. Please log in again.', errorCode: 4012 });
    }

    const user = await UserModel.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found', errorCode: 4010 });
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    buildCookies(res, tokens);

    return res.status(200).json({
      success: true,
      data: { token: tokens.accessToken },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Server error refreshing token', errorCode: 5000 });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  clearAuthCookies(res);
  return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function googleLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required', errorCode: 4001 });
    }

    let user = await UserModel.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      const id = `u_g_${Date.now()}`;
      const passwordHash = await bcrypt.hash(googleId || Math.random().toString(36), 12);

      await sequelize.transaction(async (t) => {
        user = await UserModel.create({ id, name, email: email.toLowerCase(), passwordHash, role: 'user' }, { transaction: t });
        await CartModel.create({ userId: id, items: [] }, { transaction: t });
        await WishlistModel.create({ userId: id, productIds: [] }, { transaction: t });
      });
    }

    const tokens = generateTokens({ id: user!.id, email: user!.email, role: user!.role });
    buildCookies(res, tokens);

    return res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, verified: true },
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during social login', errorCode: 5000 });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 4011 });
    }

    const user = await UserModel.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', errorCode: 4040 });
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
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile', errorCode: 5000 });
  }
}
