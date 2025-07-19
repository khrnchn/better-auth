import type { UserWithRole, AdminOptions } from "./types";

/**
 * Simple utility to check if a user has admin privileges
 * 
 * This function provides a convenient boolean check for admin status by:
 * 1. First checking if user ID is in adminUserIds (highest priority)
 * 2. Then checking if user has any role matching adminRoles
 * 
 * @param user - User object with id and optional role information
 * @param options - Admin plugin options (optional, uses defaults if not provided)
 * @returns boolean indicating admin status
 * 
 * @example
 * ```ts
 * // Basic usage
 * if (isAdmin(session.user)) {
 *   // User is admin
 * }
 * 
 * // With custom options
 * if (isAdmin(user, { adminRoles: ['admin', 'superuser'] })) {
 *   // User has admin or superuser role
 * }
 * 
 * // With adminUserIds
 * if (isAdmin(user, { adminUserIds: ['user123'] })) {
 *   // User with ID 'user123' is always admin regardless of role
 * }
 * ```
 */
export function isAdmin(
	user: UserWithRole | { id: string; role?: string } | null | undefined,
	options?: AdminOptions,
): boolean {
	// Return false for null/undefined users
	if (!user) {
		return false;
	}

	// Check adminUserIds first (highest priority bypass)
	if (user.id && options?.adminUserIds?.includes(user.id)) {
		return true;
	}

	// Get admin roles (default to ["admin"])
	const adminRoles = Array.isArray(options?.adminRoles)
		? options.adminRoles
		: options?.adminRoles
			? [options.adminRoles]
			: ["admin"];

	// Get user roles (handle comma-separated roles and default to empty array)
	const userRoles = (user.role || "")
		.split(",")
		.map((r) => r.trim())
		.filter((r) => r.length > 0);

	// Check if user has any admin role
	return userRoles.some((role) => adminRoles.includes(role));
}