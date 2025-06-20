'use client';

import React, { useEffect, useState } from 'react';
import type { Expense } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaSearch, FaReceipt, FaCalendarAlt, FaMoneyBillWave, FaUser, FaTag, FaTimes, FaEdit, FaPlus } from 'react-icons/fa';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';
import DataTable from '@/components/shared/DataTable';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = async (isNewSearch = false) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: ITEMS_PER_PAGE.toString(),
        sortColumn,
        sortDirection
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/expenses?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setExpenses(data.expenses);
      setTotalItems(data.total);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Failed to load expenses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, sortColumn, sortDirection]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchExpenses(true);
  };

  const handleSort = (column: string) => {
    setSortDirection(prev => 
      sortColumn === column 
        ? prev === 'asc' ? 'desc' : 'asc'
        : 'asc'
    );
    setSortColumn(column);
  };

  const handleAddClick = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
    fetchExpenses(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete expense');
      }

      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      fetchExpenses(true);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setError(err.message || 'Failed to delete expense. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (value: number) => formatAmount(value)
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'paidTo',
      header: 'Paid To',
      sortable: true,
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      sortable: true,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value: string) => formatDate(value)
    }
  ];

  const renderActions = (expense: Expense) => (
    <div className="flex justify-end space-x-2">
      <PermissionGate permission="expenses.edit">
        <button
          onClick={() => handleEditClick(expense)}
          className="text-yellow-600 hover:text-yellow-700"
          title="Edit expense"
        >
          <FaEdit className="w-5 h-5" />
        </button>
      </PermissionGate>
      <PermissionGate permission="expenses.delete">
        <button
          onClick={() => handleDeleteClick(expense)}
          className="text-red-600 hover:text-red-700"
          title="Delete expense"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </PermissionGate>
    </div>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
              <p className="text-gray-600 mt-2">
                Track and manage trust expenses
            </p>
          </div>
          <PermissionGate permission="expenses.create">
            <button
              onClick={handleAddClick}
                className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2"
            >
                <FaPlus className="w-4 h-4" />
              Add Expense
            </button>
          </PermissionGate>
        </div>

        {/* Search Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by description, category, or paid to..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
                <div className="flex gap-2">
            <button
              type="submit"
                    className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 whitespace-nowrap"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  fetchExpenses(true);
                }}
                      className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
                </div>
          </div>
        </form>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={expenses}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={ITEMS_PER_PAGE}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onPageChange={setCurrentPage}
          onSort={handleSort}
          actions={renderActions}
        />
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ExpenseForm
                expense={selectedExpense}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Expense</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this expense?
                <br />
                <span className="font-medium">
                  {expenseToDelete?.description} - {formatAmount(expenseToDelete?.amount || 0)}
                </span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setExpenseToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 