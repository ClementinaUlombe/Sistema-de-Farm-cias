import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all products
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.STOCKIST, UserRole.ATTENDANT].includes(session.user.role as UserRole)) {
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

    // 1. Basic presence validation and type conversion
    if (!name) return new NextResponse(JSON.stringify({ error: 'Nome do produto é obrigatório.' }), { status: 400 });
    if (!category) return new NextResponse(JSON.stringify({ error: 'Categoria do produto é obrigatória.' }), { status: 400 });
    if (purchasePrice === undefined || purchasePrice === null || purchasePrice === '') return new NextResponse(JSON.stringify({ error: 'Preço de compra é obrigatório.' }), { status: 400 });
    if (sellingPrice === undefined || sellingPrice === null || sellingPrice === '') return new NextResponse(JSON.stringify({ error: 'Preço de venda é obrigatório.' }), { status: 400 });
    if (!expiryDate) return new NextResponse(JSON.stringify({ error: 'Data de validade é obrigatória.' }), { status: 400 });
    if (stockQuantity === undefined || stockQuantity === null || stockQuantity === '') return new NextResponse(JSON.stringify({ error: 'Quantidade em stock é obrigatória.' }), { status: 400 });
    if (minStockQuantity === undefined || minStockQuantity === null || minStockQuantity === '') return new NextResponse(JSON.stringify({ error: 'Quantidade mínima em stock é obrigatória.' }), { status: 400 });

    const parsedPurchasePrice = parseFloat(purchasePrice);
    const parsedSellingPrice = parseFloat(sellingPrice);
    const parsedStockQuantity = parseInt(stockQuantity, 10);
    const parsedMinStockQuantity = parseInt(minStockQuantity, 10);
    const parsedExpiryDate = new Date(expiryDate);

    // 2. Data validation
    if (name.length < 2 || name.length > 100) return new NextResponse(JSON.stringify({ error: 'O nome do produto deve ter entre 2 e 100 caracteres.' }), { status: 400 });
    if (category.length < 2 || category.length > 50) return new NextResponse(JSON.stringify({ error: 'A categoria do produto deve ter entre 2 e 50 caracteres.' }), { status: 400 });
    if (dosage && dosage.length > 50) return new NextResponse(JSON.stringify({ error: 'A dosagem do produto não pode exceder 50 caracteres.' }), { status: 400 });
    if (manufacturer && manufacturer.length > 100) return new NextResponse(JSON.stringify({ error: 'O fabricante do produto não pode exceder 100 caracteres.' }), { status: 400 });

    if (isNaN(parsedPurchasePrice) || parsedPurchasePrice <= 0) return new NextResponse(JSON.stringify({ error: 'Preço de compra inválido (deve ser um número maior que 0).' }), { status: 400 });
    if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) return new NextResponse(JSON.stringify({ error: 'Preço de venda inválido (deve ser um número maior que 0).' }), { status: 400 });
    if (parsedSellingPrice < parsedPurchasePrice) return new NextResponse(JSON.stringify({ error: 'O preço de venda não pode ser menor que o preço de compra.' }), { status: 400 });

    if (isNaN(parsedStockQuantity) || parsedStockQuantity < 0) return new NextResponse(JSON.stringify({ error: 'Quantidade em stock inválida (deve ser um número inteiro >= 0).' }), { status: 400 });
    if (isNaN(parsedMinStockQuantity) || parsedMinStockQuantity < 0) return new NextResponse(JSON.stringify({ error: 'Quantidade mínima em stock inválida (deve ser um número inteiro >= 0).' }), { status: 400 });
    if (parsedMinStockQuantity > parsedStockQuantity) return new NextResponse(JSON.stringify({ error: 'A quantidade mínima em stock não pode ser maior que a quantidade em stock.' }), { status: 400 });

    if (isNaN(parsedExpiryDate.getTime())) return new NextResponse(JSON.stringify({ error: 'Data de validade inválida.' }), { status: 400 });
    if (parsedExpiryDate <= new Date()) return new NextResponse(JSON.stringify({ error: 'A data de validade deve ser uma data futura.' }), { status: 400 });

    if (barcode && barcode.length > 50) return new NextResponse(JSON.stringify({ error: 'O código de barras não pode exceder 50 caracteres.' }), { status: 400 });
    // Check for unique barcode (Prisma will handle it with @unique, but explicit check can give better error)
    if (barcode) {
      const existingProductWithBarcode = await prisma.product.findUnique({ where: { barcode } });
      if (existingProductWithBarcode) {
        return new NextResponse(JSON.stringify({ error: 'Já existe um produto com este código de barras.' }), { status: 409 });
      }
    }


    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        dosage,
        manufacturer,
        purchasePrice: parsedPurchasePrice,
        sellingPrice: parsedSellingPrice,
        expiryDate: parsedExpiryDate,
        stockQuantity: parsedStockQuantity,
        minStockQuantity: parsedMinStockQuantity,
        barcode,
      },
    });

    return new NextResponse(JSON.stringify(newProduct), { status: 201 });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: 'Erro ao criar produto' }), { status: 500 });
  }
}
