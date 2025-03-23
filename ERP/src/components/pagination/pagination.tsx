import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

export default function Pagination() {
    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            {/* Desktop pagination */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2 text-sm">
                    <p className="text-[#4B5563]">항목당 표시</p>
                    <span className="inline-flex items-center justify-center w-10 h-7 bg-white text-black font-medium border border-[#D1D5DB] rounded-md">
                        10
                    </span>
                    <p className="text-[#4B5563]">/ 페이지</p>
                </div>
                <div>
                    <nav aria-label="Pagination" className="flex items-center">
                        {/* Previous Button */}
                        <a
                            href="#"
                            className="relative inline-flex items-center justify-center rounded-md w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 focus:outline-none"
                        >
                            <span className="sr-only">Previous</span>
                            <ArrowLeftIcon aria-hidden="true" className="w-5 h-5" />
                        </a>
                        {/* Page 1 (Active) */}
                        <a
                            href="#"
                            aria-current="page"
                            className="relative inline-flex items-center justify-center w-10 h-9 rounded-md text-[#4F46E5] bg-[#EEF2FF] border border-[#4F46E5] focus:outline-none"
                        >
                            1
                        </a>
                        {/* Page 2 */}
                        <a
                            href="#"
                            className="relative inline-flex items-center justify-center w-10 h-9 rounded-md text-[#6B7280] bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none"
                        >
                            2
                        </a>
                        {/* Page 3 */}
                        <a
                            href="#"
                            className="relative inline-flex items-center justify-center w-10 h-9 rounded-md text-[#6B7280] bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none"
                        >
                            3
                        </a>
                        {/* Next Button */}
                        <a
                            href="#"
                            className="relative inline-flex items-center justify-center rounded-md w-10 h-9 text-gray-500 border border-gray-200 hover:bg-gray-50 focus:outline-none"
                        >
                            <span className="sr-only">Next</span>
                            <ArrowRightIcon aria-hidden="true" className="w-5 h-5" />
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    );
}
