import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient, UserRole } from '@prisma/client';
import { zonedTimeToUtc, toZonedTime, format } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';


const prisma = new PrismaClient();

interface CartItem {
  id: string;
  quantity: number;
}
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const saleItems = await prisma.saleItem.findMany({
      include: {
        product: true, 
        sale: true,    
      },
      orderBy: {
        sale: {
          createdAt: 'asc',
        },
      },
    });

    if (saleItems.length === 0) {
      return new NextResponse(JSON.stringify([]), { status: 200 });
    }

    const monthlyData = saleItems.reduce((acc, item) => {
      const timeZone = 'America/Sao_Paulo'; 
      const zonedDate = toZonedTime(item.sale.createdAt, timeZone);
      const monthName = format(zonedDate, 'MMM', { locale: ptBR });
      
      const saleValue = item.priceAtSale * item.quantity;
      const profit = (item.priceAtSale - item.product.purchasePrice) * item.quantity;

      if (!acc[monthName]) {
        acc[monthName] = { name: monthName, sales: 0, profit: 0 };
      }

      acc[monthName].sales += saleValue;
      acc[monthName].profit += profit;

      return acc;
    }, {} as Record<string, { name: string; sales: number; profit: number }>);

    const chartData = Object.values(monthlyData);

    return new NextResponse(JSON.stringify(chartData), { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar dados de vendas para o gráfico:", error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}

// POST: Create a new sale (securely calculates total on the backend)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || ![UserRole.ADMIN, UserRole.ATTENDANT].includes(session.user.role as UserRole)) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  const { cart, discount, paymentMethod } = await req.json();
  const parsedDiscount = parseFloat(discount) || 0;

  if (!cart || cart.length === 0 || !paymentMethod) {
    return new NextResponse(JSON.stringify({ error: 'Dados da venda incompletos' }), { status: 400 });
  }

  try {
    const newSale = await prisma.$transaction(async (tx) => {
      const productIds = cart.map((item: CartItem) => item.id);
      const productsFromDb = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(productsFromDb.map(p => [p.id, p]));
      let calculatedSubtotal = 0;

      // 1. Validate cart, check stock, and calculate subtotal based on DB prices
      for (const item of cart) {
        const product = productMap.get(item.id);
        if (!product) throw new Error(`Produto com ID ${item.id} não encontrado.`);
        if (product.stockQuantity < item.quantity) throw new Error(`Stock insuficiente para o produto: ${product.name}`);
        
        calculatedSubtotal += product.sellingPrice * item.quantity;
      }

      const finalTotal = Math.max(0, calculatedSubtotal - parsedDiscount);

      // 2. Create the Sale record with the server-calculated total
      const sale = await tx.sale.create({
        data: {
          total: finalTotal,
          discount: parsedDiscount,
          paymentMethod,
          attendantId: session.user.id,
        },
      });

      // 3. Create SaleItems, update product stock, and create stock movements
      for (const item of cart) {
        const product = productMap.get(item.id)!; // We know it exists from the check above
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.id,
            quantity: item.quantity,
            priceAtSale: product.sellingPrice, // Use server price
          },
        });

        await tx.product.update({
          where: { id: item.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            quantityChange: -item.quantity,
            reason: `Venda #${sale.id}`,
            productId: item.id,
            userId: session.user.id,
          },
        });
      }

      // Return the full sale object for the invoice
      return tx.sale.findUnique({ 
        where: { id: sale.id },
        include: {
            attendant: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } }
        }
      });
    });

    return new NextResponse(JSON.stringify(newSale), { status: 201 });

  } catch (error: any) {
    console.error("Erro na transação da venda:", error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Não foi possível processar a venda.' }), { status: 500 });
  }
}