const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    <p className="mt-4 text-sm text-slate-500">{text}</p>
  </div>
);

export default Loader;
