import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch sales for the currently logged-in attendant
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.ATTENDANT].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const whereClause: any = {
    attendantId: session.user.id, // Automatically filter by the logged-in user
  };

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
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0);

    const detailedSales = sales.map(sale => ({
      id: sale.id,
      createdAt: sale.createdAt,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      itemCount: sale.items.length,
    }));

    return NextResponse.json({
      totalSalesValue,
      saleCount: sales.length,
      detailedSales,
    });

  } catch (error) {
    console.error("Erro ao gerar relatório de vendas do atendente:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao gerar relatório' }), { status: 500 });
  }
}
