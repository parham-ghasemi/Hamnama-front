import { createContext, useContext } from 'react';

export interface AdminAccessContextValue {
  accessLevel: number;
}

export const AdminAccessContext = createContext<AdminAccessContextValue | null>(null);

export const useAdminAccess = (): AdminAccessContextValue => {
  const value = useContext(AdminAccessContext);
  return value ?? { accessLevel: 0 };
};
