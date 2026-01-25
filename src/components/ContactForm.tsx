import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('contact');
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
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage(''); setType('contact');
    } catch (err) {
      setError('Failed to send message. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-3">Contact Us</h3>
      <p className="text-sm text-gray-600 mb-4">Send an enquiry, partnership request, complaint or other message.</p>
      {success && <div className="mb-3 text-green-700">{success}</div>}
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="p-2 border rounded" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="p-2 border rounded" placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
          <select className="p-2 border rounded" value={type} onChange={e=>setType(e.target.value)}>
            <option value="contact">General Enquiry</option>
            <option value="partnership">Partnership</option>
            <option value="affiliate">Affiliate</option>
            <option value="complaint">Complaint</option>
            <option value="request">Request</option>
          </select>
        </div>
        <input className="p-2 border rounded w-full" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <textarea className="p-2 border rounded w-full" rows={5} placeholder="Message" value={message} onChange={e=>setMessage(e.target.value)} />
        <div className="flex items-center justify-end">
          <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
        </div>
      </form>
    </div>
  );
}
