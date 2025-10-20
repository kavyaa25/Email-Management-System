import React, { useState } from 'react';
import { Email } from '../types';
import { aiAPI } from '../services/api';

interface EmailDetailProps {
  email: Email;
  onClose: () => void;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onClose }) => {
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

  const handleGenerateReplies = async () => {
    setLoadingReplies(true);
    try {
      const response = await aiAPI.suggestReplies(email.id, []);
      if (response.success) {
        setSuggestedReplies(response.data.suggestedReplies);
        setShowReplies(true);
      }
    } catch (error) {
      console.error('Failed to generate replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-1/2 bg-white border-l border-gray-200 h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Email Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {email.subject || '(No Subject)'}
            </h1>
            {email.aiCategory && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(email.aiCategory)}`}>
                {email.aiCategory}
                {email.aiConfidence && (
                  <span className="ml-1">({email.aiConfidence}%)</span>
                )}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>From: {email.from}</span>
            <span>•</span>
            <span>{formatDate(email.date)}</span>
            <span>•</span>
            <span>{email.folder}</span>
            <span>•</span>
            <span>{email.accountId}</span>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Recipients</h3>
          <div className="text-sm text-gray-600">
            <div><strong>To:</strong> {Array.isArray((email as any).to) ? (email as any).to.join(', ') : ''}</div>
            {Array.isArray((email as any).cc) && (email as any).cc.length > 0 && (
              <div><strong>CC:</strong> {(email as any).cc.join(', ')}</div>
            )}
            {Array.isArray((email as any).bcc) && (email as any).bcc.length > 0 && (
              <div><strong>BCC:</strong> {(email as any).bcc.join(', ')}</div>
            )}
          </div>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Message</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            {email.htmlBody ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.htmlBody }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {email.body}
              </pre>
            )}
          </div>
        </div>

        {/* AI Suggested Replies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">AI Suggested Replies</h3>
            <button
              onClick={handleGenerateReplies}
              disabled={loadingReplies}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loadingReplies ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              Generate Replies
            </button>
          </div>

          {showReplies && suggestedReplies.length > 0 && (
            <div className="space-y-3">
              {suggestedReplies.map((reply, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-900">Reply Option {index + 1}</h4>
                    <button
                      onClick={() => copyToClipboard(reply)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{reply}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Metadata</h3>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
            <div><strong>ID:</strong> {email.id}</div>
            <div><strong>Flags:</strong> {Array.isArray((email as any).flags) ? (email as any).flags.join(', ') : ''}</div>
            <div><strong>Timestamp:</strong> {(email as any).timestamp || email.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;

