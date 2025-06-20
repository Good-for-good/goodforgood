'use client';

import React, { useEffect, useState } from 'react';
import type { Member, TrusteeRole } from '@/types';
import Modal from '@/components/shared/Modal';
import MemberForm from '@/components/forms/MemberForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaSearch, FaUserCircle, FaEdit, FaTrash, FaEnvelope, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { getRoleDescription } from '@/constants/roles';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';

const ITEMS_PER_PAGE = 10;

function formatDate(date: string | Date | null): string {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMembers = async (isNewSearch = false) => {
    try {
      setLoading(true);

      // Reset skip if it's a new search
      if (isNewSearch) {
        setSkip(0);
      }

      const response = await fetch('/api/members', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      console.log('Fetched members:', data); // Debug log
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Filter members based on search term
      const filteredData = searchTerm
        ? data.members.filter((member: Member) => 
            member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data.members;

      // Apply pagination
      const paginatedData = filteredData.slice(skip, skip + ITEMS_PER_PAGE);
      
      if (isNewSearch) {
        setMembers(paginatedData);
      } else {
        setMembers(prev => [...prev, ...paginatedData]);
      }

      setHasMore(skip + ITEMS_PER_PAGE < filteredData.length);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message || 'Failed to fetch members. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(true);
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchMembers(true);
  };

  const handleEditClick = async (member: Member) => {
    try {
      // Fetch fresh member data before editing
      const response = await fetch(`/api/members/${member.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch member details');
      }
      const memberData = await response.json();
      setSelectedMember(memberData);
      setIsEditModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching member details:', err);
      setError(err.message || 'Failed to load member details');
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedMember(null);
    fetchMembers(true);
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      fetchMembers(true);
    } catch (err: any) {
      console.error('Error deleting member:', err);
      setError(err.message || 'Failed to delete member. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    await fetchMembers(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      setSkip(prev => prev + ITEMS_PER_PAGE);
      fetchMembers();
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-800">Members</h1>
            <p className="text-gray-600 mt-2">Manage Good for Good trust members</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium">
              <span>Total Members: {members.length}</span>
            </div>
        </div>
        <PermissionGate permission="members.create">
        <button
          onClick={() => {
            setSelectedMember(null);
            setIsAddModalOpen(true);
          }}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span className="text-lg">+</span> Add Member
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
              placeholder="Search members by name, email, or phone..."
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
          {isSearching && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSearchTerm('');
                setIsSearching(false);
                fetchMembers(true);
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

      {/* Members Grid */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-50 mb-4">
            <FaUserCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No members found. Add your first member to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={`${member.name}'s photo`}
                          className="h-16 w-16 rounded-full object-cover border-2 border-yellow-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-yellow-50 flex items-center justify-center">
                          <FaUserCircle className="w-8 h-8 text-yellow-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {member.name || 'No Name'}
                      </h3>
                      {member.trusteeRole && (
                        <div className="mt-1">
                          <p className="text-yellow-600 font-medium truncate">{member.trusteeRole}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{getRoleDescription(member.trusteeRole as TrusteeRole)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm text-gray-600 flex items-center hover:text-yellow-600 transition-colors duration-200 group"
                    >
                      <FaEnvelope className="w-4 h-4 mr-2 flex-shrink-0 group-hover:text-yellow-600" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="text-sm text-gray-600 flex items-center hover:text-yellow-600 transition-colors duration-200 group"
                    >
                      <FaPhone className="w-4 h-4 mr-2 flex-shrink-0 group-hover:text-yellow-600" />
                      <span className="truncate">{member.phone}</span>
                    </a>
                  )}
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Joined: {formatDate(member.joinDate)}</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  <PermissionGate permission="members.edit">
                  <button
                    onClick={() => handleEditClick(member)}
                      className="text-sm px-3 py-1.5 text-yellow-600 hover:text-yellow-700 font-medium flex items-center group"
                  >
                      <FaEdit className="w-4 h-4 mr-1.5 group-hover:text-yellow-600" />
                    Edit
                  </button>
                  </PermissionGate>
                  <PermissionGate permission="members.delete">
                  <button
                    onClick={() => handleDeleteClick(member)}
                      className="text-sm px-3 py-1.5 text-red-600 hover:text-red-700 font-medium flex items-center group"
                  >
                      <FaTrash className="w-4 h-4 mr-1.5 group-hover:text-red-600" />
                    Delete
                  </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Load More
          </button>
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Member"
      >
        <MemberForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
        }}
        title="Edit Member"
      >
        <MemberForm
          member={selectedMember}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMember(null);
        }}
        title="Delete Member"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this member?
            <br />
            <span className="font-semibold">{selectedMember?.name}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMember(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                isDeleting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 