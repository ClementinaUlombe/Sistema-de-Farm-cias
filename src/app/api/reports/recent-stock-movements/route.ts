// src/app/api/reports/recent-stock-movements/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST, UserRole.ATTENDANT].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMovements = await prisma.stockMovement.groupBy({
      by: ['productId'],
      _sum: {
        quantityChange: true,
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        _sum: {
          quantityChange: 'desc', // Order by net change
        },
      },
    });

    const productIds = recentMovements.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const result = recentMovements.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product ? product.name : 'Produto Desconhecido',
        netChange: item._sum.quantityChange || 0,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao buscar movimentações de stock recentes:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao buscar movimentações de stock recentes' }), { status: 500 });
  }
}
