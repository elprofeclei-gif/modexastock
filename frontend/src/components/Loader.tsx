export default function Loader({ message = 'Cargando datos...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium text-sm">{message}</p>
    </div>
  );
}
