'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ChatMessages from '@/components/ChatMessages';
import { ChatMessage } from '@/lib/db';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess(result.message);
      // Refresh messages after successful upload
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const result = await response.json();

      if (response.ok) {
        setMessages(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Chat Parser App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your chat files and let AI extract structured data automatically. 
            Perfect for analyzing conversations, extracting insights, and organizing chat logs.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <FileUpload 
            onFileUpload={handleFileUpload}
            loading={loading}
          />
          
          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <strong>Success:</strong> {success}
            </div>
          )}
        </div>

        {/* Chat Messages Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Processed Messages
            </h2>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <ChatMessages 
            messages={messages}
            onRefresh={fetchMessages}
          />
        </div>
      </div>
    </div>
  );
}
