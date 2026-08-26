interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-700">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Mostrando {start}-{end} de {totalItems} registros
      </span>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Anterior
        </button>
        <span className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
