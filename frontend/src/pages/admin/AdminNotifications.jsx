import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import {
  adminCreateNotification,
  getAdminNotifications,
  getNotificationReadStatus,
} from '../../services/notificationService';
import { getStudents } from '../../services/adminService';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';

const AdminNotifications = () => {
  const { isAuthenticated } = useAuthStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('all');
  const [recipientId, setRecipientId] = useState('');
  const [users, setUsers] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSent();
  }, [isAuthenticated]);

  const loadSent = async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications();
      setSent(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getStudents();
      setUsers(res.data.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        message,
        role,
        recipient: recipientId && recipientId !== 'all' ? recipientId : undefined,
      };

      await adminCreateNotification(payload);

      setStatus({
        type: 'success',
        text: 'Notification sent successfully',
      });

      setTitle('');
      setMessage('');
      setRecipientId('');

      loadSent();
    } catch (err) {
      setStatus({
        type: 'error',
        text: err.response?.data?.message || err.message,
      });
    }
  };

  const viewReadStatus = async (id) => {
    try {
      const res = await getNotificationReadStatus(id);
      setStatus({
        type: 'info',
        text: `Read by ${res.data.readCount} / ${res.data.recipientCount}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout
      title="Send Notifications"
      subtitle="Broadcast messages to students, admins, or specific users"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Compose Message
            </h3>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your notification message here..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Send To
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All users</option>
                  <option value="student">All Students</option>
                  <option value="admin">All Admins</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                Send Notification
              </button>
            </form>

            {status && (
              <div
                className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                  status.type === 'error'
                    ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900 dark:text-red-100'
                    : status.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                      : 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900 dark:text-blue-100'
                }`}
              >
                {status.text}
              </div>
            )}
          </div>
        </div>

        {/* Recipients Section */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Specific Recipients
          </h3>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            <label className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={recipientId === 'all'}
                onChange={(e) =>
                  setRecipientId(e.target.checked ? 'all' : '')
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                All users
              </span>
            </label>

            {users.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No users available
              </p>
            ) : (
              users.map((u) => (
                <label
                  key={u._id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={recipientId === u._id}
                    onChange={(e) =>
                      setRecipientId(e.target.checked ? u._id : '')
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {u.email}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications Section */}
      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Recent Notifications
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : sent.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            No notifications sent yet
          </div>
        ) : (
          <div className="divide-y">
            {sent.map((s) => (
              <div
                key={s._id}
                className="flex flex-col gap-4 border-b p-6 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {s.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {s.message}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Sent: {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-1 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                      {s.readCount || 0} read
                    </div>
                  </div>

                  <button
                    onClick={() => viewReadStatus(s._id)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;