'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  management_unit: string;
  role: 'teacher' | 'admin';
  created_at: string;
}

export default function ManageTeachersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState('');

  const itemsPerPage = 10;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'admin', label: 'Admins' },
  ];

  // Fetch teachers from the public users table
  const fetchTeachers = async () => {
    try {
      setIsLoading(true);

      // Get headers for the request (include auth token as fallback)
      const headers: HeadersInit = {};

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch {
        // Continue without token, rely on cookies
      }

      const response = await fetch('/api/admin/users', {
        headers,
        credentials: 'include', // Include cookies in the request
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to fetch teachers');
        return;
      }

      if (!Array.isArray(data.users)) {
        setMessage('Invalid response from server');
        return;
      }

      setTeachers(data.users);
      setFilteredTeachers(data.users);
    } catch {
      setMessage('Error fetching teachers');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter teachers based on search and status
  useEffect(() => {
    let filtered = teachers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        teacher =>
          teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher => teacher.role === statusFilter);
    }

    setFilteredTeachers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, teachers]);

  // Simulate loading and fetch data
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    setIsDeleting(true);
    try {
      // Get headers for the request (include auth token as fallback)
      const headers: HeadersInit = {};

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch {
        // Continue without token, rely on cookies
      }

      const response = await fetch(`/api/admin/users/${selectedTeacher.id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Teacher deleted successfully');
        setTeachers(prev => prev.filter(t => t.id !== selectedTeacher.id));
        setShowDeleteModal(false);
        setSelectedTeacher(null);
      } else {
        setMessage(data.error || 'Failed to delete teacher');
      }
    } catch {
      setMessage('Error deleting teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePromoteTeacher = async () => {
    if (!selectedTeacher) return;

    setIsPromoting(true);
    const newRole = selectedTeacher.role === 'teacher' ? 'admin' : 'teacher';

    try {
      // Get headers for the request (include auth token as fallback)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch {
        // Continue without token, rely on cookies
      }

      const response = await fetch(
        `/api/admin/users/${selectedTeacher.id}/role`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Teacher ${newRole === 'admin' ? 'promoted to admin' : 'demoted to teacher'} successfully`
        );
        setTeachers(prev =>
          prev.map(t =>
            t.id === selectedTeacher.id ? { ...t, role: newRole } : t
          )
        );
        setShowPromoteModal(false);
        setSelectedTeacher(null);
      } else {
        setMessage(data.error || 'Failed to update teacher role');
      }
    } catch {
      setMessage('Error updating teacher role');
    } finally {
      setIsPromoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant='primary' className='text-xs'>
        Admin
      </Badge>
    ) : (
      <Badge variant='secondary' className='text-xs'>
        Teacher
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <AdminRoute>
      <Layout>
        <div className='p-4 md:p-6 min-h-screen'>
          {isLoading ? (
            <>
              {/* Loading Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-80 mx-auto lg:mx-auto mb-3 animate-pulse'></div>
                    <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 mx-auto lg:mx-auto animate-pulse'></div>
                  </div>
                  <div className='h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse self-start sm:self-auto'></div>
                </div>
              </div>

              {/* Loading Search and Filters */}
              <div className='max-w-6xl mx-auto mb-6'>
                <div className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
                  <div className='h-12 w-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'></div>
                  <div className='flex gap-3'>
                    <div className='h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'></div>
                    <div className='h-12 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'></div>
                  </div>
                </div>
              </div>

              {/* Loading Table */}
              <div className='max-w-6xl mx-auto'>
                <div className='bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 p-6 md:p-8'>
                  {/* Table Headers */}
                  <div className='grid grid-cols-6 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700'>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className='h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'
                      ></div>
                    ))}
                  </div>

                  {/* Table Rows */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className='grid grid-cols-6 gap-4 mb-4 py-3'>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div
                          key={j}
                          className='h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'
                        ></div>
                      ))}
                    </div>
                  ))}

                  {/* Loading Pagination */}
                  <div className='flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700'>
                    <div className='h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'></div>
                    <div className='flex gap-2'>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className='mb-6 md:mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='lg:w-full'>
                    <h1 className='text-2xl md:text-4xl lg:text-center font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent'>
                      Manage Teachers
                    </h1>
                    <p className='text-slate-600 dark:text-slate-400 mt-2 md:mt-2 text-base md:text-lg lg:text-center'>
                      Add, edit, and manage teacher accounts in the system
                    </p>
                  </div>
                  <Badge
                    variant='primary'
                    className='px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium self-start sm:self-auto'
                  >
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className='max-w-6xl mx-auto mb-6'>
                  <div
                    className={`p-4 rounded-lg ${
                      message.includes('successfully')
                        ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        {message.includes('successfully') ? (
                          <CheckCircleIcon className='h-5 w-5 mr-2' />
                        ) : (
                          <ExclamationTriangleIcon className='h-5 w-5 mr-2' />
                        )}
                        {message}
                      </div>
                      <button
                        onClick={() => setMessage('')}
                        className='text-current hover:opacity-75'
                      >
                        <XMarkIcon className='h-5 w-5' />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filters */}
              <div className='max-w-7xl mx-auto mb-6'>
                <div className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
                  <div className='relative flex-1 max-w-md'>
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400' />
                    <Input
                      placeholder='Search by name, email, or employee ID'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  <div className='flex  gap-3'>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={statusOptions}
                      className='w-32'
                    />
                  </div>
                  <Button
                    variant='primary'
                    onClick={() => router.push('/admin/teachers/add')}
                    className='to-blue-600'
                    icon={<PlusIcon className='h-5 w-5' />}
                  >
                    Add New Teacher
                  </Button>
                </div>
              </div>

              {/* Teachers Table */}
              <div className='max-w-7xl mx-auto'>
                <Card
                  variant='glass'
                  className='border-white/20 bg-white/80 dark:bg-slate-800/80'
                >
                  <CardContent className='p-2 md:p-8'>
                    <div className='overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'>
                      <table className='w-full min-w-[1000px] lg:min-w-full'>
                        <thead className='bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700'>
                          <tr>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Name
                            </th>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Email Address
                            </th>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Employee ID
                            </th>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Management Unit
                            </th>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Role
                            </th>
                            <th className='text-left py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Created
                            </th>
                            <th className='text-right py-4 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider'>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                          {paginatedTeachers.map((teacher, index) => (
                            <tr
                              key={teacher.id}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                                index % 2 === 0
                                  ? 'bg-white dark:bg-slate-900/50'
                                  : 'bg-slate-50/50 dark:bg-slate-800/25'
                              }`}
                            >
                              <td className='py-4 px-4 sm:px-6'>
                                <div className='flex items-center space-x-3 min-w-[160px]'>
                                  <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0'>
                                    <UserIcon className='h-4 w-4 text-white' />
                                  </div>
                                  <span className='text-slate-900 dark:text-white font-medium truncate'>
                                    {teacher.full_name}
                                  </span>
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-400'>
                                <div className='min-w-[200px] max-w-[250px] truncate'>
                                  {teacher.email}
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-400'>
                                <div className='min-w-[120px] max-w-[140px] truncate'>
                                  {teacher.employee_id}
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-400'>
                                <div className='min-w-[180px] max-w-[220px] truncate'>
                                  {teacher.management_unit}
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6'>
                                <div className='min-w-[80px]'>
                                  {getRoleBadge(teacher.role)}
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-400'>
                                <div className='min-w-[100px] whitespace-nowrap'>
                                  {formatDate(teacher.created_at)}
                                </div>
                              </td>
                              <td className='py-4 px-4 sm:px-6'>
                                <div className='flex justify-end space-x-1 sm:space-x-2 min-w-[160px]'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setShowPromoteModal(true);
                                    }}
                                    className='!text-purple-600 hover:!text-purple-700 hover:!bg-purple-50 dark:hover:!bg-purple-900/20 text-xs sm:text-sm'
                                    icon={
                                      <ShieldCheckIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                                    }
                                  >
                                    <span className='hidden sm:inline'>
                                      {teacher.role === 'teacher'
                                        ? 'Promote'
                                        : 'Demote'}
                                    </span>
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      router.push(
                                        `/admin/teachers/${teacher.id}/edit`
                                      )
                                    }
                                    className='!text-blue-600 hover:!text-blue-700 hover:!bg-blue-50 dark:hover:!bg-blue-900/20 text-xs sm:text-sm'
                                    icon={
                                      <PencilIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                                    }
                                  >
                                    <span className='hidden sm:inline'>
                                      Edit
                                    </span>
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setShowDeleteModal(true);
                                    }}
                                    className='!text-red-600 hover:!text-red-700 hover:!bg-red-50 dark:hover:!bg-red-900/20 text-xs sm:text-sm'
                                    icon={
                                      <TrashIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                                    }
                                  >
                                    <span className='hidden sm:inline'>
                                      Delete
                                    </span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className='flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 mt-6'>
                        <p className='text-sm text-slate-600 dark:text-slate-400'>
                          Showing {startIndex + 1} to{' '}
                          {Math.min(
                            startIndex + itemsPerPage,
                            filteredTeachers.length
                          )}{' '}
                          of {filteredTeachers.length} teachers
                        </p>
                        <div className='flex space-x-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setCurrentPage(prev => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map(page => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? 'primary' : 'outline'
                              }
                              size='sm'
                              onClick={() => setCurrentPage(page)}
                              className='w-8 h-8 p-0'
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteModal && selectedTeacher && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                  <Card className='w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl'>
                    <CardContent className='p-6'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
                          <ExclamationTriangleIcon className='h-6 w-6 text-red-600 dark:text-red-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                          Delete Teacher
                        </h3>
                      </div>

                      <p className='text-slate-600 dark:text-slate-400 mb-6'>
                        Are you sure you want to delete{' '}
                        <strong>{selectedTeacher.full_name}</strong>? This
                        action cannot be undone and will remove all associated
                        data.
                      </p>

                      <div className='flex gap-3 justify-end'>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setShowDeleteModal(false);
                            setSelectedTeacher(null);
                          }}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant='error'
                          onClick={handleDeleteTeacher}
                          disabled={isDeleting}
                          className='bg-gradient-to-r from-red-600 to-red-700'
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Teacher'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Promote/Demote Confirmation Modal */}
              {showPromoteModal && selectedTeacher && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
                  <Card className='w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl'>
                    <CardContent className='p-6'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center'>
                          <ShieldCheckIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                          {selectedTeacher.role === 'teacher'
                            ? 'Promote to Admin'
                            : 'Demote to Teacher'}
                        </h3>
                      </div>

                      <p className='text-slate-600 dark:text-slate-400 mb-6'>
                        Are you sure you want to{' '}
                        {selectedTeacher.role === 'teacher'
                          ? 'promote'
                          : 'demote'}{' '}
                        <strong>{selectedTeacher.full_name}</strong>{' '}
                        {selectedTeacher.role === 'teacher'
                          ? 'to admin'
                          : 'to teacher'}
                        ? This will change their access permissions.
                      </p>

                      <div className='flex gap-3 justify-end'>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setShowPromoteModal(false);
                            setSelectedTeacher(null);
                          }}
                          disabled={isPromoting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant='primary'
                          onClick={handlePromoteTeacher}
                          disabled={isPromoting}
                          className='bg-gradient-to-r from-purple-600 to-purple-700'
                        >
                          {isPromoting
                            ? 'Processing...'
                            : selectedTeacher.role === 'teacher'
                              ? 'Promote'
                              : 'Demote'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation Footer */}
              <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-6 mt-6 max-w-6xl mx-auto'>
                <Button
                  variant='ghost'
                  onClick={() => router.push('/admin/dashboard')}
                  className='text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  icon={<ArrowLeftIcon className='h-4 w-4' />}
                >
                  Back to Dashboard
                </Button>

                <div className='flex space-x-4'>
                  <Button
                    variant='outline'
                    onClick={() => router.push('/admin/email-log')}
                    className='text-primary hover:bg-primary/10'
                  >
                    Email Log
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => router.push('/admin/settings')}
                    className='text-primary hover:bg-primary/10'
                  >
                    Account Settings
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </AdminRoute>
  );
}
