'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Donation } from '@/types';
import DonationForm from '@/components/forms/DonationForm';
import MemberDonationForm from '@/components/forms/MemberDonationForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaMoneyBillWave, FaCalendarAlt, FaUser, FaTimes, FaEdit, FaSearch } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';
import DataTable from '@/components/shared/DataTable';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const ITEMS_PER_PAGE = 10;

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission, user } = useAuth();

  const fetchDonations = async (isNewSearch = false) => {
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

      const response = await fetch(`/api/donations?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setDonations(data.donations);
      setTotalItems(data.total);
      setTotalAmount(data.totalAmount);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching donations:', err);
      setError(err.message || 'Failed to load donations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [currentPage, sortColumn, sortDirection]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDonations(true);
  };

  const handleSort = (column: string) => {
    setSortDirection(prev => 
      sortColumn === column 
        ? prev === 'asc' ? 'desc' : 'asc'
        : 'asc'
    );
    setSortColumn(column);
  };

  const handleEditClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsGeneralModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsGeneralModalOpen(false);
    setIsMemberModalOpen(false);
    setSelectedDonation(null);
    fetchDonations(true);
  };

  const handleDeleteClick = (donation: Donation) => {
    setDonationToDelete(donation);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!donationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/donations/${donationToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete donation');
      }

      setIsDeleteModalOpen(false);
      setDonationToDelete(null);
      fetchDonations(true);
    } catch (err: any) {
      console.error('Error deleting donation:', err);
      setError(err.message || 'Failed to delete donation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => {
    const isRestrictedRole = user?.trusteeRole?.toLowerCase() === 'volunteer' || user?.trusteeRole?.toLowerCase() === 'general trustee';

    const baseColumns = [
      ...(!isRestrictedRole ? [{
      key: 'donor',
      header: 'Donor',
      sortable: true,
      render: (row: any) => (
        <div>
          <div>{row.member ? row.member.name : row}</div>
          {row.member && (
            <div className="text-sm text-gray-500">{row.member.email}</div>
          )}
        </div>
      )
      }] : []),
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (value: any) => formatAmount(value)
    },
    {
      key: 'purpose',
      header: 'Purpose',
      sortable: true,
      render: (value: any) => value || 'General Donation'
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value: any) => formatDate(value)
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (value: any) => value.charAt(0).toUpperCase() + value.slice(1)
    }
  ];

    return baseColumns;
  }, [user]);

  const renderActions = (donation: Donation) => (
    <div className="flex justify-end space-x-2">
      <PermissionGate permission="donations.edit">
        <button
          onClick={() => handleEditClick(donation)}
          className="text-yellow-600 hover:text-yellow-700"
          title="Edit donation"
        >
          <FaEdit className="w-5 h-5" />
        </button>
      </PermissionGate>
      <PermissionGate permission="donations.delete">
        <button
          onClick={() => handleDeleteClick(donation)}
          className="text-red-600 hover:text-red-700"
          title="Delete donation"
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
              <h1 className="text-3xl font-bold text-gray-800">Donations</h1>
              <p className="text-gray-600 mt-2">
              Total Donations: {formatAmount(totalAmount)}
            </p>
          </div>
          <PermissionGate permission="donations.create">
              <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsMemberModalOpen(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                  <FaUser className="w-4 h-4" />
                  Member Donation
              </button>
              <button
                onClick={() => setIsGeneralModalOpen(true)}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                  <FaMoneyBillWave className="w-4 h-4" />
                  General Donation
              </button>
            </div>
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
                    placeholder="Search donations by donor, purpose, or notes..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 bg-white"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
                <div className="flex gap-2">
            <button
              type="submit"
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 whitespace-nowrap"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  fetchDonations(true);
                }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 whitespace-nowrap"
              >
                Clear
              </button>
            )}
                </div>
          </div>
        </form>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={donations}
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

      {/* Modals */}
      {isGeneralModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedDonation ? 'Edit Donation' : 'Add General Donation'}
                </h2>
                <button
                  onClick={() => {
                    setIsGeneralModalOpen(false);
                    setSelectedDonation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <DonationForm
                donation={selectedDonation}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsGeneralModalOpen(false);
                  setSelectedDonation(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Member Donation Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Member Donation
                </h2>
                <button
                  onClick={() => setIsMemberModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <MemberDonationForm
                onSuccess={handleFormSuccess}
                onCancel={() => setIsMemberModalOpen(false)}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Donation</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this donation?
                <br />
                <span className="font-medium">
                  {donationToDelete?.donor} - {formatAmount(donationToDelete?.amount || 0)}
                </span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDonationToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
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