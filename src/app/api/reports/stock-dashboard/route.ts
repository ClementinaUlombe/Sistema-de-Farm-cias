'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 401 });
  }

  try {
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const allProducts = await prisma.product.findMany();

    const lowStockCount = allProducts.filter(p => p.stockQuantity <= p.minStockQuantity).length;

    const nearExpiryCount = allProducts.filter(p => {
        const expiryDate = new Date(p.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setHours(0, 0, 0, 0);
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

        return expiryDate <= ninetyDaysFromNow && expiryDate >= today;
    }).length;

    const totalProducts = allProducts.length;

    const data = [
        { name: 'Total de Produtos', value: totalProducts },
        { name: 'Stock Baixo', value: lowStockCount },
        { name: 'Validade Próxima', value: nearExpiryCount },
    ];

    return new NextResponse(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar dados de stock para o dashboard:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}
