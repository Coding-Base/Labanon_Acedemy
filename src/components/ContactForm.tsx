import React, { useState } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

export default function ContactForm({ className }: { className?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('General Enquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name || !email || !message) {
      setError('Please fill name, email and message');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/messages/contact/`, { name, email, phone, type, subject, message });
      setSuccess('Message sent — we will get back to you shortly.');
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage(''); setType('General Enquiry');
    } catch (err) {
      setError('Failed to send message. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className={className || 'space-y-6'}>
      {success && <div className="p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg text-sm">{success}</div>}
      {error && <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">{error}</div>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your name</label>
          <input 
            aria-label="Your name" 
            type="text"
            className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600/60 transition-colors" 
            placeholder="Your name" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input 
            aria-label="Email address" 
            type="email" 
            className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600/60 transition-colors" 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone (optional)</label>
          <input 
            aria-label="Phone number (optional)" 
            type="tel"
            className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600/60 transition-colors" 
            placeholder="Phone (optional)" 
            value={phone} 
            onChange={e=>setPhone(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Inquiry Type</label>
          <select 
            aria-label="Message type" 
            className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-600/60 transition-colors"
            value={type} 
            onChange={e=>setType(e.target.value)}
          >
            <option value="General Enquiry">General Enquiry</option>
            <option value="Partnership">Partnership</option>
            <option value="Affiliate">Affiliate</option>
            <option value="Complaint">Complaint</option>
            <option value="Request">Request</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
        <input 
          aria-label="Subject" 
          type="text"
          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600/60 transition-colors" 
          placeholder="Subject" 
          value={subject} 
          onChange={e=>setSubject(e.target.value)} 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
        <textarea 
          aria-label="Message body" 
          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600/60 transition-colors resize-none" 
          rows={5} 
          placeholder="Message" 
          value={message} 
          onChange={e=>setMessage(e.target.value)} 
        />
      </div>

      <div className="flex items-center justify-end">
        <button 
          type="submit" 
          aria-label="Send message" 
          className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <Send className="w-4 h-4" />
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
