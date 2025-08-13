import { useAuthStore } from '../store/authStore';
import { AllowedTab } from '../api/hr';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.role === 'MANAGER';

  const getAllowedTabs = (): string[] => {
    if (isAdmin) {
      return ['INVENTORY', 'ORDER', 'SUPPLIER'];
    }
    return user?.allowed_tabs || [];
  };

  const hasPermission = (tab: AllowedTab | 'HR'): boolean => {
    if (tab === 'HR') {
      return isAdmin;
    }
    
    if (isAdmin) {
      return true;
    }
    
    const userAllowedTabs = user?.allowed_tabs || [];
    const hasTabPermission = userAllowedTabs.includes(tab as AllowedTab);
    
    return hasTabPermission;
  };

  const canEdit = (tab: AllowedTab | 'HR'): boolean => {
    return hasPermission(tab);
  };

  const canCreate = (tab: AllowedTab | 'HR'): boolean => {
    return hasPermission(tab);
  };

  const canDelete = (tab: AllowedTab | 'HR'): boolean => {
    return hasPermission(tab);
  };

  const canView = (): boolean => {
    return true;
  };

  return {
    isAdmin,
    hasPermission,
    canEdit,
    canCreate,
    canDelete,
    canView,
    getAllowedTabs,
    user,
  };
};

export default usePermissions;
