import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

interface RouteParams {
  params: { id: string };
}

// PUT: Update a user
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const { name, email, role, password } = await req.json();

    if (!name || !email || !role) {
      return new NextResponse(JSON.stringify({ error: 'Nome, email e perfil são obrigatórios' }), { status: 400 });
    }

    // Check if user exists and is active before update
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser || !existingUser.isActive) {
      return new NextResponse(JSON.stringify({ error: 'Utilizador não encontrado ou inativo' }), { status: 404 });
    }

    // Check if email is already in use by another user
    if (email !== existingUser.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (userWithSameEmail) {
        return new NextResponse(JSON.stringify({ error: 'Este email já está em uso.' }), { status: 409 });
      }
    }

    // Prevent admin from changing their own role
    if (session.user.id === id && session.user.role !== role) {
        return new NextResponse(JSON.stringify({ error: 'Não pode alterar o seu próprio perfil.' }), { status: 403 });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        ...(password && { password: hashedPassword }), // Only include password if it was provided
      },
    });

    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json(userToReturn);

  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao atualizar utilizador' }), { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  // Prevent admin from deleting themselves
  if (session.user.id === id) {
    return new NextResponse(JSON.stringify({ error: 'Não pode apagar a sua própria conta.' }), { status: 403 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao apagar utilizador' }), { status: 500 });
  }
}
