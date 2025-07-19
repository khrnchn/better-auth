import type { BetterAuthClientPlugin } from "../../types";
import { type AccessControl, type Role } from "../access";
import { adminAc, defaultStatements, userAc } from "./access";
import type { admin } from "./admin";
import { hasPermission } from "./has-permission";
import { isAdmin } from "./is-admin";
import type { UserWithRole, AdminOptions } from "./types";

interface AdminClientOptions {
	ac?: AccessControl;
	roles?: {
		[key in string]: Role;
	};
}

export const adminClient = <O extends AdminClientOptions>(options?: O) => {
	type DefaultStatements = typeof defaultStatements;
	type Statements = O["ac"] extends AccessControl<infer S>
		? S
		: DefaultStatements;
	type PermissionType = {
		[key in keyof Statements]?: Array<
			Statements[key] extends readonly unknown[]
				? Statements[key][number]
				: never
		>;
	};
	type PermissionExclusive =
		| {
				/**
				 * @deprecated Use `permissions` instead
				 */
				permission: PermissionType;
				permissions?: never;
		  }
		| {
				permissions: PermissionType;
				permission?: never;
		  };

	const roles = {
		admin: adminAc,
		user: userAc,
		...options?.roles,
	};

	return {
		id: "admin-client",
		$InferServerPlugin: {} as ReturnType<
			typeof admin<{
				ac: O["ac"] extends AccessControl
					? O["ac"]
					: AccessControl<DefaultStatements>;
				roles: O["roles"] extends Record<string, Role>
					? O["roles"]
					: {
							admin: Role;
							user: Role;
						};
			}>
		>,
		getActions: ($fetch) => ({
			admin: {
				checkRolePermission: <
					R extends O extends { roles: any }
						? keyof O["roles"]
						: "admin" | "user",
				>(
					data: PermissionExclusive & {
						role: R;
					},
				) => {
					const isAuthorized = hasPermission({
						role: data.role as string,
						options: {
							ac: options?.ac,
							roles: roles,
						},
						permissions: (data.permissions ?? data.permission) as any,
					});
					return isAuthorized;
				},
				/**
				 * Simple utility to check if a user has admin privileges
				 * 
				 * @param user - User object with id and optional role information
				 * @param adminOptions - Optional admin plugin options (uses client plugin options if not provided)
				 * @returns boolean indicating admin status
				 * 
				 * @example
				 * ```ts
				 * // Basic usage
				 * const userIsAdmin = authClient.admin.isAdmin(session?.user);
				 * 
				 * // With custom options
				 * const userIsAdmin = authClient.admin.isAdmin(user, { 
				 *   adminRoles: ['admin', 'superuser'] 
				 * });
				 * ```
				 */
				isAdmin: (
					user: UserWithRole | { id: string; role?: string } | null | undefined,
					adminOptions?: AdminOptions,
				): boolean => {
					// Use provided options or fall back to client plugin options
					const effectiveOptions: AdminOptions = {
						...options,
						...adminOptions,
					};
					return isAdmin(user, effectiveOptions);
				},
			},
		}),
		pathMethods: {
			"/admin/list-users": "GET",
			"/admin/stop-impersonating": "POST",
		},
	} satisfies BetterAuthClientPlugin;
};
