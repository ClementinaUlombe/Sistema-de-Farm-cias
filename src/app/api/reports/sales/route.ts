import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const whereClause: any = {};
  if (from) {
    whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(from) };
  }
  if (to) {
    whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(to) };
  }

  try {
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        attendant: {
          select: { name: true },
        },
        items: {
          include: {
            product: {
              select: { purchasePrice: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let totalSalesValue = 0;
    let totalProfit = 0;
    const salesByEmployee: { [key: string]: { total: number, count: number } } = {};

    const detailedSales = sales.map(sale => {
      let salePurchaseCost = 0;
      for (const item of sale.items) {
        salePurchaseCost += item.product.purchasePrice * item.quantity;
      }
      const saleProfit = sale.total - salePurchaseCost;
      
      totalSalesValue += sale.total;
      totalProfit += saleProfit;

      if (sale.attendant.name) {
        if (!salesByEmployee[sale.attendant.name]) {
          salesByEmployee[sale.attendant.name] = { total: 0, count: 0 };
        }
        salesByEmployee[sale.attendant.name].total += sale.total;
        salesByEmployee[sale.attendant.name].count += 1;
      }

      return {
        id: sale.id,
        createdAt: sale.createdAt,
        attendantName: sale.attendant.name,
        total: sale.total,
        profit: saleProfit,
        paymentMethod: sale.paymentMethod,
        itemCount: sale.items.length,
      };
    });

    return NextResponse.json({
      totalSalesValue,
      totalProfit,
      salesByEmployee,
      saleCount: sales.length,
      detailedSales,
    });

  } catch (error) {
    console.error("Erro ao gerar relatório de vendas:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao gerar relatório' }), { status: 500 });
  }
}
