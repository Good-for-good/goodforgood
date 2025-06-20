'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { TrashIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface BackupInfo {
  timestamp: string
  version: string
  recordCounts: Record<string, number>
}

interface BackupScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retentionDays: number
  timeOfDay: string
}

interface BackupFile {
  id: string
  name: string
  webViewLink: string
}

export default function BackupManager() {
  const router = useRouter()
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backupType, setBackupType] = useState<'local' | 'cloud'>('local')
  const [availableTypes, setAvailableTypes] = useState<('local' | 'cloud')[]>(['local'])
  const [schedule, setSchedule] = useState<BackupScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    retentionDays: 30,
    timeOfDay: '00:00'
  })
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    issues: string[];
  } | null>(null)

  // Check available backup types on mount
  useEffect(() => {
    const checkAvailableTypes = async () => {
      try {
        const response = await fetch('/api/backup?action=types')
        if (response.ok) {
          const data = await response.json()
          setAvailableTypes(data.types || ['local'])
        }
      } catch (error) {
        console.error('Failed to fetch available backup types:', error)
        setAvailableTypes(['local']) // Default to local only
      }
    }
    checkAvailableTypes()
  }, [])

  // Helper function to handle API errors
  const handleApiError = async (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error)
    let errorMessage = defaultMessage

    try {
      if (error?.response instanceof Response) {
        const data = await error.response.json()
        if (data.error === 'Unauthorized') {
          router.push('/unauthorized')
          return
        }
        errorMessage = data.error || defaultMessage
      }
    } catch (e) {
      console.error('Error parsing error response:', e)
    }

    setError(errorMessage)
    toast.error(errorMessage)
  }

  // Fetch list of backups
  const fetchBackups = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/backup?action=list&type=${backupType}`)
      if (!response.ok) {
        throw { response }
      }
      const data = await response.json()
      setBackups(data.backups || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch backups')
    }
  }

  // Fetch backup info
  const fetchBackupInfo = async (file: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/backup?action=info&file=${encodeURIComponent(file)}`)
      if (!response.ok) {
        throw { response }
      }
      const data = await response.json()
      setBackupInfo(data.info)
    } catch (error) {
      handleApiError(error, 'Failed to fetch backup info')
      setBackupInfo(null)
    }
  }

  // Fetch backup schedule
  const fetchSchedule = async () => {
    try {
      setError(null)
      const response = await fetch('/api/backup/schedule')
      if (!response.ok) {
        throw { response }
      }
      const data = await response.json()
      setSchedule(data.schedule || {
        enabled: false,
        frequency: 'daily',
        retentionDays: 30,
        timeOfDay: '00:00'
      })
    } catch (error) {
      handleApiError(error, 'Failed to fetch backup schedule')
    }
  }

  // Create new backup
  const createBackup = async (type: 'local' | 'cloud') => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch(`/api/backup?action=create&type=${type}`)
      if (!response.ok) {
        throw { response }
      }
      await fetchBackups()
      toast.success(`${type === 'local' ? 'Local' : 'Cloud'} backup created successfully`)
    } catch (error) {
      handleApiError(error, 'Failed to create backup')
    } finally {
      setIsLoading(false)
    }
  }

  // Restore from backup
  const restoreBackup = async () => {
    if (!selectedBackup) return

    const confirmMessage = 
      'Are you sure you want to restore from this backup?\n\n' +
      'This will:\n' +
      '1. Delete all current data\n' +
      '2. Replace it with data from the backup\n' +
      '3. Cannot be undone\n\n' +
      'Please make sure you have a recent backup before proceeding.'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          backupFile: selectedBackup
        })
      })

      if (!response.ok) {
        throw { response }
      }

      toast.success('Backup restored successfully')
      router.refresh()
    } catch (error) {
      handleApiError(error, 'Failed to restore backup')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete backup
  const deleteBackup = async (backupFile: string) => {
    const confirmMessage = 
      'Are you sure you want to delete this backup?\n\n' +
      'This action cannot be undone.'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch(`/api/backup?file=${encodeURIComponent(backupFile)}&type=${backupType}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw { response }
      }

      toast.success('Backup deleted successfully')
      if (selectedBackup === backupFile) {
        setSelectedBackup(null)
        setBackupInfo(null)
      }
      await fetchBackups()
    } catch (error) {
      handleApiError(error, 'Failed to delete backup')
    } finally {
      setIsLoading(false)
    }
  }

  // Update backup schedule
  const updateSchedule = async (newSchedule: BackupScheduleConfig) => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule })
      })
      if (!response.ok) {
        throw { response }
      }
      setSchedule(newSchedule)
      toast.success('Backup schedule updated successfully')
    } catch (error) {
      handleApiError(error, 'Failed to update backup schedule')
    } finally {
      setIsLoading(false)
    }
  }

  // Verify backup
  const verifyBackup = async (backupFile: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch(`/api/backup/verify?file=${encodeURIComponent(backupFile)}`)
      if (!response.ok) {
        throw { response }
      }
      const result = await response.json()
      setVerificationResult(result)
      
      if (result.isValid) {
        toast.success('Backup verification successful')
      } else {
        toast.error(`Backup verification failed: ${result.issues.length} issues found`)
      }
    } catch (error) {
      handleApiError(error, 'Failed to verify backup')
      setVerificationResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchBackups()
    fetchSchedule()
  }, [backupType])

  // Load backup info when selection changes
  useEffect(() => {
    if (selectedBackup) {
      fetchBackupInfo(selectedBackup)
    } else {
      setBackupInfo(null)
    }
  }, [selectedBackup])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Backup Management Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Backup Management</h2>
          
          {/* Backup Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
            <div className="flex gap-4">
              {availableTypes.includes('local') && (
                <button
                  onClick={() => setBackupType('local')}
                  className={`px-4 py-2 rounded-lg ${
                    backupType === 'local'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Local Backup
                </button>
              )}
              {availableTypes.includes('cloud') && (
                <button
                  onClick={() => setBackupType('cloud')}
                  className={`px-4 py-2 rounded-lg ${
                    backupType === 'cloud'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cloud Backup
                </button>
              )}
            </div>
          </div>
          
          {/* Create Backup Button */}
          <div className="mb-8">
            <button
              onClick={() => createBackup(backupType)}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : `Create New ${backupType === 'local' ? 'Local' : 'Cloud'} Backup`}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Backup List */}
          <div className="border rounded-lg overflow-hidden">
            <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">
              Available {backupType === 'local' ? 'Local' : 'Cloud'} Backups
            </h3>
            {backups.length === 0 ? (
              <p className="p-4 text-gray-500">No backups available</p>
            ) : (
              <ul className="divide-y">
                {backups.map((backup) => (
                  <li
                    key={backup.id}
                    className={`p-4 hover:bg-gray-50 ${
                      selectedBackup === backup.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-grow cursor-pointer"
                        onClick={() => setSelectedBackup(backup.id)}
                      >
                        {backup.name}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyBackup(backup.id)}
                          disabled={isLoading}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Verify backup"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          disabled={isLoading}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete backup"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Backup Schedule Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Backup Schedule</h2>
          <div className="border rounded-lg p-6">
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => updateSchedule({ ...schedule, enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Enable automated backups</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={schedule.frequency}
                  onChange={(e) => updateSchedule({ ...schedule, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  disabled={!schedule.enabled}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time of Day</label>
                <input
                  type="time"
                  value={schedule.timeOfDay}
                  onChange={(e) => updateSchedule({ ...schedule, timeOfDay: e.target.value })}
                  disabled={!schedule.enabled}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                <input
                  type="number"
                  value={schedule.retentionDays}
                  onChange={(e) => updateSchedule({ ...schedule, retentionDays: parseInt(e.target.value) })}
                  disabled={!schedule.enabled}
                  min={1}
                  max={365}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Selected Backup Details */}
          {selectedBackup && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Backup Details</h2>
              <div className="border rounded-lg p-6">
                {backupInfo ? (
                  <>
                    <p><strong>Created:</strong> {new Date(backupInfo.timestamp).toLocaleString()}</p>
                    <p><strong>Version:</strong> {backupInfo.version}</p>
                    
                    <h3 className="font-semibold mt-4 mb-2">Record Counts:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(backupInfo.recordCounts).map(([table, count]) => (
                        <div key={table}>
                          <span className="font-medium">{table}:</span> {count}
                        </div>
                      ))}
                    </div>

                    {verificationResult && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Verification Result:</h3>
                        <div className={`p-3 rounded ${verificationResult.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                          {verificationResult.isValid ? (
                            <div className="flex items-center text-green-700">
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Backup is valid
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center text-red-700 mb-2">
                                <XCircleIcon className="h-5 w-5 mr-2" />
                                Backup has issues
                              </div>
                              <ul className="list-disc list-inside text-red-600 text-sm">
                                {verificationResult.issues.map((issue, index) => (
                                  <li key={index}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 space-x-4">
                      <button
                        onClick={restoreBackup}
                        disabled={isLoading}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Restore from this Backup'}
                      </button>
                      <button
                        onClick={() => verifyBackup(selectedBackup)}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Verify Backup'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Loading backup details...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 