export interface PayloadToken {
  role: string;
  sub: number;
}

/** The role names in the database are upper case (ADMIN), the Role enum is lower case */
export const isAdmin = (user?: Pick<PayloadToken, 'role'> | null): boolean =>
  String(user?.role ?? '').toLowerCase() === 'admin';
