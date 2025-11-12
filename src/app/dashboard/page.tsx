'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';

import SalesChart from './components/SalesChart';
import StockAlertsChart from './components/StockAlertsChart';
import { UserRole } from '@prisma/client';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (status === 'authenticated') {
    const userRole = session.user?.role as UserRole;

    return (
<div className="max-w-full lg:max-w-6xl mt-4 mb-4 px-4
                lg:ml-[-155px] lg:mr-auto"> {/* move para esquerda em telas grandes */}
  <h1 className="text-2xl sm:text-3xl font-bold mb-4">
    Bem-vindo ao Dashboard
  </h1>
  <p className="text-lg sm:text-xl mb-6">
    Seu perfil é: {userRole}
  </p>

  {userRole === UserRole.ADMIN ? (
    <div className="flex flex-col gap-16 items-center lg:items-start">
      <div className="w-full lg:w-[90%]">
        <SalesChart />
      </div>
      <div className="w-full lg:w-[90%]">
        <StockAlertsChart />
      </div>
    </div>
  ) : (
    <div className="w-full lg:w-[90%] mx-auto">
      <StockAlertsChart />
    </div>
  )}
</div>


    );
  }

  return null;
}
