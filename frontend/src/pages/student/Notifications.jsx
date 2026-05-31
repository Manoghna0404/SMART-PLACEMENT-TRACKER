import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import useNotificationStore from '../../store/notificationStore';

const Notifications = () => {
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    loadNotifications().catch(console.error);
  }, []);

  return (
    <DashboardLayout title="Notifications" subtitle="Stay updated with placement status changes, interviews, and test alerts">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        <button
          onClick={markAllRead}
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Mark all read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification._id}
              to={notification.link || '/'}
              onClick={() => markRead(notification._id).catch(console.error)}
              className={`block rounded-3xl border p-5 shadow-sm transition hover:border-indigo-300 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
