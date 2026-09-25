/**
 * HR Authentication and Authorization Helpers
 * FieldAssist People Operations Portal
 */

import { checkIsHRUser, OWNER_EMAIL, isOwnerEmail } from '../services/hrAdminService';

export { OWNER_EMAIL, isOwnerEmail, checkIsHRUser };

/**
 * Synchronous check for owner email.
 * For full HR authorization check including database-driven hrAdmins collection,
 * use checkIsHRUser(user).
 */
export function isApprovedHREmail(email?: string | null): boolean {
  return isOwnerEmail(email);
}
