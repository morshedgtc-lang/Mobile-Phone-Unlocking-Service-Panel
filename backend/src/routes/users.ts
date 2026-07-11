import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        currency: true,
        balance: true,
        clientGroupId: true,
        createdAt: true,
        clientGroup: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (data.username && data.username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        currency: true,
        balance: true,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
