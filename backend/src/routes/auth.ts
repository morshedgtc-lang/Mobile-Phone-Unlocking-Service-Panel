import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sendOtpEmail } from '../services/email';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions
  );
  return { accessToken, refreshToken };
}

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email or username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        status: 'PENDING_APPROVAL',
      },
    });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    await prisma.emailOtp.create({
      data: {
        email: data.email,
        code: otpCode,
        expiresAt,
      },
    });

    await sendOtpEmail(data.email, otpCode);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/verify-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = verifyOtpSchema.parse(req.body);

    const otp = await prisma.emailOtp.findFirst({
      where: {
        email: data.email,
        code: data.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

  await prisma.user.update({
    where: { email: data.email },
    data: { status: 'ACTIVE' },
  });

  res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/resend-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.emailOtp.updateMany({
      where: { email, verified: false },
      data: { verified: true },
    });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    await prisma.emailOtp.create({
      data: { email, code: otpCode, expiresAt },
    });

    await sendOtpEmail(email, otpCode);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({ error: 'Your account is waiting for administrator approval.' });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      res.status(403).json({ error: 'Your account has been ' + user.status.toLowerCase() });
      return;
    }

    const tokens = generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        balance: user.balance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
