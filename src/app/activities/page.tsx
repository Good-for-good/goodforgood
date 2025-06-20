'use client';

import React, { useEffect, useState } from 'react';
import type { Activity } from '@/types';
import Modal from '@/components/shared/Modal';
import ActivityForm from '@/components/forms/ActivityForm';
import ActivityParticipants from '@/components/shared/ActivityParticipants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaClock, FaTimes, FaEdit, FaPlus } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';

const ITEMS_PER_PAGE = 10;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

function formatTime(time: string | null): string {
  if (!time) return 'N/A';
  try {
    const [hours, minutes] = time.split(':');
    return new Date(0, 0, 0, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (e) {
    return time;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800';
    case 'ongoing':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchActivities = async (isNewSearch = false) => {
    try {
      isNewSearch ? setLoading(true) : setLoadingMore(true);
      
      // Reset skip if it's a new search
      if (isNewSearch) {
        setSkip(0);
      }

      const queryParams = new URLSearchParams({
        skip: isNewSearch ? '0' : skip.toString(),
        take: ITEMS_PER_PAGE.toString()
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }

      const response = await fetch(`/api/activities?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (isNewSearch) {
        setActivities(data.activities);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
      }

      setHasMore(data.hasMore);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [statusFilter]);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchActivities(true);
  };

  const handleEditClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedActivity(null);
    fetchActivities(true);
  };

  const handleDeleteClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;

    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/activities/${selectedActivity.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete activity');
      }

      setIsDeleteModalOpen(false);
      setSelectedActivity(null);
      await fetchActivities(true);
    } catch (err: any) {
      console.error('Error deleting activity:', err);
      setError(err.message || 'Failed to delete activity. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    setSkip(0);
    await fetchActivities(true);
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
      setSkip(prev => prev + ITEMS_PER_PAGE);
      fetchActivities();
    }
  };

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
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

  const upcomingActivities = activities.filter(a => a.status === 'upcoming').length;
  const ongoingActivities = activities.filter(a => a.status === 'ongoing').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Activities</h1>
            <p className="text-gray-600 mt-2">
              {upcomingActivities} upcoming • {ongoingActivities} ongoing • {completedActivities} completed
            </p>
          </div>
          <PermissionGate permission="activities.create">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add Activity
            </button>
          </PermissionGate>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              {(searchTerm || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setCurrentPage(1);
                    fetchActivities();
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
            <FaCalendarAlt className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No activities found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => handleViewDetails(activity)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activity.title}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium mt-2 rounded-full ${
                      activity.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PermissionGate permission="activities.edit">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(activity);
                        }}
                        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                        title="Edit activity"
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="activities.delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(activity);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete activity"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-gray-600 text-sm flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(activity.date)}
                  </p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <FaClock className="w-4 h-4 mr-2 text-gray-400" />
                    {activity.startTime} - {activity.endTime}
                  </p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                    {activity.location}
                  </p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <FaUserFriends className="w-4 h-4 mr-2 text-gray-400" />
                    {activity.currentParticipants || 0} / {activity.maxParticipants || '∞'} Participants
                  </p>
                </div>

                {activity.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loadingMore && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
        </div>
      )}

      {/* Activity Form Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedActivity(null);
        }}
        title={selectedActivity ? 'Edit Activity' : 'Add New Activity'}
      >
        <ActivityForm
          activity={selectedActivity || undefined}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedActivity(null);
            fetchActivities();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedActivity(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedActivity(null);
        }}
        title="Delete Activity"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this activity?
            <br />
            <span className="font-medium text-gray-900">
              {selectedActivity?.title}
            </span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedActivity(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedActivity(null);
        }}
        title="Activity Details"
      >
        {selectedActivity && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedActivity.title}
              </h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                selectedActivity.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                selectedActivity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {selectedActivity.status.charAt(0).toUpperCase() + selectedActivity.status.slice(1)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <FaCalendarAlt className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Date & Time</p>
                  <p className="text-gray-600">
                    {formatDate(selectedActivity.date)}
                    <br />
                    {selectedActivity.startTime} - {selectedActivity.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FaMapMarkerAlt className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{selectedActivity.location}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FaUserFriends className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Participants</p>
                  <p className="text-gray-600">
                    {selectedActivity.currentParticipants || 0} / {selectedActivity.maxParticipants || '∞'} participants
                  </p>
                </div>
              </div>
            </div>

            {selectedActivity.description && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Description</p>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedActivity.description}
                </p>
              </div>
            )}

            {selectedActivity.notes && (
              <div>
                <p className="font-medium text-gray-900 mb-2">Additional Notes</p>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedActivity.notes}
                </p>
              </div>
            )}

            {selectedActivity.status === 'completed' && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <p className="font-medium text-gray-900 mb-4">Financial Details</p>
                  <div className="space-y-2">
                    {selectedActivity.budget && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{formatAmount(selectedActivity.budget)}</span>
                      </div>
                    )}
                    {selectedActivity.actualAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Amount:</span>
                        <span className="font-medium">{formatAmount(selectedActivity.actualAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedActivity.contributionNotes && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Contribution Notes</p>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedActivity.contributionNotes}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
} 