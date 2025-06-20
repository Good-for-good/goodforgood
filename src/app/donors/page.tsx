'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Donation } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaSearch, FaUserCircle, FaCalendarAlt, FaMoneyBillWave, FaTimes } from 'react-icons/fa';
import DataTable from '@/components/shared/DataTable';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DonorSummary {
  name: string;
  totalAmount: number;
  lastDonation: Date | null;
  donationCount: number;
}

interface DonorDonation {
  id: string;
  amount: number;
  date: Date;
  purpose: string;
  type: string;
}

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

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [donorDonations, setDonorDonations] = useState<DonorDonation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [donationsPage, setDonationsPage] = useState(1);
  const [totalDonations, setTotalDonations] = useState(0);
  const DONATIONS_PER_PAGE = 10;
  const { hasPermission, user } = useAuth();

  const fetchDonors = async (isNewSearch = false) => {
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

      const response = await fetch(`/api/donors?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch donors');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setDonors(data.donors);
      setTotalItems(data.total);
      setTotalAmount(data.totalAmount);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to load donors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorDonations = async (donorName: string, page = 1) => {
    try {
      setLoadingDonations(true);
      const response = await fetch(`/api/donations?search=${encodeURIComponent(donorName)}&page=${page}&limit=${DONATIONS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch donor donations');
      }
      
      const data = await response.json();
      setDonorDonations(data.donations || []);
      setTotalDonations(data.total || 0);
    } catch (err: any) {
      console.error('Error fetching donor donations:', err);
      toast.error('Failed to load donor donations');
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [currentPage, sortColumn, sortDirection]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDonors(true);
  };

  const handleSort = (column: string) => {
    setSortDirection(prev => 
      sortColumn === column 
        ? prev === 'asc' ? 'desc' : 'asc'
        : 'asc'
    );
    setSortColumn(column);
  };

  const handleViewDonations = async (donorName: string) => {
    setSelectedDonor(donorName);
    setDonationsPage(1);
    await fetchDonorDonations(donorName, 1);
  };

  const handleDonationsPageChange = async (page: number) => {
    if (selectedDonor) {
      setDonationsPage(page);
      await fetchDonorDonations(selectedDonor, page);
    }
  };

  const columns = useMemo(() => {
    const isRestrictedRole = user?.trusteeRole?.toLowerCase() === 'volunteer' || user?.trusteeRole?.toLowerCase() === 'general trustee';

    const baseColumns = [
      ...(!isRestrictedRole ? [{
      key: 'name',
      header: 'Donor Name',
      sortable: true
      }] : []),
    {
      key: 'totalAmount',
      header: 'Total Donations',
      sortable: true,
      render: (value: number) => formatAmount(value)
    },
    {
      key: 'donationCount',
      header: 'Number of Donations',
      sortable: true,
        render: (value: number, donor: DonorSummary) => (
          <div className="flex items-center gap-2">
            <span>{value} donation{value !== 1 ? 's' : ''}</span>
            {!isRestrictedRole && (
              <button
                onClick={() => handleViewDonations(donor.name)}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                View
              </button>
            )}
          </div>
        )
    },
    {
      key: 'lastDonation',
      header: 'Last Donation',
      sortable: true,
      render: (value: Date | null) => formatDate(value)
    }
  ];

    return baseColumns;
  }, [user]);

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Donors</h1>
            <p className="text-gray-600 mt-2">
            Total Donations: {formatAmount(totalAmount)}
          </p>
        </div>
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
                  placeholder="Search donors by name..."
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
                fetchDonors(true);
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

      {/* Donors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        columns={columns}
        data={donors}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={ITEMS_PER_PAGE}
        loading={loading}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onPageChange={setCurrentPage}
        onSort={handleSort}
      />
      </div>

      {/* Donor Donations Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user?.trusteeRole?.toLowerCase() === 'volunteer' || user?.trusteeRole?.toLowerCase() === 'general trustee'
                      ? 'Donation Details'
                      : `Donations by ${selectedDonor}`
                    }
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {totalDonations} donation{totalDonations !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDonor(null);
                    setDonorDonations([]);
                    setDonationsPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-12rem)]">
              {loadingDonations ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
                </div>
              ) : donorDonations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No donations found
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {donorDonations.map((donation) => (
                      <div key={donation.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatAmount(donation.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {donation.purpose || 'General Donation'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {formatDate(donation.date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {donation.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalDonations > DONATIONS_PER_PAGE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                      <div className="flex items-center">
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {((donationsPage - 1) * DONATIONS_PER_PAGE) + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(donationsPage * DONATIONS_PER_PAGE, totalDonations)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{totalDonations}</span>{' '}
                          donations
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDonationsPageChange(donationsPage - 1)}
                          disabled={donationsPage === 1}
                          className={`px-3 py-1 rounded-md ${
                            donationsPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleDonationsPageChange(donationsPage + 1)}
                          disabled={donationsPage * DONATIONS_PER_PAGE >= totalDonations}
                          className={`px-3 py-1 rounded-md ${
                            donationsPage * DONATIONS_PER_PAGE >= totalDonations
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 