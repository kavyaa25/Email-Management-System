import React, { useState } from 'react';
import { SearchFilters } from '../types';

interface SidebarProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
  totalEmails: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearch, filters, totalEmails }) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };

  const handleSearch = () => {
    onSearch(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const aiCategories = [
    'Interested',
    'Meeting Booked', 
    'Not Interested',
    'Spam',
    'Out of Office'
  ];

  const folders = [
    'INBOX',
    'Sent',
    'Drafts',
    'Trash'
  ];

  const accounts = [
    'account1',
    'account2'
  ];

  return (
    <aside className="w-80 bg-white shadow-sm border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        
        <div className="space-y-4">
          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              value={localFilters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>

          {/* Folder Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder
            </label>
            <select
              value={localFilters.folder || ''}
              onChange={(e) => handleFilterChange('folder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Folders</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          {/* AI Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Category
            </label>
            <select
              value={localFilters.aiCategory || ''}
              onChange={(e) => handleFilterChange('aiCategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {aiCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <input
              type="text"
              value={localFilters.from || ''}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              placeholder="sender@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={localFilters.subject || ''}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              placeholder="Search in subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={localFilters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={localFilters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Results Count */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              Total Emails: <span className="font-semibold">{totalEmails}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

