import { Notification } from '../hooks/useNotifications';

interface Props {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

export function NotificationList({ notifications, onMarkRead }: Props) {
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'ALERT': return <div className="p-2 bg-red-500/20 text-red-500 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>;
      case 'MESSAGE': return <div className="p-2 bg-blue-500/20 text-blue-500 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>;
      case 'SYSTEM': return <div className="p-2 bg-purple-500/20 text-purple-500 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>;
      default: return <div className="p-2 bg-green-500/20 text-green-500 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-textMuted bg-surface rounded-xl border border-slate-700">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        <p className="text-lg">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className={`flex items-start p-4 rounded-xl border transition-all animate-slide-in ${
            notif.isRead 
              ? 'bg-surface/50 border-slate-800 opacity-70' 
              : 'bg-surface border-slate-600 shadow-md transform hover:-translate-y-1'
          }`}
        >
          <div className="flex-shrink-0 mr-4">
            {getTypeIcon(notif.type)}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-semibold tracking-wider ${notif.isRead ? 'text-textMuted' : 'text-primary'}`}>
                {notif.type}
              </span>
              <span className="text-xs text-textMuted">
                {new Date(notif.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className={`text-sm ${notif.isRead ? 'text-textMuted' : 'text-textMain'}`}>
              {notif.message}
            </p>
          </div>
          {!notif.isRead && (
            <button 
              onClick={() => onMarkRead(notif.id)}
              className="ml-4 p-2 text-textMuted hover:text-primary transition-colors"
              title="Mark as read"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
