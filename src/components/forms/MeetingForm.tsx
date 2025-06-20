import React, { useEffect, useState } from 'react';
import type { Meeting, Member, MeetingAttendee, MeetingDecision, MeetingAttachment } from '@/types';

interface MeetingFormProps {
  meeting?: Meeting | null;
  onSuccess: (formData: ApiData) => Promise<void>;
  onCancel: () => void;
}

interface FormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  minutes: string;
  attendees: {
    id: string;
    memberId: string;
    name: string;
    role?: string;
    present: boolean;
  }[];
  decisions: string[];
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
}

interface ApiData {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  agenda: string;
  minutes: string;
  decisions: string[];
  attendees: {
    memberId: string;
    role?: string;
    present: boolean;
  }[];
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
}

export default function MeetingForm({ meeting, onSuccess, onCancel }: MeetingFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    agenda: '',
    minutes: '',
    attendees: [],
    decisions: [],
    attachments: []
  });

  useEffect(() => {
    fetchMembers();
    if (meeting) {
      setFormData({
        title: meeting.title,
        date: meeting.date instanceof Date ? meeting.date.toISOString().split('T')[0] : '',
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        agenda: meeting.agenda,
        minutes: meeting.minutes,
        attendees: meeting.attendees.map(a => ({
          id: a.memberId,
          memberId: a.memberId,
          name: a.member.name,
          role: a.role,
          present: a.present
        })),
        decisions: meeting.decisions.map(d => d.decision),
        attachments: meeting.attachments.map(a => ({
          name: a.name,
          url: a.url,
          type: a.type
        }))
      });
    }
  }, [meeting]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch('/api/members');
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setMembers(data.members || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message || 'Failed to load members. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttendeeChange = (memberId: string, isPresent: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setFormData(prev => {
      if (!isPresent) {
        return {
          ...prev,
          attendees: prev.attendees.filter(a => a.id !== memberId)
        };
      }

      const existingAttendee = prev.attendees.find(a => a.id === memberId);
      if (existingAttendee) {
        return {
          ...prev,
          attendees: prev.attendees.map(a =>
            a.id === memberId ? { ...a, present: isPresent } : a
          )
        };
      }

      return {
        ...prev,
        attendees: [
          ...prev.attendees,
          {
            id: memberId,
            memberId: member.id,
            name: member.name,
            role: member.trusteeRole || undefined,
            present: isPresent
          }
        ]
      };
    });
  };

  const addDecision = () => {
    if (formData.decisions.length < 5) {
      setFormData(prev => ({
        ...prev,
        decisions: [...prev.decisions, '']
      }));
    }
  };

  const removeDecision = (index: number) => {
    setFormData(prev => ({
      ...prev,
      decisions: prev.decisions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title || !formData.date) {
        throw new Error('Title and date are required');
      }

      const apiData: ApiData = {
        ...(meeting?.id && { id: meeting.id }),
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        agenda: formData.agenda,
        minutes: formData.minutes,
        decisions: formData.decisions,
        attendees: formData.attendees.map(a => ({
          memberId: a.memberId,
          role: a.role,
          present: a.present
        })),
        attachments: formData.attachments
      };

      console.log('Submitting form data:', apiData);
      await onSuccess(apiData);
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      setError(err.message || 'Failed to save meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            type="button"
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Attendees</label>
        <div className="mt-2 space-y-2">
          {loadingMembers ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-500">No members available</p>
          ) : (
            members.map((member) => {
            const isAttending = formData.attendees.some(a => a.id === member.id);
            return (
              <div key={member.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                    id={`member-${member.id}`}
                  checked={isAttending}
                  onChange={(e) => handleAttendeeChange(member.id, e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                  <label htmlFor={`member-${member.id}`} className="text-sm text-gray-700">
                    {member.name} {member.trusteeRole ? `(${member.trusteeRole})` : ''}
                  </label>
              </div>
            );
            })
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Agenda</label>
        <textarea
          name="agenda"
          value={formData.agenda}
          onChange={handleChange}
          rows={4}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Minutes</label>
        <textarea
          name="minutes"
          value={formData.minutes}
          onChange={handleChange}
          rows={6}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Decisions</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={formData.decisions[formData.decisions.length - 1]}
            onChange={(e) => {
              const newDecisions = [...formData.decisions];
              newDecisions[newDecisions.length - 1] = e.target.value;
              setFormData(prev => ({ ...prev, decisions: newDecisions }));
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Add a decision"
          />
          <button
            type="button"
            onClick={addDecision}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Add
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {formData.decisions.map((decision, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <span className="text-sm text-gray-700">{decision}</span>
              <button
                type="button"
                onClick={() => removeDecision(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : meeting ? 'Update Meeting' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
} 