import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
  clientGroupId: z.string().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  clientGroupId: z.string().nullable().optional(),
  balance: z.number().optional(),
});

const createServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  price: z.number().positive(),
  processingTime: z.string().optional(),
  sortOrder: z.number().optional(),
  groupIds: z.array(z.string()).optional(),
  fields: z.array(z.object({
    label: z.string(),
    type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'DATE', 'CHECKBOX', 'FILE']),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    sortOrder: z.number().optional(),
    options: z.string().optional(),
  })).optional(),
});

const createCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const createGroupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const creditSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  description: z.string().optional(),
});

router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, activeUsers, pendingUsers, totalOrders, pendingOrders, completedOrders, totalDeposits, pendingDeposits] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.depositRequest.count(),
      prisma.depositRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const totalRevenue = await prisma.walletTransaction.aggregate({
      where: { type: 'ORDER_PAYMENT' },
      _sum: { amount: true },
    });

    res.json({
      totalUsers,
      activeUsers,
      pendingUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalDeposits,
      pendingDeposits,
      totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        balance: true,
        currency: true,
        clientGroupId: true,
        createdAt: true,
        clientGroup: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        status: 'ACTIVE',
      },
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, username: true, role: true, status: true, balance: true },
    });
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/users/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, username: true, status: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

router.post('/users/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      select: { id: true, email: true, username: true, status: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/services', async (_req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        category: { select: { id: true, name: true } },
        fields: { orderBy: { sortOrder: 'asc' } },
        groupAccess: { include: { group: { select: { id: true, name: true } } } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(services);
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({ error: 'Failed to list services' });
  }
});

router.post('/services', async (req: AuthRequest, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);
    const { groupIds, fields, ...serviceData } = data;

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        groupAccess: groupIds ? { create: groupIds.map(groupId => ({ groupId })) } : undefined,
        fields: fields ? { create: fields } : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        fields: true,
        groupAccess: { include: { group: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.patch('/services/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { groupIds, fields, ...serviceData } = req.body;

    if (groupIds) {
      await prisma.serviceGroupAccess.deleteMany({ where: { serviceId: req.params.id } });
      if (groupIds.length > 0) {
        await prisma.serviceGroupAccess.createMany({
          data: groupIds.map((groupId: string) => ({ serviceId: req.params.id, groupId })),
        });
      }
    }

    if (fields) {
      await prisma.serviceField.deleteMany({ where: { serviceId: req.params.id } });
      if (fields.length > 0) {
        await prisma.serviceField.createMany({
          data: fields.map((f: any) => ({ ...f, serviceId: req.params.id })),
        });
      }
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: serviceData,
      include: {
        category: { select: { id: true, name: true } },
        fields: { orderBy: { sortOrder: 'asc' } },
        groupAccess: { include: { group: { select: { id: true, name: true } } } },
      },
    });

    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/services/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Service deactivated' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

router.get('/categories', async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await prisma.serviceCategory.create({ data });
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const category = await prisma.serviceCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.serviceCategory.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Category deactivated' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.get('/client-groups', async (_req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.clientGroup.findMany({ orderBy: { name: 'asc' } });
    res.json(groups);
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({ error: 'Failed to list groups' });
  }
});

router.post('/client-groups', async (req: AuthRequest, res: Response) => {
  try {
    const data = createGroupSchema.parse(req.body);
    const group = await prisma.clientGroup.create({ data });
    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.patch('/client-groups/:id', async (req: AuthRequest, res: Response) => {
  try {
    const group = await prisma.clientGroup.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

router.delete('/client-groups/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.clientGroup.delete({ where: { id: req.params.id } });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

router.get('/orders', async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        service: { select: { id: true, name: true } },
        fieldValues: { include: { serviceField: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

router.get('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        service: true,
        fieldValues: { include: { serviceField: true } },
        messages: { include: { sender: { select: { id: true, username: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        files: true,
      },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

router.patch('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status, adminNotes } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        adminNotes,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/orders/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const orderMessage = await prisma.orderMessage.create({
      data: {
        orderId: req.params.id,
        senderId: req.user!.id,
        message,
      },
      include: { sender: { select: { id: true, username: true, role: true } } },
    });
    res.status(201).json(orderMessage);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

router.get('/deposits', async (_req: AuthRequest, res: Response) => {
  try {
    const deposits = await prisma.depositRequest.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        reviewer: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(deposits);
  } catch (error) {
    console.error('List deposits error:', error);
    res.status(500).json({ error: 'Failed to list deposits' });
  }
});

router.post('/deposits/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const deposit = await prisma.$transaction(async (tx) => {
      const d = await tx.depositRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          reviewedBy: req.user!.id,
          adminNotes: req.body.adminNotes,
        },
      });

      await tx.user.update({
        where: { id: d.userId },
        data: { balance: { increment: d.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: d.userId,
          amount: d.amount,
          type: 'DEPOSIT',
          description: `Deposit approved (${d.paymentMethod})`,
          reference: d.id,
          createdBy: req.user!.id,
        },
      });

      return d;
    });

    res.json(deposit);
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

router.post('/deposits/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const deposit = await prisma.depositRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        reviewedBy: req.user!.id,
        adminNotes: req.body.adminNotes,
      },
    });
    res.json(deposit);
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

router.post('/wallet/credit', async (req: AuthRequest, res: Response) => {
  try {
    const data = creditSchema.parse(req.body);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: data.userId },
        data: { balance: { increment: data.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          type: 'CREDIT',
          description: data.description || 'Admin credit',
          createdBy: req.user!.id,
        },
      });

      return u;
    });

    res.json({ id: user.id, balance: user.balance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Credit error:', error);
    res.status(500).json({ error: 'Failed to credit user' });
  }
});

router.get('/audit-logs', async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(logs);
  } catch (error) {
    console.error('List audit logs error:', error);
    res.status(500).json({ error: 'Failed to list audit logs' });
  }
});

export default router;
