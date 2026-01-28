import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, AlertCircle, Reply, Trash2, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

interface Message {
  id: number;
  sender: { id: number; name: string; email: string };
  subject: string;
  message: string;
  message_type: string;
  is_read: boolean;
  is_replied: boolean;
  reply_message?: string;
  created_at: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, replied
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    replied: 0,
    contact: 0,
    support: 0,
    report: 0,
    feedback: 0
  });

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_BASE}/messages/inbox/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page_size: 100 }
      });

      const allMessages = res.data.results || res.data || [];
      setMessages(Array.isArray(allMessages) ? allMessages : []);

      // Calculate stats
      const unreadCount = allMessages.filter((m: Message) => !m.is_read).length;
      const repliedCount = allMessages.filter((m: Message) => m.is_replied).length;
      const contactCount = allMessages.filter((m: Message) => m.message_type === 'contact').length;
      const supportCount = allMessages.filter((m: Message) => m.message_type === 'support').length;
      const reportCount = allMessages.filter((m: Message) => m.message_type === 'report').length;
      const feedbackCount = allMessages.filter((m: Message) => m.message_type === 'feedback').length;

      setStats({
        total: allMessages.length,
        unread: unreadCount,
        replied: repliedCount,
        contact: contactCount,
        support: supportCount,
        report: reportCount,
        feedback: feedbackCount
      });
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: number) {
    try {
      const token = localStorage.getItem('access');
      await axios.post(`${API_BASE}/messages/${messageId}/mark_as_read/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleReply() {
    if (!selectedMessage || !replyText.trim()) {
      alert('Please enter a reply message');
      return;
    }

    setReplying(true);
    try {
      const token = localStorage.getItem('access');
      await axios.post(`${API_BASE}/messages/${selectedMessage.id}/reply/`, 
        { reply_message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const updated = { ...selectedMessage, is_replied: true, reply_message: replyText };
      setSelectedMessage(updated);
      setMessages(messages.map(m => 
        m.id === selectedMessage.id ? updated : m
      ));
      setReplyText('');
      alert('Reply sent successfully!');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      alert(err.response?.data?.detail || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  }

  async function deleteMessage(messageId: number) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('access');
      await axios.delete(`${API_BASE}/messages/${messageId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(messages.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      alert('Message deleted');
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  }

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.is_read;
    if (filter === 'replied') return m.is_replied;
    return true;
  });

  const messageTypeColor = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-yellow-100 text-yellow-800';
      case 'support': return 'bg-red-100 text-red-800';
      case 'report': return 'bg-yellow-100 text-yellow-800';
      case 'feedback': return 'bg-yellow-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages & Communications</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
          <div className="text-sm text-gray-600">Unread</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          <div className="text-sm text-gray-600">Replied</div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl font-bold text-gray-700">{stats.support}</div>
          <div className="text-sm text-gray-600">Support Requests</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Messages</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'all' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'unread' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Unread ({stats.unread})
              </button>
              <button
                onClick={() => setFilter('replied')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'replied' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Replied ({stats.replied})
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-6 text-center text-gray-600">Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No messages</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.is_read) markAsRead(msg.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition border-l-4 ${
                      selectedMessage?.id === msg.id 
                        ? 'bg-yellow-50 border-yellow-600' 
                        : msg.is_read 
                        ? 'border-gray-200' 
                        : 'border-red-400 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {msg.sender.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate mt-1">
                          {msg.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${messageTypeColor(msg.message_type)}`}>
                            {msg.message_type}
                          </span>
                          {!msg.is_read && (
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          )}
                          {msg.is_replied && (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">From: {selectedMessage.sender.name} ({selectedMessage.sender.email})</p>
                  </div>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm px-3 py-1 rounded-full ${messageTypeColor(selectedMessage.message_type)}`}>
                    {selectedMessage.message_type}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                  {selectedMessage.is_read && (
                    <span className="text-xs flex items-center gap-1 text-green-700 bg-yellow-50 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" /> Read
                    </span>
                  )}
                  {selectedMessage.is_replied && (
                    <span className="text-xs flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                      <Reply className="w-3 h-3" /> Replied
                    </span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {/* Reply if exists */}
                {selectedMessage.reply_message && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" /> Your Reply
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.reply_message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Box */}
              {!selectedMessage.is_replied && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Send Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply message here..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3 resize-none"
                    rows={3}
                    disabled={replying}
                  />
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    <Reply className="w-4 h-4" /> {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Select a message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
