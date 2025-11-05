import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all products
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Erro ao buscar produtos' }), { status: 500 });
  }
}

// POST: Create a new product
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      name, 
      category, 
      dosage, 
      manufacturer, 
      purchasePrice, 
      sellingPrice, 
      expiryDate, 
      stockQuantity, 
      minStockQuantity, 
      barcode 
    } = body;

    // Basic validation
    if (!name || !category || !purchasePrice || !sellingPrice || !expiryDate || !stockQuantity || !minStockQuantity) {
      return new NextResponse(JSON.stringify({ error: 'Campos obrigatórios em falta' }), { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        dosage,
        manufacturer,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        expiryDate: new Date(expiryDate),
        stockQuantity: parseInt(stockQuantity, 10),
        minStockQuantity: parseInt(minStockQuantity, 10),
        barcode,
      },
    });

    return new NextResponse(JSON.stringify(newProduct), { status: 201 });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao criar produto' }), { status: 500 });
  }
}
