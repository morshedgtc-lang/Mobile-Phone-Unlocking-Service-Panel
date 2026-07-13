import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        fields: { orderBy: { sortOrder: 'asc' } },
        groupAccess: {
          include: { group: { select: { id: true, name: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(services);
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

router.get('/client', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const whereClause: Record<string, unknown> = { isActive: true };
    if (user.clientGroupId) {
      whereClause.groupAccess = { some: { groupId: user.clientGroupId } };
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        fields: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(services);
  } catch (error) {
    console.error('List client services error:', error);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

router.get('/:id', async (req, res: Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true } },
        fields: { orderBy: { sortOrder: 'asc' } },
        groupAccess: {
          include: { group: { select: { id: true, name: true } } },
        },
      },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to get service' });
  }
});

router.get('/categories/all', async (_req, res: Response) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

export default router;
