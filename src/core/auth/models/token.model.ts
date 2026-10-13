import { StoreRole } from '../../../stores/entities/store-member.entity';

export interface PayloadToken {
  sub: number;
  /** The store being worked in; null until the user creates or joins one */
  storeId: number | null;
  /** The user's role in that store. The store guard reads it again from the database */
  storeRole: StoreRole | null;
  superAdmin: boolean;
}

export const isSuperAdmin = (user?: Pick<PayloadToken, 'superAdmin'> | null): boolean => !!user?.superAdmin;

/** Owners run their store; a super admin may run any */
export const canManageStore = (user?: Pick<PayloadToken, 'superAdmin' | 'storeRole'> | null): boolean =>
  isSuperAdmin(user) || user?.storeRole === 'OWNER';
