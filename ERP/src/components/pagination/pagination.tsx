import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
                <p className="text-gray-700">항목당 표시</p>
                <span className="inline-flex items-center justify-center w-10 h-7 bg-white text-black font-medium border border-gray-300 rounded-md">
                    {itemsPerPage}
                </span>
                <p className="text-gray-700">/ 페이지</p>
            </div>
            <nav className="flex items-center">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-md disabled:opacity-50"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => onPageChange(index + 1)}
                        className={`w-10 h-9 rounded-md ${
                            currentPage === index + 1
                                ? 'bg-blue-100 text-blue-700 border-blue-700'
                                : 'bg-white text-gray-700 border-gray-300'
                        } border hover:bg-gray-50`}
                    >
                        {index + 1}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-md disabled:opacity-50"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
