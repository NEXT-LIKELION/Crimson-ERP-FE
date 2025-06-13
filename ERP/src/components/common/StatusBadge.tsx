import React from "react";

interface StatusBadgeProps {
    text: string;
    theme: "pending" | "approved" | "active" | "neutral" | "rejected";
    icon?: React.ReactNode; // 선택적 아이콘
}

const themeClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    neutral: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ text, theme, icon }) => {
    return (
        <span
            className={`
        inline-flex items-center justify-center
        h-6 px-2 py-1 rounded-full
        text-xs font-medium font-inter
        ${themeClasses[theme]}
      `}
        >
            {icon && <span className="pr-1 w-3 h-3">{icon}</span>}
            {text}
        </span>
    );
};

export default StatusBadge;
