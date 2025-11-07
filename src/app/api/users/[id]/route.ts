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
    const { name, email, role, password, isActive } = await req.json();

    // Basic validation for required fields when not just changing status
    if (!name || !email || !role) {
      return new NextResponse(JSON.stringify({ error: 'Nome, email e perfil são obrigatórios' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse(JSON.stringify({ error: 'Utilizador não encontrado' }), { status: 404 });
    }

    // Check if email is already in use by another user
    if (email && email !== existingUser.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (userWithSameEmail) {
        return new NextResponse(JSON.stringify({ error: 'Este email já está em uso.' }), { status: 409 });
      }
    }

    // Prevent admin from changing their own role
    if (session.user.id === id && role && session.user.role !== role) {
        return new NextResponse(JSON.stringify({ error: 'Não pode alterar o seu próprio perfil.' }), { status: 403 });
    }

    const dataToUpdate: any = {
      name,
      email,
      role,
    };

    if (password && password.length > 0) {
      dataToUpdate.password = await hash(password, 12);
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // Log the action
    const action = isActive === true && existingUser.isActive === false ? 'USER_REACTIVATED' : 'USER_UPDATED';
    await prisma.log.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.name!,
        action: action,
        targetId: updatedUser.id,
        details: dataToUpdate,
      }
    });

    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json(userToReturn);

  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao atualizar utilizador' }), { status: 500 });
  }
}

// DELETE: Deactivate a user
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
    const userToDeactivate = await prisma.user.findUnique({ where: { id } });

    if (!userToDeactivate) {
      return new NextResponse(JSON.stringify({ error: 'Utilizador não encontrado' }), { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await prisma.log.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.name!,
        action: 'USER_DEACTIVATED',
        targetId: userToDeactivate.id,
        details: { name: userToDeactivate.name, email: userToDeactivate.email },
      }
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao apagar utilizador' }), { status: 500 });
  }
}
