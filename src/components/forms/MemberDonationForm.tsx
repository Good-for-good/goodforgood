'use client';

import React, { useState, useEffect } from 'react';
import { prisma } from '@/lib/db';
import type { Member, Donation } from '@/types';

interface MemberDonationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

export default function MemberDonationForm({ onSuccess, onCancel }: MemberDonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDonations, setMemberDonations] = useState<Donation[]>([]);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    purpose: '',
    notes: ''
  });

  // Fetch all trustees
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/trustees');
        if (!response.ok) {
          throw new Error('Failed to fetch trustees');
        }
        const data = await response.json();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching trustees:', err);
        setError('Failed to load trustees. Please try again.');
      }
    };
    fetchMembers();
  }, []);

  // Fetch member's donation history when a member is selected
  useEffect(() => {
    const fetchMemberDonations = async () => {
      if (!selectedMember) {
        setMemberDonations([]);
        return;
      }

      try {
        const response = await fetch(`/api/donations?memberId=${selectedMember.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch member donations');
        }
        const data = await response.json();
        setMemberDonations(data.donations || []);
      } catch (err) {
        console.error('Error fetching member donations:', err);
        setMemberDonations([]);
      }
    };

    fetchMemberDonations();
  }, [selectedMember]);

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === memberId) || null;
    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      memberId
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donor: selectedMember.name,
          memberId: selectedMember.id,
          amount: parseInt(formData.amount),
          purpose: formData.purpose,
          notes: formData.notes || undefined,
          date: new Date(),
          type: 'member'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save donation');
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving donation:', err);
      setError('Failed to save donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    'Monthly Contribution',
    'Special Contribution',
    'Event Contribution',
    'Other'
  ];

  const totalContributions = memberDonations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-gray-700">
            Select Trustee *
          </label>
          <select
            id="memberId"
            name="memberId"
            value={formData.memberId}
            onChange={handleMemberChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a trustee</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.trusteeRole})
              </option>
            ))}
          </select>
        </div>

        {selectedMember && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Trustee Details</h3>
            <p className="text-sm text-gray-600">Total Contributions: {formatAmount(totalContributions)}</p>
            <p className="text-sm text-gray-600">Member Since: {formatDate(selectedMember.joinDate)}</p>
            <p className="text-sm text-gray-600">Role: {selectedMember.trusteeRole}</p>
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            Purpose *
          </label>
          <select
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add Donation'}
          </button>
        </div>
      </form>

      {selectedMember && memberDonations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Donations</h3>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {memberDonations.slice(0, 5).map(donation => (
                <li key={donation.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatAmount(donation.amount)}</p>
                      <p className="text-sm text-gray-500">{donation.purpose}</p>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(donation.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 