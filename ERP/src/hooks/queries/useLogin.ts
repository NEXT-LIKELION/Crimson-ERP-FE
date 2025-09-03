import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { fetchEmployees, fetchEmployee } from '../../api/hr';
import { setTokens } from '../../utils/localStorage';
import { useAuthStore } from '../../store/authStore';

export interface User {
  id?: number;
  username: string;
  role: 'MANAGER' | 'STAFF' | 'INTERN';
  first_name?: string;
  email?: string;
  contact?: string;
  status?: string;
  allowed_tabs?: string[];
}

export const useLogin = (onSuccessCallback?: (userData: User) => void) =>
  useMutation({
    mutationFn: login,
    onSuccess: async (res) => {
      const access = res.data.access_token;
      const refresh = res.data.refresh_token;
      const basicUser = {
        ...res.data.user,
        role: res.data.user.role as 'MANAGER' | 'STAFF' | 'INTERN'
      } as User;

      setTokens(access, refresh);

      const createUserWithTabs = (allowed_tabs: string[] = [], employeeId?: number): User => ({
        ...basicUser,
        allowed_tabs,
        id: employeeId
      });

      const handleUserSuccess = (user: User) => {
        useAuthStore.getState().setUser(user);
        if (onSuccessCallback) {
          onSuccessCallback(user);
        }
      };

      try {
        const employeesRes = await fetchEmployees();
        const currentEmployee = employeesRes.data.find(emp => emp.username === basicUser.username);
        
        if (currentEmployee) {
          const detailRes = await fetchEmployee(currentEmployee.id);
          const completeUser = createUserWithTabs(detailRes.data.allowed_tabs || [], currentEmployee.id);
          handleUserSuccess(completeUser);
        } else {
          handleUserSuccess(createUserWithTabs());
        }
      } catch {
        handleUserSuccess(createUserWithTabs());
      }
    },
    onError: (err: unknown) => {
      throw err;
    },
  });
