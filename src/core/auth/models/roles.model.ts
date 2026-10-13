/**
 * What @RoleD can ask for. OWNER and CASHIER are a user's role in the store they are working in;
 * SUPER_ADMIN runs the platform and passes every role check, in any store.
 */
export enum Role {
  SUPER_ADMIN = 'superadmin',
  OWNER = 'owner',
  CASHIER = 'cashier',
}
