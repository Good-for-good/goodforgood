'use client';

import React, { useState, useEffect } from 'react';
import type { Donation } from '@/types';

interface DonationFormProps {
  donation?: Donation | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DonationForm({ donation, onSuccess, onCancel }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    donor: '',
    amount: '',
    purpose: '',
    notes: '',
    type: 'general',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (donation) {
      setFormData({
        donor: donation.donor,
        amount: donation.amount.toString(),
        purpose: donation.purpose,
        notes: donation.notes || '',
        type: donation.type || 'general',
        date: new Date(donation.date).toISOString().split('T')[0]
      });
    }
  }, [donation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setValidationErrors([]);
    setError(null);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.donor.trim()) errors.push('Donor name is required');
    if (!formData.amount || parseInt(formData.amount) <= 0) errors.push('Amount must be greater than 0');
    if (!formData.purpose) errors.push('Purpose is required');
    if (!formData.type) errors.push('Type is required');
    if (!formData.date) errors.push('Date is required');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const donationData = {
        donor: formData.donor.trim(),
        amount: parseInt(formData.amount),
        purpose: formData.purpose,
        notes: formData.notes.trim() || undefined,
        date: new Date(formData.date),
        type: formData.type as 'general' | 'special'
      };

      const url = donation?.id 
        ? `/api/donations/${donation.id}`
        : '/api/donations';

      const response = await fetch(url, {
        method: donation?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save donation');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving donation:', err);
      setError(err.message || 'Failed to save donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    'General Fund',
    'Education',
    'Healthcare',
    'Food Distribution',
    'Infrastructure',
    'Emergency Relief',
    'Other'
  ];

  const typeOptions = [
    { value: 'general', label: 'General' },
    { value: 'special', label: 'Special' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <ul className="list-disc list-inside">
            {validationErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="donor" className="block text-sm font-medium text-gray-700">
          Donor Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="donor"
          name="donor"
          value={formData.donor}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Enter donor name"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Enter amount"
        />
      </div>

      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
          Purpose <span className="text-red-500">*</span>
        </label>
        <select
          id="purpose"
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          <option value="">Select a purpose</option>
          {purposeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Add any additional notes"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : donation ? 'Update Donation' : 'Add Donation'}
        </button>
      </div>
    </form>
  );
} 