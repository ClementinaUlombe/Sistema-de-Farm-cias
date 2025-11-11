// src/app/api/reports/most-sold-products/route.ts
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
    const mostSoldProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5, // Top 5 most sold products
    });

    const productIds = mostSoldProducts.map(item => item.productId);
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

    const result = mostSoldProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product ? product.name : 'Produto Desconhecido',
        quantitySold: item._sum.quantity || 0,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao buscar produtos mais vendidos:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao buscar produtos mais vendidos' }), { status: 500 });
  }
}
