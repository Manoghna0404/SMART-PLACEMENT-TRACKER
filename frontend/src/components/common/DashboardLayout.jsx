import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const DashboardLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
    <Navbar />
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {(title || subtitle) && (
            <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              {title && <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>}
              {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
    <Footer />
  </div>
);

export default DashboardLayout;
