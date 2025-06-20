'use client';

import React, { useEffect, useState } from 'react';
import type { WorkshopResource } from '@/types';
import Modal from '@/components/shared/Modal';
import WorkshopResourceForm from '@/components/forms/WorkshopResourceForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';
import { FaPlus, FaSearch, FaChalkboardTeacher } from 'react-icons/fa';

export default function WorkshopsPage() {
  const [resources, setResources] = useState<WorkshopResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WorkshopResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'member' | 'external'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterType !== 'all') {
        queryParams.append('type', filterType);
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/workshops?${queryParams}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load workshop resources');
      }

      const data = await response.json();
      if (!data.resources) {
        throw new Error('Invalid response format');
      }

      setResources(data.resources);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching workshop resources:', err);
      setError(err.message || 'Failed to load workshop resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [filterType, searchTerm]);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchResources();
  };

  const handleEditClick = (resource: WorkshopResource) => {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedResource(null);
    fetchResources();
  };

  const handleDeleteClick = (resource: WorkshopResource) => {
    setSelectedResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/workshops/${selectedResource.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete workshop resource');
      }

      setIsDeleteModalOpen(false);
      setSelectedResource(null);
      await fetchResources();
    } catch (err: any) {
      console.error('Error deleting workshop resource:', err);
      setError(err.message || 'Failed to delete workshop resource. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

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
            <h1 className="text-3xl font-bold text-gray-800">Workshop Resources</h1>
            <p className="text-gray-600 mt-2">
              View and manage workshop resources
          </p>
        </div>
        <PermissionGate permission="workshops.create">
          <button
            onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2"
          >
              <FaPlus className="w-4 h-4" />
            Add Resource
          </button>
        </PermissionGate>
      </div>

        {/* Search and Filters */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, specialization, or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
                className={`px-4 py-2.5 rounded-lg ${
              filterType === 'all' 
                ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('member')}
                className={`px-4 py-2.5 rounded-lg ${
              filterType === 'member' 
                ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setFilterType('external')}
                className={`px-4 py-2.5 rounded-lg ${
              filterType === 'external' 
                ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            External
          </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
            <FaChalkboardTeacher className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No workshop resources found. Add your first resource to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                    <p className="text-sm text-gray-600">{resource.specialization}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    resource.type === 'member' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Expertise</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {resource.expertise.map((exp, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Reference</h4>
                  <p className="text-sm text-gray-600">
                    {resource.reference.name}
                    {resource.reference.relationship && ` (${resource.reference.relationship})`}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                  <p className="text-sm text-gray-600">{resource.contactDetails.email}</p>
                  <p className="text-sm text-gray-600">{resource.contactDetails.phone}</p>
                  {resource.contactDetails.address && (
                    <p className="text-sm text-gray-600">{resource.contactDetails.address}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  <PermissionGate permission="workshops.edit">
                    <button
                      onClick={() => handleEditClick(resource)}
                      className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
                    >
                      Edit Details
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="workshops.delete">
                    <button
                      onClick={() => handleDeleteClick(resource)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </PermissionGate>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedResource(null);
        }}
        title={selectedResource ? 'Edit Workshop Resource' : 'Add New Resource'}
      >
        <div className="p-6">
        <WorkshopResourceForm
            resource={selectedResource || undefined}
            onSuccess={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedResource(null);
              fetchResources();
            }}
          onCancel={() => {
              setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedResource(null);
          }}
        />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedResource(null);
        }}
        title="Delete Resource"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this workshop resource?
            <br />
            <span className="font-medium text-gray-900">
              {selectedResource?.name}
            </span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedResource(null);
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
    </div>
  );
} 