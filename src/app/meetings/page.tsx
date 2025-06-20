'use client';

import React, { useEffect, useState } from 'react';
import type { Meeting, MeetingAttendee } from '@/types';
import Modal from '@/components/shared/Modal';
import MeetingForm from '@/components/forms/MeetingForm';
import { format } from 'date-fns';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaFileAlt, FaPaperclip, FaPlus, FaSearch, FaEdit, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';

interface FormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  minutes: string;
  decisions: string[];
  attendees: any[];
  attachments: any[];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Modal states
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'details' | 'delete' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatAttendeeDisplay = (attendee: MeetingAttendee) => {
    return {
      id: attendee.memberId,
      name: attendee.member.name,
      role: attendee.role,
      present: attendee.present
    };
  };

  const fetchMeetings = async (pageNum = 1, search = '') => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/meetings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch meetings');
      
      const data = await response.json();
      if (pageNum === 1) {
        setMeetings(data.meetings);
      } else {
        setMeetings(prev => [...prev, ...data.meetings]);
      }
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError('Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings(1, searchTerm);
  }, [searchTerm]);

  const handleAddMeeting = () => {
    setSelectedMeeting(null);
    setModalType('add');
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalType('edit');
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalType('details');
  };

  const handleDeleteClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalType('delete');
  };

  const handleDelete = async () => {
    if (!selectedMeeting?.id) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete meeting');
      }

      // No need to wait for JSON parsing on successful delete
      setModalType(null);
      setSelectedMeeting(null);
      fetchMeetings(1, searchTerm);
      setPage(1);
    } catch (err: any) {
      console.error('Error deleting meeting:', err);
      setError(err.message || 'Failed to delete meeting. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = async (formData: any) => {
    try {
      const url = formData.id 
        ? `/api/meetings/${formData.id}`
        : '/api/meetings';
      
      console.log('Submitting meeting data:', formData);
      
      const response = await fetch(url, {
        method: formData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || 'Failed to save meeting');
      }

      setModalType(null);
      setSelectedMeeting(null);
      fetchMeetings(1, searchTerm);
      setPage(1);
    } catch (err: any) {
      console.error('Error in handleFormSuccess:', err);
      throw err; // Re-throw to be caught by the form's error handler
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMeetings(nextPage, searchTerm);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedMeeting(null);
  };

  const AttendeeRow = ({ attendee }: { attendee: MeetingAttendee }) => {
    return (
      <tr className="border-b border-gray-200">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {attendee.member?.name || 'Unknown Member'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {attendee.role || 'Attendee'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {attendee.present ? (
            <span className="text-green-600">Present</span>
          ) : (
            <span className="text-red-600">Absent</span>
          )}
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
            <p className="text-gray-600 mt-2">
              View and manage organization meetings
          </p>
        </div>
        <PermissionGate permission="meetings.create">
          <button
            onClick={handleAddMeeting}
              className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2"
          >
              <FaPlus className="w-4 h-4" />
            Add Meeting
          </button>
        </PermissionGate>
      </div>

        {/* Search */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search meetings..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Meetings Grid */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
            <FaCalendarAlt className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No meetings found. Create your first meeting to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => handleViewDetails(meeting)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  <div className="flex items-center space-x-2">
                    <PermissionGate permission="meetings.edit">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMeeting(meeting);
                        }}
                        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors duration-200"
                        title="Edit meeting"
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="meetings.delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(meeting);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete meeting"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-yellow-600" />
                    <span>{meeting.date ? format(new Date(meeting.date), 'PPP') : 'Date not set'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaClock className="text-yellow-600" />
                    <span>{meeting.startTime} - {meeting.endTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-yellow-600" />
                    <span>{meeting.location}</span>
                </div>

                  <div className="flex items-center gap-2">
                    <FaUsers className="text-yellow-600" />
                    <span>{meeting.attendees?.length || 0} Attendees</span>
                  </div>
                </div>

                {meeting.agenda && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-2">{meeting.agenda}</p>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          >
            Load More
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalType === 'add' || modalType === 'edit'}
        onClose={closeModal}
        title={modalType === 'edit' ? 'Edit Meeting' : 'Add New Meeting'}
      >
        <div className="p-6">
          <MeetingForm
            meeting={selectedMeeting}
            onSuccess={handleFormSuccess}
            onCancel={closeModal}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        title="Delete Meeting"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this meeting?
            <br />
            <span className="font-medium text-gray-900">
              {selectedMeeting?.title}
            </span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeModal}
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
        isOpen={modalType === 'details'}
          onClose={closeModal}
          title="Meeting Details"
        >
        {selectedMeeting && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedMeeting.title}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-yellow-600" />
                  <span>{selectedMeeting.date ? format(new Date(selectedMeeting.date), 'PPP') : 'Date not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-yellow-600" />
                  <span>{selectedMeeting.startTime} - {selectedMeeting.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-yellow-600" />
                  <span>{selectedMeeting.location}</span>
                </div>
              </div>
            </div>

            {selectedMeeting.agenda && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FaFileAlt className="text-yellow-600" />
                  Agenda
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeeting.agenda}</p>
                </div>
              </div>
            )}

            {selectedMeeting.minutes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FaFileAlt className="text-yellow-600" />
                  Minutes
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeeting.minutes}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FaUsers className="text-yellow-600" />
                Attendees
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedMeeting.attendees.map((attendee) => (
                  <span
                    key={attendee.memberId}
                    className={`px-3 py-1 text-sm rounded-full ${
                      attendee.present
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {attendee.member.name} {attendee.role ? `(${attendee.role})` : ''}
                  </span>
                ))}
              </div>
            </div>

            {selectedMeeting.attachments && selectedMeeting.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FaPaperclip className="text-yellow-600" />
                  Attachments
                </h4>
                <ul className="space-y-2">
                  {selectedMeeting.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <FaPaperclip className="text-blue-600" />
                        {attachment.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        </Modal>
    </div>
  );
} 