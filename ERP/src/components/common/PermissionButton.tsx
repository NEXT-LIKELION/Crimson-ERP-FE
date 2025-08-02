import React from 'react';
import { AllowedTab } from '../../api/hr';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionButtonProps {
    requiredPermission: AllowedTab;
    action: 'create' | 'edit' | 'delete' | 'view';
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
    requiredPermission,
    action,
    children,
    className = '',
    onClick,
    disabled = false,
    title,
    ...props
}) => {
    const permissions = usePermissions();
    
    const hasRequiredPermission = () => {
        switch (action) {
            case 'create':
                return permissions.canCreate(requiredPermission);
            case 'edit':
                return permissions.canEdit(requiredPermission);
            case 'delete':
                return permissions.canDelete(requiredPermission);
            case 'view':
                return permissions.canView(requiredPermission);
            default:
                return false;
        }
    };
    
    if (!hasRequiredPermission()) {
        return null; // 권한이 없으면 버튼을 렌더링하지 않음
    }
    
    return (
        <button
            className={className}
            onClick={onClick}
            disabled={disabled}
            title={title}
            {...props}
        >
            {children}
        </button>
    );
};

export default PermissionButton;