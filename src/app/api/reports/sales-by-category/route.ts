// src/app/api/reports/sales-by-category/route.ts
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
    const salesByCategory = await prisma.saleItem.findMany({
      include: {
        product: {
          select: {
            category: true,
          },
        },
      },
    });

    const categorySalesMap = new Map<string, number>();

    salesByCategory.forEach(item => {
      const category = item.product.category;
      const totalValue = item.quantity * item.priceAtSale;
      categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + totalValue);
    });

    const result = Array.from(categorySalesMap.entries())
      .map(([category, totalSales]) => ({
        name: category,
        'Total de Vendas': totalSales,
      }))
      .sort((a, b) => b['Total de Vendas'] - a['Total de Vendas'])
      .slice(0, 5); // Top 5 categories

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao buscar vendas por categoria:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao buscar vendas por categoria' }), { status: 500 });
  }
}
