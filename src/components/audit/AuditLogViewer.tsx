'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { FaFilter, FaSync, FaSearch, FaChevronDown, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import React from 'react';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  createdAt: string;
  member: {
    name: string;
    email: string;
  };
  groupId?: string;
  summary?: string;
}

interface GroupedAuditLog {
  mainLog: AuditLogEntry;
  relatedLogs: AuditLogEntry[];
}

interface AuditLogViewerProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
}

interface DetailsPagination {
  [key: string]: {
    currentPage: number;
    itemsPerPage: number;
  };
}

interface FilterBarProps {
  filters: {
    action: string;
    entityType: string;
    search: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    action: string;
    entityType: string;
    search: string;
  }>>;
  entityTypes: string[];
  isRefreshing: boolean;
  handleRefresh: () => void;
  entityType?: string;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <FaSpinner className="w-8 h-8 animate-spin text-yellow-500" />
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12 bg-gray-50 rounded-lg">
    <div className="text-gray-500 mb-2">No audit logs found</div>
    <div className="text-sm text-gray-400">Try adjusting your filters or refreshing the page</div>
  </div>
);

const FilterBar = ({ filters, setFilters, entityTypes, isRefreshing, handleRefresh, entityType }: FilterBarProps) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border mb-4 space-y-4">
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in changes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <select
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          value={filters.action}
          onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        {!entityType && (
          <select
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            value={filters.entityType}
            onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
          >
            <option value="">All Types</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleRefresh}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
          disabled={isRefreshing}
        >
          <FaSync className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </button>
      </div>
    </div>
  </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange }: PaginationControlsProps) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "px-3 py-1 rounded border",
            currentPage <= 1 ? "bg-gray-100 text-gray-400" : "hover:bg-gray-50"
          )}
        >
          Previous
        </button>
        <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 px-2 py-1 border rounded text-center"
            aria-label="Page number"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded border bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Go
          </button>
        </form>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "px-3 py-1 rounded border",
            currentPage >= totalPages ? "bg-gray-100 text-gray-400" : "hover:bg-gray-50"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const formatMainChange = (log: AuditLogEntry) => {
  if (!log.changes) return 'No changes recorded';

  const changes = log.changes;
  
  // For CREATE action
  if (log.action === 'CREATE') {
    switch (log.entityType.toLowerCase()) {
      case 'donation':
        const donationAmount = changes.new?.amount;
        const donor = changes.new?.donor;
        const purpose = changes.new?.purpose;
        const type = changes.new?.type;
        const notes = changes.new?.notes;
        
        let donationText = `Created: ${purpose} donation of ₹${donationAmount}`;
        if (type === 'member') {
          donationText += ` from member ${donor}`;
        } else {
          donationText += ` from ${donor}`;
        }
        if (notes) {
          donationText += ` (${notes})`;
        }
        return donationText;

      case 'expense':
        const amount = changes.new?.amount;
        const description = changes.new?.description;
        const category = changes.new?.category;
        return `Created: ${category} expense of ₹${amount} for ${description}`;
        
      case 'activity':
        const title = changes.new?.title;
        const date = changes.new?.date ? new Date(changes.new.date).toLocaleDateString() : '';
        const location = changes.new?.location;
        return `Created: ${title} activity on ${date} at ${location}`;
        
      case 'member':
        const name = changes.new?.name;
        const role = changes.new?.trusteeRole;
        return role ? `Created: Member ${name} as ${role}` : `Created: Member ${name}`;
        
      case 'workshop':
        const workshopName = changes.new?.name;
        const specialization = changes.new?.specialization;
        return `Created: Workshop resource ${workshopName} (${specialization})`;
        
      case 'meeting':
        const meetingTitle = changes.new?.title;
        const meetingDate = changes.new?.date ? new Date(changes.new.date).toLocaleDateString() : '';
        return `Created: Meeting "${meetingTitle}" on ${meetingDate}`;
        
      case 'link':
        const linkTitle = changes.new?.title;
        const url = changes.new?.url;
        return `Created: Link "${linkTitle}"`;
        
      default:
        return `Created ${log.entityType}`;
    }
  }
  
  // For UPDATE action
  if (log.action === 'UPDATE') {
    const oldValues = changes.old || {};
    const newValues = changes.new || {};

    // Helper function to check if a value actually changed
    const hasValueChanged = (key: string, oldVal: any, newVal: any) => {
      // Skip if we don't have both old and new values
      if (!changes.old || !changes.new) return false;
      
      // For amount fields, treat undefined/null as 0
      if (key === 'amount') {
        const oldAmount = typeof oldVal === 'number' ? oldVal : 0;
        const newAmount = typeof newVal === 'number' ? newVal : 0;
        return oldAmount !== newAmount;
      }

      // For other fields, only compare if both values exist
      return oldVal !== newVal;
    };

    switch (log.entityType.toLowerCase()) {
      case 'donation': {
        const updates = [];
        
        if (hasValueChanged('amount', oldValues.amount, newValues.amount)) {
          const oldAmount = typeof oldValues.amount === 'number' ? oldValues.amount : 0;
          const newAmount = typeof newValues.amount === 'number' ? newValues.amount : 0;
          if (oldAmount === 0 && newAmount > 0) {
            updates.push(`Set amount to ₹${newAmount}`);
          } else {
            updates.push(`Changed amount ₹${oldAmount} → ₹${newAmount}`);
          }
        }
        if (hasValueChanged('purpose', oldValues.purpose, newValues.purpose)) {
          if (oldValues.purpose) {
            updates.push(`Changed purpose from "${oldValues.purpose}" to "${newValues.purpose}"`);
          } else {
            updates.push(`Set purpose to "${newValues.purpose}"`);
          }
        }
        if (hasValueChanged('donor', oldValues.donor, newValues.donor)) {
          if (oldValues.donor) {
            updates.push(`Changed donor from "${oldValues.donor}" to "${newValues.donor}"`);
          } else {
            updates.push(`Set donor to "${newValues.donor}"`);
          }
        }
        if (hasValueChanged('type', oldValues.type, newValues.type)) {
          if (oldValues.type) {
            updates.push(`Changed type from ${oldValues.type} to ${newValues.type}`);
          } else {
            updates.push(`Set type to ${newValues.type}`);
          }
        }
        
        return updates.join(' • ');
      }

      case 'expense': {
        const updates = [];
        
        if (hasValueChanged('amount', oldValues.amount, newValues.amount)) {
          const oldAmount = typeof oldValues.amount === 'number' ? oldValues.amount : 0;
          const newAmount = typeof newValues.amount === 'number' ? newValues.amount : 0;
          if (oldAmount === 0 && newAmount > 0) {
            updates.push(`Set amount to ₹${newAmount}`);
          } else {
            updates.push(`Changed amount ₹${oldAmount} → ₹${newAmount}`);
          }
        }
        if (hasValueChanged('description', oldValues.description, newValues.description)) {
          if (oldValues.description) {
            updates.push(`Changed description from "${oldValues.description}" to "${newValues.description}"`);
          } else {
            updates.push(`Set description to "${newValues.description}"`);
          }
        }
        if (hasValueChanged('category', oldValues.category, newValues.category)) {
          if (oldValues.category) {
            updates.push(`Changed category from ${oldValues.category} to ${newValues.category}`);
          } else {
            updates.push(`Set category to ${newValues.category}`);
          }
        }
        if (hasValueChanged('paymentMethod', oldValues.paymentMethod, newValues.paymentMethod)) {
          if (oldValues.paymentMethod) {
            updates.push(`Changed payment method from ${oldValues.paymentMethod} to ${newValues.paymentMethod}`);
          } else {
            updates.push(`Set payment method to ${newValues.paymentMethod}`);
          }
        }
        if (hasValueChanged('paidTo', oldValues.paidTo, newValues.paidTo)) {
          if (oldValues.paidTo) {
            updates.push(`Changed recipient from "${oldValues.paidTo}" to "${newValues.paidTo}"`);
          } else {
            updates.push(`Set recipient to "${newValues.paidTo}"`);
          }
        }
        
        return updates.join(' • ');
      }

      case 'member': {
        const updates = [];
        
        if (hasValueChanged('name', oldValues.name, newValues.name)) {
          updates.push(`Changed name to "${newValues.name}"`);
        }
        if (hasValueChanged('trusteeRole', oldValues.trusteeRole, newValues.trusteeRole)) {
          updates.push(`Changed role to ${newValues.trusteeRole || 'No role'}`);
        }
        if (hasValueChanged('accountStatus', oldValues.accountStatus, newValues.accountStatus)) {
          updates.push(`Changed status to ${newValues.accountStatus}`);
        }
        if (hasValueChanged('phone', oldValues.phone, newValues.phone)) {
          updates.push(`Updated phone number`);
        }
        if (hasValueChanged('email', oldValues.email, newValues.email)) {
          updates.push(`Updated email address`);
        }
        
        return updates.join(' • ');
      }

      case 'activity': {
        const updates = [];
        
        if (hasValueChanged('title', oldValues.title, newValues.title)) {
          updates.push(`Changed title to "${newValues.title}"`);
        }
        if (hasValueChanged('status', oldValues.status, newValues.status)) {
          updates.push(`Changed status to ${newValues.status}`);
        }
        if (hasValueChanged('date', oldValues.date, newValues.date)) {
          const newDate = new Date(newValues.date).toLocaleDateString();
          updates.push(`Rescheduled to ${newDate}`);
        }
        if (hasValueChanged('location', oldValues.location, newValues.location)) {
          updates.push(`Moved to "${newValues.location}"`);
        }
        if (hasValueChanged('budget', oldValues.budget, newValues.budget)) {
          const oldBudget = oldValues.budget ?? 0;
          const newBudget = newValues.budget ?? 0;
          updates.push(`Changed budget ₹${oldBudget} → ₹${newBudget}`);
        }
        if (hasValueChanged('maxParticipants', oldValues.maxParticipants, newValues.maxParticipants)) {
          updates.push(`Changed max participants to ${newValues.maxParticipants}`);
        }
        
        return updates.join(' • ');
      }

      case 'meeting': {
        const updates = [];
        
        if (hasValueChanged('title', oldValues.title, newValues.title)) {
          updates.push(`Changed title to "${newValues.title}"`);
        }
        if (hasValueChanged('date', oldValues.date, newValues.date)) {
          const newDate = new Date(newValues.date).toLocaleDateString();
          updates.push(`Rescheduled to ${newDate}`);
        }
        if (hasValueChanged('startTime', oldValues.startTime, newValues.startTime) || 
            hasValueChanged('endTime', oldValues.endTime, newValues.endTime)) {
          updates.push(`Changed time to ${newValues.startTime}-${newValues.endTime}`);
        }
        if (hasValueChanged('location', oldValues.location, newValues.location)) {
          updates.push(`Moved to "${newValues.location}"`);
        }
        if (hasValueChanged('status', oldValues.status, newValues.status)) {
          updates.push(`Changed status to ${newValues.status}`);
        }
        
        return updates.join(' • ');
      }

      case 'workshop': {
        const updates = [];
        
        if (hasValueChanged('name', oldValues.name, newValues.name)) {
          updates.push(`Changed name to "${newValues.name}"`);
        }
        if (hasValueChanged('specialization', oldValues.specialization, newValues.specialization)) {
          updates.push(`Changed specialization to ${newValues.specialization}`);
        }
        if (hasValueChanged('status', oldValues.status, newValues.status)) {
          updates.push(`Changed status to ${newValues.status}`);
        }
        if (hasValueChanged('availability', oldValues.availability, newValues.availability)) {
          updates.push(`Changed availability to ${newValues.availability}`);
        }
        
        return updates.join(' • ');
      }

      case 'link': {
        const updates = [];
        
        if (hasValueChanged('title', oldValues.title, newValues.title)) {
          updates.push(`Changed title to "${newValues.title}"`);
        }
        if (hasValueChanged('url', oldValues.url, newValues.url)) {
          updates.push(`Updated URL`);
        }
        if (hasValueChanged('category', oldValues.category, newValues.category)) {
          updates.push(`Moved to ${newValues.category} category`);
        }
        
        return updates.join(' • ');
      }

      default: {
        // Fall back to generic field-by-field comparison for unknown entity types
        const changedFields = Object.entries(newValues)
          .filter(([key, newValue]) => hasValueChanged(key, oldValues[key], newValue))
          .map(([key, newValue]) => {
            const oldValue = oldValues[key];
            
            // Handle special cases
            if (typeof newValue === 'boolean') {
              return `${key} changed to ${newValue ? 'Yes' : 'No'}`;
            }
            if (newValue === null) {
              return `${key} cleared`;
            }
            if (oldValue === null) {
              return `${key} set to ${JSON.stringify(newValue)}`;
            }
            
            if (oldValue) {
              return `${key} changed from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`;
            } else {
              return `${key} set to ${JSON.stringify(newValue)}`;
            }
          });

        return changedFields.join(' • ');
      }
    }
  }
  
  // For DELETE action
  if (log.action === 'DELETE') {
    switch (log.entityType.toLowerCase()) {
      case 'expense':
        const amount = changes.old?.amount;
        const description = changes.old?.description;
        return amount ? `Deleted expense: ${description} (₹${amount})` : `Deleted expense`;
        
      case 'activity':
        const title = changes.old?.title;
        return title ? `Deleted activity: ${title}` : `Deleted activity`;
        
      case 'member':
        const name = changes.old?.name;
        return name ? `Deleted member: ${name}` : `Deleted member`;
        
      case 'workshop':
        const workshopName = changes.old?.name;
        return workshopName ? `Deleted workshop resource: ${workshopName}` : `Deleted workshop resource`;
        
      case 'meeting':
        const meetingTitle = changes.old?.title;
        return meetingTitle ? `Deleted meeting: ${meetingTitle}` : `Deleted meeting`;
        
      case 'link':
        const linkTitle = changes.old?.title;
        return linkTitle ? `Deleted link: ${linkTitle}` : `Deleted link`;
        
      default:
        return `Deleted ${log.entityType}`;
    }
  }

  return 'Unknown change';
};

export function AuditLogViewer({ entityType, entityId, limit = 100 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    entityType: entityType || '',
    search: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const itemsPerPage = 500;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      params.set('page', currentPage.toString());
      params.set('pageSize', itemsPerPage.toString());
      
      if (filters.action) params.set('action', filters.action);
      if (filters.entityType && !entityType) params.set('entityType', filters.entityType);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalLogs(data.total);
      setEntityTypes(data.entityTypes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, entityId, currentPage, filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFilters({
      action: '',
      entityType: entityType || '',
      search: ''
    });
    await fetchLogs();
  };

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: AuditLogEntry[] } = {};
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedLogs.forEach(log => {
      const logTime = new Date(log.createdAt).getTime();
      
      const groupKey = Object.keys(groups).find(key => {
        const groupLogs = groups[key];
        const groupTime = new Date(groupLogs[0].createdAt).getTime();
        return Math.abs(groupTime - logTime) <= 1000 && 
               groupLogs[0].entityId === log.entityId;
      });

      if (groupKey) {
        groups[groupKey].push(log);
      } else {
        const newKey = `${log.entityId}-${logTime}`;
        groups[newKey] = [log];
      }
    });

    return Object.values(groups);
  }, [logs]);

  const formatDetailedHistory = (logs: AuditLogEntry[]) => {
    return (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="font-medium text-gray-800">Operation Timeline</div>
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div key={log.id} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-yellow-200" />
              
              {/* Timeline dot */}
              <div className="absolute left-2 top-3 w-2 h-2 rounded-full bg-yellow-500" />
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-gray-500 mb-2">
                  Step {index + 1} • {formatDistanceToNow(new Date(log.createdAt))} ago
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    log.action === 'CREATE' && "bg-green-100 text-green-800",
                    log.action === 'UPDATE' && "bg-yellow-100 text-yellow-800",
                    log.action === 'DELETE' && "bg-red-100 text-red-800"
                  )}>
                    {log.action}
                  </span>
                  <span className="text-gray-600">{log.entityType}</span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(log.changes?.new || log.changes?.old || log.changes || {})
                    .filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded">
                        <span className="font-medium text-gray-600">{key}: </span>
                        <span className="text-gray-900 font-mono text-sm whitespace-pre-wrap break-words">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  if (loading && !isRefreshing) return <LoadingSpinner />;
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      Error: {error}
        </div>
      );

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        entityTypes={entityTypes}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        entityType={entityType}
      />

      {groupedLogs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-48">Time</TableHead>
                <TableHead className="w-64">User</TableHead>
                <TableHead className="w-32">Action</TableHead>
                <TableHead className="w-48">Type</TableHead>
                <TableHead className="min-w-[300px] max-w-xl">Changes</TableHead>
                <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {groupedLogs.map(group => {
                const mainLog = group[0];
                const isExpanded = expandedGroups.has(mainLog.id);

                return (
                  <React.Fragment key={mainLog.id}>
                    <TableRow className="hover:bg-gray-50 transition-colors">
                <TableCell className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(mainLog.createdAt))} ago
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                          <span className="font-medium">{mainLog.member?.name || 'Unknown User'}</span>
                          <span className="text-sm text-gray-500">{mainLog.member?.email || 'No email'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                          mainLog.action === 'CREATE' && "bg-green-100 text-green-800",
                          mainLog.action === 'UPDATE' && "bg-yellow-100 text-yellow-800",
                          mainLog.action === 'DELETE' && "bg-red-100 text-red-800"
                        )}>
                          {mainLog.action}
                  </span>
                </TableCell>
                      <TableCell>{mainLog.entityType}</TableCell>
                <TableCell className="max-w-xl">
                        <div className="whitespace-pre-wrap break-words text-sm text-gray-700">
                          {formatMainChange(mainLog)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleGroup(mainLog.id)}
                          className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700"
                        >
                          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                          {isExpanded ? 'Hide' : 'View'} details
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-4 bg-gray-50">
                          {formatDetailedHistory(group)}
                </TableCell>
              </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
      </div>
      )}

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
} 
 
 