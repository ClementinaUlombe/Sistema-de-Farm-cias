import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();



// PUT: Update a product and log stock changes
export async function PUT(req: Request, context: { params: Promise<{ id: string; }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await context.params;
  const id = resolvedParams.id;

  if (!session || !session.user || !([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name, category, dosage, manufacturer, purchasePrice, sellingPrice,
      expiryDate, stockQuantity, minStockQuantity, barcode
    } = body;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Get the current product state
      const currentProduct = await tx.product.findUnique({ where: { id } });
      if (!currentProduct) {
        throw new Error('Produto não encontrado');
      }

      const dataToUpdate: any = {};
      let newStockQuantity = currentProduct.stockQuantity; // Default to current stock
      let oldStockQuantity = currentProduct.stockQuantity; // Keep track of old stock for movement log

      // Validate and add name to dataToUpdate if provided
      if (name !== undefined) {
        if (name.length < 2 || name.length > 100) throw new Error('O nome do produto deve ter entre 2 e 100 caracteres.');
        dataToUpdate.name = name;
      }

      // Validate and add category to dataToUpdate if provided
      if (category !== undefined) {
        if (category.length < 2 || category.length > 50) throw new Error('A categoria do produto deve ter entre 2 e 50 caracteres.');
        dataToUpdate.category = category;
      }

      // Validate and add dosage to dataToUpdate if provided
      if (dosage !== undefined) {
        if (dosage && dosage.length > 50) throw new Error('A dosagem do produto não pode exceder 50 caracteres.');
        dataToUpdate.dosage = dosage;
      }

      // Validate and add manufacturer to dataToUpdate if provided
      if (manufacturer !== undefined) {
        if (manufacturer && manufacturer.length > 100) throw new Error('O fabricante do produto não pode exceder 100 caracteres.');
        dataToUpdate.manufacturer = manufacturer;
      }

      // Validate and add purchasePrice to dataToUpdate if provided
      let parsedPurchasePrice = currentProduct.purchasePrice;
      if (purchasePrice !== undefined && purchasePrice !== '') {
        parsedPurchasePrice = parseFloat(purchasePrice);
        if (isNaN(parsedPurchasePrice) || parsedPurchasePrice <= 0) throw new Error('Preço de compra inválido (deve ser um número maior que 0).');
        dataToUpdate.purchasePrice = parsedPurchasePrice;
      }

      // Validate and add sellingPrice to dataToUpdate if provided
      let parsedSellingPrice = currentProduct.sellingPrice;
      if (sellingPrice !== undefined && sellingPrice !== '') {
        parsedSellingPrice = parseFloat(sellingPrice);
        if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) throw new Error('Preço de venda inválido (deve ser um número maior que 0).');
        dataToUpdate.sellingPrice = parsedSellingPrice;
      }
      // Check selling price against purchase price (use updated values if available, else current)
      if (dataToUpdate.sellingPrice !== undefined || dataToUpdate.purchasePrice !== undefined) {
        const finalPurchasePrice = dataToUpdate.purchasePrice !== undefined ? dataToUpdate.purchasePrice : currentProduct.purchasePrice;
        const finalSellingPrice = dataToUpdate.sellingPrice !== undefined ? dataToUpdate.sellingPrice : currentProduct.sellingPrice;
        if (finalSellingPrice < finalPurchasePrice) throw new Error('O preço de venda não pode ser menor que o preço de compra.');
      }


      // Validate and add expiryDate to dataToUpdate if provided
      let parsedExpiryDate = currentProduct.expiryDate;
      if (expiryDate !== undefined && expiryDate !== '') {
        parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) throw new Error('Data de validade inválida.');
        if (parsedExpiryDate <= new Date()) throw new Error('A data de validade deve ser uma data futura.');
        dataToUpdate.expiryDate = parsedExpiryDate;
      }

      // Validate and add stockQuantity to dataToUpdate if provided
      if (stockQuantity !== undefined && stockQuantity !== '') {
        newStockQuantity = parseInt(stockQuantity, 10);
        if (isNaN(newStockQuantity) || newStockQuantity < 0) throw new Error('Quantidade em stock inválida (deve ser um número inteiro >= 0).');
        dataToUpdate.stockQuantity = newStockQuantity;
      }

      // Validate and add minStockQuantity to dataToUpdate if provided
      let newMinStockQuantity = currentProduct.minStockQuantity;
      if (minStockQuantity !== undefined && minStockQuantity !== '') {
        newMinStockQuantity = parseInt(minStockQuantity, 10);
        if (isNaN(newMinStockQuantity) || newMinStockQuantity < 0) throw new Error('Quantidade mínima em stock inválida (deve ser um número inteiro >= 0).');
        dataToUpdate.minStockQuantity = newMinStockQuantity;
      }
      // Check minStockQuantity against stockQuantity (use updated values if available, else current)
      if (dataToUpdate.minStockQuantity !== undefined || dataToUpdate.stockQuantity !== undefined) {
        const finalStockQuantity = dataToUpdate.stockQuantity !== undefined ? dataToUpdate.stockQuantity : newStockQuantity; // Use newStockQuantity if updated
        const finalMinStockQuantity = dataToUpdate.minStockQuantity !== undefined ? dataToUpdate.minStockQuantity : currentProduct.minStockQuantity;
        if (finalMinStockQuantity > finalStockQuantity) throw new Error('A quantidade mínima em stock não pode ser maior que a quantidade em stock.');
      }


      // Validate and add barcode to dataToUpdate if provided
      if (barcode !== undefined) { // Allow barcode to be null/empty string
        if (barcode && barcode.length > 50) throw new Error('O código de barras não pode exceder 50 caracteres.');
        if (barcode && barcode !== currentProduct.barcode) {
          const existingProductWithBarcode = await tx.product.findUnique({ where: { barcode } });
          if (existingProductWithBarcode) {
            throw new Error('Já existe um produto com este código de barras.');
          }
        }
        dataToUpdate.barcode = barcode;
      }

      // If no fields are provided for update, throw an error
      if (Object.keys(dataToUpdate).length === 0) {
          throw new Error('Nenhum campo fornecido para atualização.');
      }

      const quantityChange = newStockQuantity - oldStockQuantity;

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
        data: dataToUpdate,
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
export async function DELETE(req: Request, context: { params: Promise<{ id: string; }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await context.params;
  const id = resolvedParams.id;

  if (!session || !session.user || !([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(session.user.role as UserRole)) {
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