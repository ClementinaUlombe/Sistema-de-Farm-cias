import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: { id: string };
}

// PUT: Update a product and log stock changes
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      name, category, dosage, manufacturer, purchasePrice, sellingPrice, 
      expiryDate, stockQuantity, minStockQuantity, barcode 
    } = body;

    if (!name || !category || !purchasePrice || !sellingPrice || !expiryDate || !stockQuantity || !minStockQuantity) {
      return new NextResponse(JSON.stringify({ error: 'Campos obrigatórios em falta' }), { status: 400 });
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Get the current product state
      const currentProduct = await tx.product.findUnique({ where: { id } });
      if (!currentProduct) {
        throw new Error('Produto não encontrado');
      }

      const newStockQuantity = parseInt(stockQuantity, 10);
      const quantityChange = newStockQuantity - currentProduct.stockQuantity;

      // 2. If stock has changed, create a movement log
      if (quantityChange !== 0) {
        await tx.stockMovement.create({
          data: {
            quantityChange,
            reason: 'Ajuste manual',
            productId: id,
            userId: session.user.id,
          },
        });
      }

      // 3. Update the product
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          category,
          dosage,
          manufacturer,
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
          expiryDate: new Date(expiryDate),
          stockQuantity: newStockQuantity,
          minStockQuantity: parseInt(minStockQuantity, 10),
          barcode,
        },
      });

      return product;
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Erro ao atualizar produto' }), { status: 500 });
  }
}

// DELETE: Delete a product
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    // Check if the product is associated with any sale items
    const saleItemsCount = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (saleItemsCount > 0) {
      return new NextResponse(JSON.stringify({ error: 'Não é possível apagar um produto que já faz parte de uma venda.' }), { status: 400 });
    }

    // Also delete related stock movements before deleting the product
    await prisma.stockMovement.deleteMany({
        where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao apagar produto' }), { status: 500 });
  }
}