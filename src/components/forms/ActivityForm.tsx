'use client';

import React, { useState, useEffect } from 'react';
import type { Activity } from '@/types';

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACTIVITY_CATEGORIES = [
  'Meeting',
  'Workshop',
  'Training',
  'Social Event',
  'Fundraiser',
  'Community Service',
  'Other'
];

const ACTIVITY_STATUS = [
  'upcoming',
  'ongoing',
  'completed',
  'cancelled'
] as const;

export default function ActivityForm({ activity, onSuccess, onCancel }: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContributionFields, setShowContributionFields] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    category: 'Meeting',
    status: 'upcoming',
    organizer: '',
    maxParticipants: '',
    budget: '',
    actualAmount: '',
    contributionNotes: '',
    notes: ''
  });

  useEffect(() => {
    if (activity) {
      const date = new Date(activity.date);
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        date: date.toISOString().split('T')[0],
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        location: activity.location || '',
        category: activity.category || 'Meeting',
        status: activity.status || 'upcoming',
        organizer: activity.organizer || '',
        maxParticipants: activity.maxParticipants?.toString() || '',
        budget: activity.budget?.toString() || '',
        actualAmount: activity.actualAmount?.toString() || '',
        contributionNotes: activity.contributionNotes || '',
        notes: activity.notes || ''
      });
      setShowContributionFields(activity.status === 'completed');
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));
    setShowContributionFields(newStatus === 'completed');
    setError(null);
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.date) errors.push('Date is required');
    if (!formData.startTime) errors.push('Start time is required');
    if (!formData.endTime) errors.push('End time is required');
    if (!formData.location.trim()) errors.push('Location is required');
    if (!formData.organizer.trim()) errors.push('Organizer is required');
    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
      errors.push('Maximum participants must be greater than 0');
    }
    if (formData.budget && parseFloat(formData.budget) < 0) {
      errors.push('Budget cannot be negative');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setLoading(false);
      return;
    }

    try {
      const timestamp = new Date();
      const activityData = {
        id: activity?.id, // Include ID for updates
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location.trim(),
        category: formData.category,
        status: formData.status,
        organizer: formData.organizer.trim(),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        currentParticipants: activity?.currentParticipants || 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        notes: formData.notes.trim() || null,
        updatedAt: timestamp
      };

      // Add contribution details if activity is completed
      if (formData.status === 'completed') {
        Object.assign(activityData, {
          actualAmount: formData.actualAmount ? parseFloat(formData.actualAmount) : null,
          contributionDate: timestamp,
          contributionNotes: formData.contributionNotes.trim() || null
        });
      }

      const url = activity?.id 
        ? `/api/activities/${activity.id}`
        : '/api/activities';

      const response = await fetch(url, {
        method: activity?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save activity');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving activity:', err);
      setError(err.message || 'Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Enter activity title"
          />
        </div>

        <div>
          <label htmlFor="organizer" className="block text-sm font-medium text-gray-700">
            Organizer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="organizer"
            name="organizer"
            required
            value={formData.organizer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Enter organizer name"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Enter location"
          />
        </div>

        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            required
            value={formData.startTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            required
            value={formData.endTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            {ACTIVITY_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleStatusChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            {ACTIVITY_STATUS.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
            Maximum Participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Enter maximum participants"
          />
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
            Budget (₹)
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Enter budget amount"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Enter activity description"
        />
      </div>

      {showContributionFields && (
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900">Contribution Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="actualAmount" className="block text-sm font-medium text-gray-700">
                Actual Amount (₹)
              </label>
              <input
                type="number"
                id="actualAmount"
                name="actualAmount"
                value={formData.actualAmount}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                placeholder="Enter actual amount spent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contributionNotes" className="block text-sm font-medium text-gray-700">
              Contribution Notes
            </label>
            <textarea
              id="contributionNotes"
              name="contributionNotes"
              rows={3}
              value={formData.contributionNotes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="Add notes about contributions"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          placeholder="Add any additional notes"
        />
      </div>

      <div className="flex justify-end space-x-3">
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
          {loading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
        </button>
      </div>
    </form>
  );
} 