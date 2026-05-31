import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { token, isAuthenticated } = useAuthStore();
  const { notifications, unreadCount, loadNotifications, connectSocket, disconnectSocket, markRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;
    loadNotifications().catch(() => {});
    connectSocket(token);
    return () => disconnectSocket();
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        aria-label="Notifications"
      >
        <img
          src="https://static.vecteezy.com/system/resources/thumbnails/021/353/224/small/notification-bell-icon-ringing-bell-and-notification-sign-for-alarm-clock-and-smartphone-application-alert-or-new-message-png.png"
          alt="Notifications"
          className="h-5 w-5"
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
            <p className="font-semibold text-slate-900 dark:text-white">Notifications</p>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                Mark all read
              </button>
              <button onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                X
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={notification.link || '#'}
                  onClick={() => {
                    if (!notification.isRead) markRead(notification._id).catch(() => {});
                    setOpen(false);
                  }}
                  className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                    notification.isRead ? '' : 'bg-indigo-50/70 dark:bg-indigo-950/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.message}</p>
                    </div>
                    <div className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
