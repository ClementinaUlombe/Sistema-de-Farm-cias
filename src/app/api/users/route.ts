import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// GET: List all users
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      // Exclude passwords from the result
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Erro ao buscar utilizadores' }), { status: 500 });
  }
}

// POST: Create a new user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();

    // 1. Basic presence validation
    if (!name || !email || !password || !role) {
      return new NextResponse(JSON.stringify({ error: 'Campos obrigatórios em falta' }), { status: 400 });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse(JSON.stringify({ error: 'Formato de email inválido.' }), { status: 400 });
    }

    // 3. Password strength validation
    if (password.length < 8) {
      return new NextResponse(JSON.stringify({ error: 'A palavra-passe deve ter pelo menos 8 caracteres.' }), { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return new NextResponse(JSON.stringify({ error: 'A palavra-passe deve conter pelo menos uma letra maiúscula.' }), { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return new NextResponse(JSON.stringify({ error: 'A palavra-passe deve conter pelo menos uma letra minúscula.' }), { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return new NextResponse(JSON.stringify({ error: 'A palavra-passe deve conter pelo menos um número.' }), { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return new NextResponse(JSON.stringify({ error: 'A palavra-passe deve conter pelo menos um caractere especial.' }), { status: 400 });
    }

    // 4. Name length validation
    if (name.length < 2 || name.length > 50) {
        return new NextResponse(JSON.stringify({ error: 'O nome deve ter entre 2 e 50 caracteres.' }), { status: 400 });
    }

    // 5. Role validation (ensure it's a valid UserRole enum value)
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
        return new NextResponse(JSON.stringify({ error: `Perfil de utilizador inválido. Os perfis permitidos são: ${validRoles.join(', ')}.` }), { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse(JSON.stringify({ error: 'Já existe um utilizador com este email.' }), { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const { password: _, ...userToReturn } = newUser;

    // Log the action
    await prisma.log.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.name!,
        action: 'USER_CREATED',
        targetId: newUser.id,
        details: { name, email, role },
      }
    });

    return new NextResponse(JSON.stringify(userToReturn), { status: 201 });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao criar utilizador' }), { status: 500 });
  }
}
