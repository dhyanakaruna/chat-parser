'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/db';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onRefresh: () => void;
}

export default function ChatMessages({ messages, onRefresh }: ChatMessagesProps) {
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>(messages);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sender'>('newest');

  // Get unique senders for filter dropdown
  const uniqueSenders = Array.from(new Set(messages.map(msg => msg.sender))).filter(sender => sender !== 'Unknown');

  // Filter and sort messages
  useEffect(() => {
    let filtered = messages;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by sender
    if (selectedSender) {
      filtered = filtered.filter(msg => msg.sender === selectedSender);
    }

    // Sort messages
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'sender':
          return a.sender.localeCompare(b.sender);
        default:
          return 0;
      }
    });

    setFilteredMessages(filtered);
  }, [messages, searchTerm, selectedSender, sortBy]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No messages yet
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Upload a chat file to get started with parsing and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Messages
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in messages or senders..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Sender Filter */}
          <div>
            <label htmlFor="sender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Sender
            </label>
            <select
              id="sender"
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Senders</option>
              {uniqueSenders.map(sender => (
                <option key={sender} value={sender}>{sender}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'sender')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="sender">By Sender</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredMessages.length} of {messages.length} messages
          </p>
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <div
            key={message._id || Math.random().toString()}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                    {message.sender.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {message.sender}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message.timestamp}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(message.created_at)}
              </span>
            </div>
            
            <div className="pl-13">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredMessages.length === 0 && messages.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            No messages match your current filters.
          </p>
        </div>
      )}
    </div>
  );
}
