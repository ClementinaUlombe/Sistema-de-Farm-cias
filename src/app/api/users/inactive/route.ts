import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all inactive users
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar utilizadores inativos:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao buscar utilizadores' }), { status: 500 });
  }
}
