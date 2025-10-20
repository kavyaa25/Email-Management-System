import React from 'react';
import { HealthResponse } from '../types';

interface HeaderProps {
  onRefresh: () => void;
  onToggleStats: () => void;
  health: HealthResponse | null;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, onToggleStats, health }) => {
  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '●' : '●';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              📧 Email Management System
            </h1>
            
            {health && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(health.services.elasticsearch)}>
                    {getStatusIcon(health.services.elasticsearch)}
                  </span>
                  <span>Elasticsearch</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(health.services.emailSync)}>
                    {getStatusIcon(health.services.emailSync)}
                  </span>
                  <span>Email Sync</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={getStatusColor(health.services.ai)}>
                    {getStatusIcon(health.services.ai)}
                  </span>
                  <span>AI Service</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={onToggleStats}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

