'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { Member, TrusteeRole } from '@/types';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaUserTie, FaCalendarAlt, FaEnvelope, FaPhone, FaUserCircle, FaFilter, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { TRUSTEE_ROLES, getRoleDescription, getRoleOrder } from '@/constants/roles';
import Modal from '@/components/shared/Modal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';
import { useNotifications } from '@/contexts/NotificationContext';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return formattedDate;
  } catch (e) {
    return 'Invalid Date';
  }
}

export default function TrusteesPage() {
  const [trustees, setTrustees] = useState<Member[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { refreshNotifications } = useNotifications();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trusteesResponse, pendingResponse] = await Promise.all([
        fetch('/api/trustees', { 
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/members?status=pending', {
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);
      
      if (!trusteesResponse.ok || !pendingResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [trusteesData, pendingData] = await Promise.all([
        trusteesResponse.json(),
        pendingResponse.json()
      ]);

      console.log('API Response - Trustees:', trusteesData);
      console.log('API Response - Pending:', pendingData);

      if (trusteesData.error || pendingData.error) {
        throw new Error(trusteesData.error || pendingData.error);
      }

      // Extract members array from response if it exists
      const trusteesArray = Array.isArray(trusteesData) ? trusteesData : trusteesData.members || [];
      const pendingArray = Array.isArray(pendingData) ? pendingData : pendingData.members || [];

      // Validate data structure
      if (!Array.isArray(trusteesArray)) {
        console.error('Invalid trustees data:', trusteesData);
        throw new Error('Trustees data is not an array');
      }

      if (!Array.isArray(pendingArray)) {
        console.error('Invalid pending registrations data:', pendingData);
        throw new Error('Pending registrations data is not an array');
      }

      setTrustees(trusteesArray);
      setPendingRegistrations(pendingArray);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data. Please try again later.');
      toast.error('Failed to load data');
      // Initialize with empty arrays on error
      setTrustees([]);
      setPendingRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      await fetchData();
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleApproveRegistration = async (memberId: string) => {
    try {
      setUpdatingRole(true);
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountStatus: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve registration');
      }

      setPendingRegistrations(prev => prev.filter(member => member.id !== memberId));
      toast.success('Registration approved successfully');
      await fetchData();
      await refreshNotifications();
      setIsUpdateModalOpen(false);
      setSelectedMember(null);
    } catch (err: any) {
      console.error('Error approving registration:', err);
      setError(err.message || 'Failed to approve registration');
      toast.error('Failed to approve registration');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRejectRegistration = async (memberId: string) => {
    if (!confirm('Are you sure you want to reject this registration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to reject registration');
      }

      toast.success('Registration rejected');
      await fetchData();
      await refreshNotifications();
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      setError(err.message || 'Failed to reject registration');
      toast.error('Failed to reject registration');
    }
  };

  const handleUpdateRole = async (newRole: string | null) => {
    if (!selectedMember) return;

    try {
      setUpdatingRole(true);
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trusteeRole: newRole,
          roleStartDate: newRole ? new Date().toISOString() : null,
          roleEndDate: null,
          accountStatus: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setPendingRegistrations(prev => prev.filter(member => member.id !== selectedMember.id));
      toast.success(newRole ? 'Role assigned successfully' : 'Role removed successfully');
      await fetchData();
      setIsUpdateModalOpen(false);
      setSelectedMember(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role');
      toast.error('Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleImageError = useCallback((memberId: string) => {
    setFailedImages(prev => new Set(prev).add(memberId));
  }, []);

  const renderMemberImage = useCallback((member: Member) => {
    if (failedImages.has(member.id) || !member.photo) {
      return (
        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <FaUserCircle className="w-8 h-8 text-yellow-600" />
        </div>
      );
    }

    return (
      <img
        src={member.photo}
        alt={member.name}
        className="h-16 w-16 rounded-full object-cover border-2 border-yellow-100"
        onError={() => handleImageError(member.id)}
      />
    );
  }, [failedImages, handleImageError]);

  // Memoize filtered and sorted trustees
  const { filteredTrustees, groupedTrustees } = useMemo(() => {
    const sorted = [...trustees].sort((a, b) => {
      const orderA = getRoleOrder(a.trusteeRole as TrusteeRole);
      const orderB = getRoleOrder(b.trusteeRole as TrusteeRole);
      return orderA === orderB ? a.name.localeCompare(b.name) : orderA - orderB;
    });

    const filtered = selectedRole === 'all' 
      ? sorted 
      : sorted.filter(t => t.trusteeRole === selectedRole);

    const grouped = filtered.reduce((acc, trustee) => {
      const role = trustee.trusteeRole || 'Other';
      if (!acc[role]) acc[role] = [];
      acc[role].push(trustee);
      return acc;
    }, {} as Record<string, Member[]>);

    return { filteredTrustees: filtered, groupedTrustees: grouped };
  }, [trustees, selectedRole]);

  // Memoize filtered pending registrations
  const filteredPendingRegistrations = useMemo(() => {
    // Ensure pendingRegistrations is an array before filtering
    return Array.isArray(pendingRegistrations) 
      ? pendingRegistrations.filter(member => !member.trusteeRole)
      : [];
  }, [pendingRegistrations]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading trustees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" key="trustees-container">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Trustees</h1>
            <p className="text-gray-600 mt-2">Current trustees of Good for Good trust</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium">
                <span>Total Trustees: {trustees.length}</span>
              </div>
              {Object.entries(groupedTrustees).map(([role, roleTrustees]) => (
                <div key={role} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-sm font-medium">
                  <span>{role}: {roleTrustees.length}</span>
                </div>
              ))}
            </div>
        </div>
          <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaFilter className="w-4 h-4" />
            Filters
          </button>
          <Link
            href="/members"
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaUserTie className="w-4 h-4" />
            Manage Members
          </Link>
        </div>
      </div>

        {/* Filter Section */}
      {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
          >
            <option value="all">All Roles</option>
            {TRUSTEE_ROLES.map(({ role, description }) => (
              <option key={role} value={role}>{role} - {description}</option>
            ))}
          </select>
        </div>
      )}
      </div>

      {/* Pending Registrations Section */}
      {filteredPendingRegistrations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <div className="relative mr-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75" 
                   style={{ animationDuration: '2s' }} />
            </div>
            Pending Registrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPendingRegistrations.map((member) => (
              <div
                key={member.id}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
              >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {renderMemberImage(member)}
                    </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {member.name}
                      </h3>
                    <div className="mt-2 space-y-2">
                        <p className="text-sm text-gray-600 flex items-center">
                        <FaEnvelope className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                        <FaPhone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                        <FaCalendarAlt className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Registered: {formatDate(member.joinDate)}</span>
                        </p>
                      </div>
                    <div className="mt-4">
                        <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setIsUpdateModalOpen(true);
                          }}
                            className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <FaCheck className="w-4 h-4" />
                          Approve & Set Role
                        </button>
                          <button
                            onClick={() => handleRejectRegistration(member.id)}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <FaTimes className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trustees Section */}
      {trustees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-50 mb-4">
            <FaUserTie className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">No trustees found.</p>
          <Link
            href="/members"
            className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium"
          >
            Add trustees from the members page
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        Object.entries(groupedTrustees).map(([role, trustees]) => (
          <div key={role} className="mb-8">
            <div className="flex items-center gap-3 mb-4 px-1">
              <h2 className="text-xl font-semibold text-gray-800">{role}</h2>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-sm">
                {trustees.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trustees.map((trustee) => (
                <div
                  key={trustee.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {renderMemberImage(trustee)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {trustee.name}
                          </h3>
                          <p className="text-yellow-600 font-medium">
                            {trustee.trusteeRole}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {getRoleDescription(trustee.trusteeRole as TrusteeRole)}
                          </p>
                        </div>
                      </div>
                      <PermissionGate permission="members.edit">
                      <button
                        onClick={() => {
                          setSelectedMember(trustee);
                          setIsUpdateModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                        title="Update Role"
                      >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        </PermissionGate>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">Since {formatDate(trustee.roleStartDate)}</span>
                      </div>
                      {trustee.roleEndDate && (
                        <div className="flex items-center text-red-600">
                          <FaCalendarAlt className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Until {formatDate(trustee.roleEndDate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-2">
                        <a
                          href={`mailto:${trustee.email}`}
                          className="text-sm text-gray-600 flex items-center hover:text-yellow-600 transition-colors duration-200 group"
                        >
                          <FaEnvelope className="w-4 h-4 mr-2 flex-shrink-0 group-hover:text-yellow-600" />
                          <span className="truncate">{trustee.email}</span>
                        </a>
                        <a
                          href={`tel:${trustee.phone}`}
                          className="text-sm text-gray-600 flex items-center hover:text-yellow-600 transition-colors duration-200 group"
                        >
                          <FaPhone className="w-4 h-4 mr-2 flex-shrink-0 group-hover:text-yellow-600" />
                          <span className="truncate">{trustee.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedMember(null);
        }}
        title="Update Trustee Role"
      >
        <div className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Update role for <span className="font-semibold">{selectedMember?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {TRUSTEE_ROLES.map(({ role, description }) => (
              <button
                key={role}
                onClick={() => handleUpdateRole(role)}
                disabled={updatingRole}
                className={`p-3 text-left rounded-lg border transition-all duration-200 ${
                  selectedMember?.trusteeRole === role
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <h3 className="font-medium text-gray-900">{role}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </button>
            ))}

            <button
              onClick={() => handleUpdateRole(null)}
              disabled={updatingRole}
              className="p-3 text-left rounded-lg border border-red-200 hover:border-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <h3 className="font-medium text-red-600">Remove Role</h3>
              <p className="text-sm text-gray-600">Remove trustee role from this member</p>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setIsUpdateModalOpen(false);
                setSelectedMember(null);
              }}
              disabled={updatingRole}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 