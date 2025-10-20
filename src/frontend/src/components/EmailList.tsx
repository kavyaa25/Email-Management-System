import React from 'react';
import { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onEmailSelect: (email: Email) => void;
  onEmailDelete: (emailId: string) => void;
  loading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({ 
  emails, 
  selectedEmail, 
  onEmailSelect, 
  onEmailDelete, 
  loading 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Interested':
        return 'bg-green-100 text-green-800';
      case 'Meeting Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Not Interested':
        return 'bg-red-100 text-red-800';
      case 'Spam':
        return 'bg-gray-100 text-gray-800';
      case 'Out of Office':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No emails found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedEmail?.id === email.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
          }`}
          onClick={() => onEmailSelect(email)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {email.from}
                </p>
                {email.aiCategory && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(email.aiCategory)}`}>
                    {email.aiCategory}
                    {email.aiConfidence && (
                      <span className="ml-1">({email.aiConfidence}%)</span>
                    )}
                  </span>
                )}
              </div>
              
              <p className="text-sm font-medium text-gray-900 mb-1">
                {email.subject || '(No Subject)'}
              </p>
              
              <p className="text-sm text-gray-500 mb-2">
                {truncateText(email.body)}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatDate(email.date)}</span>
                <span>•</span>
                <span>{email.folder}</span>
                <span>•</span>
                <span>{email.accountId}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
            {Array.isArray((email as any).flags) && (email as any).flags.includes('\\Seen') && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEmailDelete(email.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmailList;

