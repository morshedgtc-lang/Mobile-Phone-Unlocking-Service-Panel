import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const createOrderSchema = z.object({
  serviceId: z.string(),
  notes: z.string().optional(),
  fieldValues: z.array(z.object({
    serviceFieldId: z.string(),
    value: z.string(),
  })),
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account is not active' });
      return;
    }

    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { fields: true },
    });
    if (!service || !service.isActive) {
      res.status(404).json({ error: 'Service not found or inactive' });
      return;
    }

    if (user.balance < service.price) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

  const requiredFields = service.fields.filter((f: { id: string; required: boolean }) => f.required);
  for (const field of requiredFields) {
    const hasValue = data.fieldValues.some((fv: { serviceFieldId: string; value: string }) => fv.serviceFieldId === field.id && fv.value);
      if (!hasValue) {
        res.status(400).json({ error: `Field "${field.label}" is required` });
        return;
      }
    }

    const order = await prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          totalAmount: service.price,
          notes: data.notes,
          fieldValues: {
            create: data.fieldValues.map(fv => ({
              serviceFieldId: fv.serviceFieldId,
              value: fv.value,
            })),
          },
        },
        include: {
          service: true,
          fieldValues: {
            include: { serviceField: true },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: service.price } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: -service.price,
          type: 'ORDER_PAYMENT',
          description: `Order for ${service.name}`,
          reference: newOrder.id,
        },
      });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        service: { select: { id: true, name: true } },
        fieldValues: {
          include: { serviceField: { select: { id: true, label: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        service: true,
        fieldValues: {
          include: { serviceField: true },
        },
        messages: {
          include: { sender: { select: { id: true, username: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        files: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

router.post('/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const orderMessage = await prisma.orderMessage.create({
      data: {
        orderId: order.id,
        senderId: req.user!.id,
        message,
      },
      include: {
        sender: { select: { id: true, username: true, role: true } },
      },
    });

    res.status(201).json(orderMessage);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

export default router;
