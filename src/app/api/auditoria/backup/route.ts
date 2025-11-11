import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'prisma', 'backups');

// POST: Create a new database backup
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    await fs.copyFile(DB_FILE_PATH, backupFilePath);

    // Log the action
    // Note: Prisma client might not be available if the DB is locked during copy,
    // so we are skipping logging for this specific action for now.

    return NextResponse.json({ message: `Backup criado com sucesso: ${backupFileName}` });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return new NextResponse(JSON.stringify({ error: 'Falha ao criar backup da base de dados' }), { status: 500 });
  }
}

// GET: List existing backups
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 403 });
  }

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        createdAt: file.split('-')[1] + 'T' + file.split('-')[2] + ':' + file.split('-')[3] + ':' + file.split('-')[4].split('.')[0]
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    return NextResponse.json(backups);
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return new NextResponse(JSON.stringify({ error: 'Falha ao listar backups' }), { status: 500 });
  }
}
