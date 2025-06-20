'use client';

import React, { useEffect, useState } from 'react';
import type { Member, TrusteeRole } from '@/types';
import { TRUSTEE_ROLES, getRoleDescription } from '@/constants/roles';

interface MemberFormProps {
  member?: Member | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  photo?: string;
  trusteeRole: TrusteeRole | '';
  roleStartDate: string;
  roleEndDate: string;
}

export default function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().substring(0, 10),
    photo: '',
    trusteeRole: '',
    roleStartDate: '',
    roleEndDate: ''
  });

  useEffect(() => {
    if (member) {
      console.log('Setting form data from member:', member);
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        joinDate: member.joinDate ? new Date(member.joinDate).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        photo: member.photo || '',
        trusteeRole: member.trusteeRole || '',
        roleStartDate: member.roleStartDate ? new Date(member.roleStartDate).toISOString().substring(0, 10) : '',
        roleEndDate: member.roleEndDate ? new Date(member.roleEndDate).toISOString().substring(0, 10) : ''
      });
      if (member.photo) {
        setPhotoPreview(member.photo);
      }
    }
  }, [member]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'trusteeRole' ? (value as TrusteeRole | '') : value,
      // Reset role dates when role is removed
      ...(name === 'trusteeRole' && !value ? {
        roleStartDate: '',
        roleEndDate: ''
      } : {})
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update form data with the photo URL
      setFormData(prev => ({
        ...prev,
        photo: data.url
      }));

      // Show preview
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message || 'Failed to upload photo');
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = member 
        ? `/api/members/${member.id}`
        : '/api/members';
        
      console.log('Submitting form data:', formData);
      
      // Prepare the data
      const submitData = {
        ...formData,
        trusteeRole: formData.trusteeRole || null,
        roleStartDate: formData.roleStartDate || null,
        roleEndDate: formData.roleEndDate || null,
        photo: formData.photo || null
      };

      const response = await fetch(url, {
        method: member ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save member');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving member:', {
        error: err,
        message: err.message,
        formData
      });
      setError(err.message || 'Failed to save member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
          placeholder="Enter member's full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photo
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="flex-shrink-0">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Member photo"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label
              htmlFor="photo"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Optional. JPG, PNG or GIF (max. 5MB)
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
          placeholder="Enter email address"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
          placeholder="Enter phone number"
        />
      </div>

      <div>
        <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 mb-1">
          Join Date *
        </label>
        <input
          type="date"
          id="joinDate"
          name="joinDate"
          value={formData.joinDate}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
        />
      </div>

      <div>
        <label htmlFor="trusteeRole" className="block text-sm font-medium text-gray-700 mb-1">
          Trustee Role
        </label>
        <select
          id="trusteeRole"
          name="trusteeRole"
          value={formData.trusteeRole}
          onChange={handleChange}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
        >
          <option value="">None</option>
          {TRUSTEE_ROLES.map(({ role, description }) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {formData.trusteeRole && (
          <p className="mt-1 text-sm text-gray-500">
            {getRoleDescription(formData.trusteeRole)}
          </p>
        )}
      </div>

      {formData.trusteeRole && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="roleStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              Role Start Date *
            </label>
            <input
              type="date"
              id="roleStartDate"
              name="roleStartDate"
              value={formData.roleStartDate}
              onChange={handleChange}
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="roleEndDate" className="block text-sm font-medium text-gray-700 mb-1">
              Role End Date
            </label>
            <input
              type="date"
              id="roleEndDate"
              name="roleEndDate"
              value={formData.roleEndDate}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty if the role is ongoing
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
            loading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  );
} 