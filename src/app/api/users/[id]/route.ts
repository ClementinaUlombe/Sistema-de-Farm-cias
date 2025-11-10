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
export async function PUT(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  // Extract ID directly from the URL as a workaround
  const urlParts = req.url.split('/');
  const id = urlParts[urlParts.length - 1];

  if (!id) {
    return new NextResponse(JSON.stringify({ error: 'ID do utilizador em falta na requisição (URL parsing falhou).' }), { status: 400 });
  }

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const { name, email, role, password, isActive } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse(JSON.stringify({ error: 'Utilizador não encontrado' }), { status: 404 });
    }

    const dataToUpdate: any = {};

    // Validate and add name to dataToUpdate if provided
    if (name !== undefined) {
      if (name.length < 2 || name.length > 50) {
        return new NextResponse(JSON.stringify({ error: 'O nome deve ter entre 2 e 50 caracteres.' }), { status: 400 });
      }
      dataToUpdate.name = name;
    }

    // Validate and add email to dataToUpdate if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new NextResponse(JSON.stringify({ error: 'Formato de email inválido.' }), { status: 400 });
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
      dataToUpdate.email = email;
    }

    // Validate and add role to dataToUpdate if provided
    if (role !== undefined) {
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role)) {
        return new NextResponse(JSON.stringify({ error: `Perfil de utilizador inválido. Os perfis permitidos são: ${validRoles.join(', ')}.` }), { status: 400 });
      }
      // Prevent admin from changing their own role
      if (session.user.id === id && role !== existingUser.role) { // Compare with existingUser.role
          return new NextResponse(JSON.stringify({ error: 'Não pode alterar o seu seu próprio perfil.' }), { status: 403 });
      }
      dataToUpdate.role = role;
    }

    // Validate and add password to dataToUpdate if provided
    if (password !== undefined && password.length > 0) {
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
      dataToUpdate.password = await hash(password, 12);
    }

    // Add isActive to dataToUpdate if provided
    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    // If no fields are provided for update, return 400
    if (Object.keys(dataToUpdate).length === 0) {
        return new NextResponse(JSON.stringify({ error: 'Nenhum campo fornecido para atualização.' }), { status: 400 });
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
    return new NextResponse(JSON.stringify({ error: 'Erro ao atualizar utilizador', details: (error as Error).message || 'Erro desconhecido' }), { status: 500 });
  }
}

// DELETE: Deactivate a user
export async function DELETE(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  // const id = context.params.id; // This is currently undefined

  // Extract ID directly from the URL as a workaround
  const urlParts = req.url.split('/');
  const id = urlParts[urlParts.length - 1]; // The last part of the URL should be the ID

  if (!id) {
    return new NextResponse(JSON.stringify({ error: 'ID do utilizador em falta na requisição (URL parsing falhou).' }), { status: 400 });
  }

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

    // Log the action (temporarily commented out for debugging)
    /*
    try {
      await prisma.log.create({
        data: {
          actorId: session.user.id,
          actorName: session.user.name!,
          action: 'USER_DEACTIVATED',
          targetId: userToDeactivate.id,
          details: { name: userToDeactivate.name, email: userToDeactivate.email },
        }
      });
    } catch (logError) {
      console.error("Erro ao criar log de desativação de utilizador:", logError);
      // Do not re-throw, as the user deactivation itself might have succeeded
    }
    */

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao apagar utilizador', details: (error as Error).message || 'Erro desconhecido' }), { status: 500 });
  }
}
