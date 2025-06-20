'use client';

import React, { useState, useEffect } from 'react';
import type { Expense } from '@/types';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    paymentMethod: '',
    paidTo: '',
    billNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        paidTo: expense.paidTo,
        billNumber: expense.billNumber || '',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const expenseData = {
        description: formData.description,
        amount: parseInt(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        paidTo: formData.paidTo,
        billNumber: formData.billNumber || null,
        notes: formData.notes || null
      };

      const response = await fetch(
        `/api/expenses${expense?.id ? `/${expense.id}` : ''}`,
        {
          method: expense?.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expense?.id ? { ...expenseData, id: expense.id } : expenseData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save expense');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    'Office Supplies',
    'Utilities',
    'Rent',
    'Events',
    'Food & Beverages',
    'Transportation',
    'Medical Aid',
    'Education Support',
    'Infrastructure',
    'Maintenance',
    'Salaries',
    'Marketing',
    'Other'
  ];

  const paymentMethodOptions = [
    'Cash',
    'Bank Transfer',
    'Cheque',
    'UPI',
    'Credit Card',
    'Debit Card',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Brief description of the expense"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (₹) *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="1"
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          <option value="">Select a category</option>
          {categoryOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method *
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          <option value="">Select payment method</option>
          {paymentMethodOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paidTo" className="block text-sm font-medium text-gray-700 mb-1">
          Paid To *
        </label>
        <input
          type="text"
          id="paidTo"
          name="paidTo"
          value={formData.paidTo}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Name of vendor or recipient"
        />
      </div>

      <div>
        <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Bill/Invoice Number
        </label>
        <input
          type="text"
          id="billNumber"
          name="billNumber"
          value={formData.billNumber}
          onChange={handleChange}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Optional: Enter bill or invoice number"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Additional notes or details"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
} 