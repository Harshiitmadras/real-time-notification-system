import { useState } from 'react';

const API_URL = '/api/notifications';

export function TestPanel({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ message, type, idempotencyKey })
      });
      setMessage('');
    } catch (err) {
      console.error('Failed to create notification', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        Trigger Event
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Message</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
            placeholder="System update available..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
          >
            <option value="INFO">Info</option>
            <option value="ALERT">Alert</option>
            <option value="MESSAGE">Message</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primaryDark text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
        >
          {loading ? 'Sending...' : 'Trigger Notification'}
        </button>
      </form>
    </div>
  );
}
