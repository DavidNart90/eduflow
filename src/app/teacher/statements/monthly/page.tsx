'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

// This page can be similar to the main statements page
// but specifically focused on monthly statements
export default function MonthlyStatementsPage() {
  const router = useRouter();

  // Redirect to the main statements page since they serve the same purpose
  useEffect(() => {
    router.push('/teacher/statements');
  }, [router]);

  return (
    <TeacherRoute>
      <Layout>
        <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
          <p>Redirecting to statements...</p>
        </div>
      </Layout>
    </TeacherRoute>
  );
}
