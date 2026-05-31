import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
  { to: '/companies', label: 'Companies', icon: 'CO' },
  { to: '/applications', label: 'My Applications', icon: 'AP' },
  { to: '/eligible', label: 'Eligible Companies', icon: 'EL' },
  { to: '/resume', label: 'Resume Analyzer', icon: 'CV' },
  { to: '/tests', label: 'Online Tests', icon: 'TS' },
  { to: '/notifications', label: 'Notifications', icon: 'NO' },
  { to: '/progress', label: 'Progress Tracker', icon: 'PR' },
  { to: '/profile', label: 'Profile', icon: 'ME' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: 'DB' },
  { to: '/admin/applications', label: 'Applications', icon: 'AP' },
  { to: '/admin/companies', label: 'Placement Drives', icon: 'CO' },
  { to: '/admin/tests', label: 'Online Tests', icon: 'TS' },
  { to: '/admin/tracking', label: 'Student Tracking', icon: 'TR' },
  // Activity logs removed as per requirements
  { to: '/admin/notifications', label: 'Notifications', icon: 'SN' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'AN' },
];


const Sidebar = () => {
  const { user } = useAuthStore();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-md transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:block">
      <div className="px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          {user?.role === 'admin' ? 'Admin Panel' : 'Student Panel'}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{user?.name || 'Welcome'}</h2>
      </div>
      <nav className="space-y-2 px-4 pb-6">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/15'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`
            }
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
