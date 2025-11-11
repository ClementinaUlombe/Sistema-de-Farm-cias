import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all log entries
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const logs = await prisma.log.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao buscar logs' }), { status: 500 });
  }
}
