import { useAuthStore } from '../store/authStore';
import { AllowedTab } from '../api/hr';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.role === 'MANAGER';

  // MANAGER는 모든 권한을 가짐
  const getAllowedTabs = (): string[] => {
    if (isAdmin) {
      return ['INVENTORY', 'ORDER', 'SUPPLIER', 'HR'];
    }
    return user?.allowed_tabs || [];
  };

  const hasPermission = (tab: AllowedTab): boolean => {
    if (isAdmin) return true;
    return getAllowedTabs().includes(tab);
  };

  const canEdit = (tab: AllowedTab): boolean => {
    return hasPermission(tab);
  };

  const canCreate = (tab: AllowedTab): boolean => {
    return hasPermission(tab);
  };

  const canDelete = (tab: AllowedTab): boolean => {
    return hasPermission(tab);
  };

  const canView = (): boolean => {
    // 기본적으로 모든 사용자는 모든 탭을 볼 수 있지만, 수정/생성 권한은 제한
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
