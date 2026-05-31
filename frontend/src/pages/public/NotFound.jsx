import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
    <h1 className="text-6xl font-bold text-indigo-600">404</h1>
    <p className="mt-4 text-xl text-slate-700">Page not found</p>
    <Link to="/" className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700">
      Go Home
    </Link>
  </div>
);

export default NotFound;
