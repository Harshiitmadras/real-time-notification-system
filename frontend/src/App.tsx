import { useNotifications } from './hooks/useNotifications';
import { NotificationList } from './components/NotificationList';
import { TestPanel } from './components/TestPanel';
import { useState } from 'react';

function App() {
  const [userId, setUserId] = useState('user-123'); // Mocked user session
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);

  return (
    <div className="min-h-screen p-8 bg-background text-textMain font-sans selection:bg-primary/30">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Header & Main Content */}
        <div className="md:col-span-8 space-y-6">
          <header className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Notifications Hub
              </h1>
              <p className="text-textMuted mt-1">Realtime scalable alerts via WebSockets & Redis.</p>
            </div>
            <div className="relative cursor-pointer group">
              <svg className="w-8 h-8 text-textMuted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </header>

          <main>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <span className="text-sm text-textMuted">{notifications.length} items</span>
            </div>
            <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <NotificationList notifications={notifications} onMarkRead={markAsRead} />
            </div>
          </main>
        </div>

        {/* Sidebar / Controls */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-700">
             <h2 className="text-lg font-semibold mb-3">Session</h2>
             <label className="block text-sm font-medium text-textMuted mb-1">Current User ID</label>
             <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-textMuted mt-2">Change this ID to test different channels.</p>
          </div>
          
          <TestPanel userId={userId} />
        </div>

      </div>
    </div>
  );
}

export default App;
