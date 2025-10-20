import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Email, SearchFilters, HealthResponse } from './types';
import { emailAPI, healthAPI } from './services/api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import SearchBar from './components/SearchBar';
import StatsPanel from './components/StatsPanel';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEmails, setTotalEmails] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [, setSocket] = useState<Socket | null>(null);
  const [showStats, setShowStats] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const healthData = await healthAPI.getHealth();
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to check health:', error);
    }
  }, []);

  const loadEmails = useCallback(async (newFilters?: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = newFilters || filters;
      const response = await emailAPI.searchEmails(searchFilters);
      
      if (response.success) {
        setEmails(response.data.emails);
        setTotalEmails(response.data.total);
      } else {
        setError('Failed to load emails');
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Listen for new emails
    newSocket.on('new_email', (data: { email: Email; aiCategory?: any }) => {
      console.log('New email received:', data);
      setEmails(prev => [data.email, ...prev]);
    });

    // Check health status
    checkHealth();

    // Load initial emails
    loadEmails();

    return () => {
      newSocket.close();
    };
  }, [loadEmails, checkHealth]);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    loadEmails(newFilters);
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleEmailDelete = async (emailId: string) => {
    try {
      await emailAPI.deleteEmail(emailId);
      setEmails(prev => prev.filter(email => email.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      setError('Failed to delete email');
    }
  };

  const handleRefresh = () => {
    loadEmails();
    checkHealth();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onRefresh={handleRefresh}
        onToggleStats={() => setShowStats(!showStats)}
        health={health}
      />
      
      <div className="flex">
        <Sidebar 
          onSearch={handleSearch}
          filters={filters}
          totalEmails={totalEmails}
        />
        
        <main className="flex-1 flex">
          <div className="flex-1">
            <SearchBar 
              onSearch={handleSearch}
              loading={loading}
            />
            
            {loading && <LoadingSpinner />}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                {error}
              </div>
            )}
            
            <EmailList 
              emails={emails}
              selectedEmail={selectedEmail}
              onEmailSelect={handleEmailSelect}
              onEmailDelete={handleEmailDelete}
              loading={loading}
            />
          </div>
          
          {selectedEmail && (
            <EmailDetail 
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
            />
          )}
        </main>
      </div>
      
      {showStats && (
        <StatsPanel 
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

export default App;
