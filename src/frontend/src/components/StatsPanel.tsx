import React, { useState, useEffect } from 'react';
import { StatsResponse } from '../types';
import { emailAPI } from '../services/api';

interface StatsPanelProps {
  onClose: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getStats();
      if (response.success) {
        setStats(response);
      } else {
        setError('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2">Loading stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Email Statistics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Total Emails */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Emails</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.data.total_emails.value.toLocaleString()}
                </p>
              </div>

              {/* By Account */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails by Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.data.by_account.buckets.map((bucket, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{bucket.key}</span>
                        <span className="text-2xl font-bold text-gray-600">{bucket.doc_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Folder */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails by Folder</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.data.by_folder.buckets.map((bucket, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{bucket.key}</span>
                        <span className="text-2xl font-bold text-gray-600">{bucket.doc_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By AI Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails by AI Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.data.by_ai_category.buckets.map((bucket, index) => {
                    const getCategoryColor = (category: string) => {
                      switch (category) {
                        case 'Interested':
                          return 'bg-green-50 border-green-200 text-green-800';
                        case 'Meeting Booked':
                          return 'bg-blue-50 border-blue-200 text-blue-800';
                        case 'Not Interested':
                          return 'bg-red-50 border-red-200 text-red-800';
                        case 'Spam':
                          return 'bg-gray-50 border-gray-200 text-gray-800';
                        case 'Out of Office':
                          return 'bg-yellow-50 border-yellow-200 text-yellow-800';
                        default:
                          return 'bg-gray-50 border-gray-200 text-gray-800';
                      }
                    };

                    return (
                      <div key={index} className={`border rounded-lg p-4 ${getCategoryColor(bucket.key)}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{bucket.key}</span>
                          <span className="text-2xl font-bold">{bucket.doc_count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Histogram */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails Over Time</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {stats.data.date_histogram.buckets.slice(-7).map((bucket, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(bucket.key_as_string).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(bucket.doc_count / Math.max(...stats.data.date_histogram.buckets.map(b => b.doc_count))) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{bucket.doc_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;

