import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const createDepositSchema = z.object({
  amount: z.number().positive(),
  transactionId: z.string().optional(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createDepositSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    const deposit = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        amount: data.amount,
        transactionId: data.transactionId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      },
    });

    res.status(201).json(deposit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit request' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const deposits = await prisma.depositRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(deposits);
  } catch (error) {
    console.error('List deposits error:', error);
    res.status(500).json({ error: 'Failed to list deposits' });
  }
});

export default router;
