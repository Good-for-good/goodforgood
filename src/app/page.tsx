'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaChartLine,
  FaUserPlus,
  FaMoneyBillWave,
  FaFileInvoice,
  FaCalendarPlus,
  FaExclamationCircle,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaDollarSign,
  FaRegCalendarCheck,
  FaHourglassHalf,
  FaRunning,
  FaPercentage,
  FaHandHoldingUsd,
  FaRegClock,
  FaFileAlt,
  FaHandshake,
  FaLightbulb,
  FaChartBar
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces for our data types
interface Activity {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  organizer: string;
  maxParticipants: number | null;
  currentParticipants: number;
  budget: number | null;
  actualAmount: number | null;
  contributionNotes?: string;
  additionalNotes?: string;
  participants?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  trusteeRole?: string;
}

interface Donation {
  id: string;
  donor: string;
  amount: number;
  date: Date;
  purpose?: string;
  notes?: string;
  type: 'individual' | 'organization';
  memberId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  paymentMethod: string;
  paidTo: string;
  billNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalDonations: 0,
    totalExpenses: 0,
    totalContributions: 0,
    upcomingActivities: 0,
    ongoingActivities: 0,
    completedActivities: 0
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  const isRestrictedRole = user?.trusteeRole?.toLowerCase() === 'volunteer' || user?.trusteeRole?.toLowerCase() === 'general trustee';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data.stats);
      setRecentActivities(data.recentActivities);
      setRecentDonations(data.recentDonations);
      setRecentExpenses(data.recentExpenses);
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <FaExclamationCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Members</h3>
            <div className="p-3 bg-indigo-100 rounded-full">
              <FaUsers className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalMembers}</p>
          <p className="text-sm text-gray-500 mt-2 flex items-center">
            <FaArrowUp className="w-4 h-4 mr-1 text-green-500" />
            Active Members
          </p>
        </div>

        {/* Activities Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaCalendarAlt className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaRegClock className="w-3 h-3 mr-1 text-yellow-600" />
                Upcoming
              </span>
              <span className="text-sm font-medium text-yellow-600">{stats.upcomingActivities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaRunning className="w-3 h-3 mr-1 text-green-600" />
                Ongoing
              </span>
              <span className="text-sm font-medium text-green-600">{stats.ongoingActivities}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <FaHourglassHalf className="w-3 h-3 mr-1 text-blue-600" />
                  Total Active
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.upcomingActivities + stats.ongoingActivities}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Activities Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaRegCalendarCheck className="w-3 h-3 mr-1 text-green-600" />
                Activities
              </span>
              <span className="text-sm font-medium text-green-600">{stats.completedActivities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaHandHoldingUsd className="w-3 h-3 mr-1 text-green-600" />
                Contributions
              </span>
              <span className="text-sm font-medium text-green-600">₹{stats.totalContributions}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <FaPercentage className="w-3 h-3 mr-1 text-blue-600" />
                  Success Rate
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round((stats.completedActivities / (stats.completedActivities + stats.upcomingActivities + stats.ongoingActivities)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaArrowUp className="w-3 h-3 mr-1 text-green-600" />
                Donations
              </span>
              <span className="text-sm font-medium text-green-600">+₹{stats.totalDonations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center">
                <FaArrowDown className="w-3 h-3 mr-1 text-red-600" />
                Expenses
              </span>
              <span className="text-sm font-medium text-red-600">-₹{stats.totalExpenses}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <FaDollarSign className="w-3 h-3 mr-1 text-blue-600" />
                  Balance
                </span>
                <span className="text-sm font-medium text-blue-600">
                  ₹{stats.totalDonations - stats.totalExpenses}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md mb-8 hover:shadow-lg transition-shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/donors"
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all hover:scale-105"
            >
              <FaMoneyBillWave className="h-5 w-5 mr-2" />
              Add Donation
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all hover:scale-105"
            >
              <FaFileInvoice className="h-5 w-5 mr-2" />
              Add Expense
            </Link>

            <Link
              href="/activities"
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-all hover:scale-105"
            >
              <FaCalendarPlus className="h-5 w-5 mr-2" />
              Add Activity
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaCalendarAlt className="w-5 h-5 mr-2 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              </div>
              <Link 
                href="/activities"
                className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center">No recent activities</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className="space-y-8">
          {/* Recent Donations */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FaMoneyBillWave className="w-5 h-5 mr-2 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Donations</h3>
                </div>
                <Link 
                  href="/donors"
                  className="text-sm text-green-600 hover:text-green-700 flex items-center"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentDonations.length === 0 ? (
                <p className="text-gray-500 text-center">No recent donations</p>
              ) : (
                <div className="space-y-4">
                  {recentDonations.map(donation => (
                    <div key={donation.id} className="flex justify-between items-start">
                      <div>
                        {!isRestrictedRole && (
                        <h4 className="text-sm font-medium text-gray-900">
                          {donation.donor || 'Anonymous'}
                        </h4>
                        )}
                        <p className="text-sm text-gray-500">{formatDate(donation.date)}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatAmount(donation.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FaFileInvoice className="w-5 h-5 mr-2 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                </div>
                <Link 
                  href="/expenses"
                  className="text-sm text-red-600 hover:text-red-700 flex items-center"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500 text-center">No recent expenses</p>
              ) : (
                <div className="space-y-4">
                  {recentExpenses.map(expense => (
                    <div key={expense.id} className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{expense.description}</h4>
                        <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {formatAmount(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 