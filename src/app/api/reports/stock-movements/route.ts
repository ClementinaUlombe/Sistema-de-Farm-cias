import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const productId = searchParams.get('productId');

  const whereClause: any = {};
  if (from) {
    whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(from) };
  }
  if (to) {
    whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(to) };
  }
  if (productId) {
    whereClause.productId = productId;
  }

  try {
    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: {
          select: { name: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(movements);

  } catch (error) {
    console.error("Erro ao gerar relatório de movimentos de stock:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao gerar relatório' }), { status: 500 });
  }
}
