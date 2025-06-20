'use client';

import React, { useEffect, useState } from 'react';
import { FaLink, FaEdit, FaTrash, FaSearch, FaExternalLinkAlt, FaPlus, FaFileAlt, FaImage, FaCalendarAlt, FaBuilding, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import type { Link } from '@/types';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';

const DEFAULT_CATEGORIES = ['Documents', 'Media', 'Events', 'Trust', 'Social'] as const;
type CategoryType = typeof DEFAULT_CATEGORIES[number] | string;

interface LinkFormData {
  title: string;
  url: string;
  category: string;
  description?: string;
  icon?: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    category: '',
    description: '',
    icon: ''
  });

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/links?${queryParams}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load links');
      }

      const data = await response.json();
      setLinks(data.links);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError(err.message || 'Failed to load links. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [selectedCategory, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        selectedLink ? `/api/links/${selectedLink.id}` : '/api/links',
        {
          method: selectedLink ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${selectedLink ? 'update' : 'create'} link`);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedLink(null);
      setFormData({
        title: '',
        url: '',
        category: '',
        description: '',
        icon: ''
      });
      fetchLinks();
    } catch (err: any) {
      setError(err.message || `Failed to ${selectedLink ? 'update' : 'create'} link. Please try again.`);
    }
  };

  const handleDelete = async () => {
    if (!selectedLink) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/links/${selectedLink.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete link');
      }

      setIsDeleteModalOpen(false);
      setSelectedLink(null);
      await fetchLinks();
    } catch (err: any) {
      console.error('Error deleting link:', err);
      setError(err.message || 'Failed to delete link. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (link: Link) => {
    setSelectedLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      description: link.description || '',
      icon: link.icon || ''
    });
    setIsEditModalOpen(true);
  };

  const categories = Array.from(new Set(links.map(link => link.category))).sort();

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
            <h1 className="text-3xl font-bold text-gray-800">Quick Links</h1>
          <p className="text-gray-600 mt-2">
              Access and manage important resources and links
          </p>
        </div>
        <PermissionGate permission="links.create">
          <button
            onClick={() => {
              setSelectedLink(null);
              setFormData({
                title: '',
                url: '',
                category: '',
                description: '',
                icon: ''
              });
              setIsAddModalOpen(true);
            }}
              className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
          >
              <FaPlus className="w-4 h-4" />
            Add Link
          </button>
        </PermissionGate>
      </div>

        {/* Search and Filters */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search links by title, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-sm ${
                selectedCategory === 'all'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
                <FaLink className="w-4 h-4" />
                All Links
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2.5 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-sm ${
                  selectedCategory === category
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                  {getCategoryIcon(category)}
                {category}
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      {links.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
            <FaLink className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No links found. Add your first link to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <div
              key={link.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-yellow-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 group-hover:text-yellow-700 transition-colors duration-200">
                      {link.icon ? (
                        <img
                          src={link.icon}
                          alt=""
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        getCategoryIcon(link.category)
                      )}
                      {link.title}
                    </h3>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-yellow-600 hover:text-yellow-800 flex items-center gap-1 mt-1 group-hover:underline"
                    >
                      {formatUrl(link.url)}
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100">
                    {link.category}
                  </span>
                </div>

                {link.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {link.description}
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  <PermissionGate permission="links.edit">
                    <button
                      onClick={() => handleEditClick(link)}
                      className="text-gray-400 hover:text-yellow-600 transition-colors duration-200 p-1.5 rounded-lg hover:bg-yellow-50"
                      title="Edit link"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="links.delete">
                    <button
                      onClick={() => {
                        setSelectedLink(link);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete link"
                    >
                      <FaTrash className="w-4 h-4" />
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
          setSelectedLink(null);
          setFormData({
            title: '',
            url: '',
            category: '',
            description: '',
            icon: ''
          });
        }}
        title={selectedLink ? 'Edit Link' : 'Add New Link'}
      >
        <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
                placeholder="Enter a descriptive title"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              required
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      formData.category === cat
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span className="text-sm font-medium">{cat}</span>
                  </button>
                ))}
              </div>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
                placeholder="Or enter a custom category"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              list="categories"
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
                placeholder="Add a brief description of this link"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL (Optional)</label>
            <input
              type="url"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="https://example.com/icon.png"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
              <p className="mt-1 text-xs text-gray-500">Enter a URL for the link's icon (16x16 or 32x32 recommended)</p>
          </div>

            <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedLink(null);
                setFormData({
                  title: '',
                  url: '',
                  category: '',
                  description: '',
                  icon: ''
                });
              }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2"
            >
                {selectedLink ? (
                  <>
                    <FaEdit className="w-4 h-4" />
                    Update Link
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    Add Link
                  </>
                )}
            </button>
          </div>
        </form>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedLink(null);
        }}
        title="Delete Link"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 text-red-600 bg-red-50 p-4 rounded-lg">
            <FaExclamationTriangle className="w-5 h-5" />
            <p className="text-sm">
              Are you sure you want to delete this link? This action cannot be undone.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900">{selectedLink?.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{selectedLink?.url}</p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedLink(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <FaTrash className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Link'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'documents':
      return <FaFileAlt className="text-blue-500" />;
    case 'media':
      return <FaImage className="text-purple-500" />;
    case 'events':
      return <FaCalendarAlt className="text-green-500" />;
    case 'trust':
      return <FaBuilding className="text-yellow-500" />;
    case 'social':
      return <FaUsers className="text-red-500" />;
    default:
      return <FaLink className="text-gray-400" />;
  }
}

function formatUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
  } catch {
    return url;
  }
} 