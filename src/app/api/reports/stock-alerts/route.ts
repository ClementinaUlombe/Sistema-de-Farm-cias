import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch stock alert reports (low stock and near expiry)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    // 1. Find products with low stock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lte: prisma.product.fields.minStockQuantity,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    // 2. Find products nearing expiry date (e.g., within the next 90 days)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const nearExpiryProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          lte: ninetyDaysFromNow, // Less than or equal to 90 days from now
          gte: new Date(), // Not already expired
        },
        stockQuantity: {
          gt: 0, // Only show products that are in stock
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return NextResponse.json({ lowStockProducts, nearExpiryProducts });

  } catch (error) {
    console.error("Erro ao gerar relatórios de stock:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao gerar relatórios' }), { status: 500 });
  }
}
