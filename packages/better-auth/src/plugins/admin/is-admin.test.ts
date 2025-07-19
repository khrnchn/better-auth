import { describe, expect, it } from "vitest";
import { isAdmin } from "./is-admin";
import type { UserWithRole, AdminOptions } from "./types";

describe("isAdmin", () => {
	const mockUser: UserWithRole = {
		id: "user123",
		name: "Test User",
		email: "test@example.com",
		emailVerified: false,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		role: "admin",
	};

	describe("basic functionality", () => {
		it("should return true for user with admin role", () => {
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user)).toBe(true);
		});

		it("should return false for user with non-admin role", () => {
			const user = { ...mockUser, role: "user" };
			expect(isAdmin(user)).toBe(false);
		});

		it("should return false for user with no role", () => {
			const user = { ...mockUser, role: undefined };
			expect(isAdmin(user)).toBe(false);
		});

		it("should return false for user with empty role", () => {
			const user = { ...mockUser, role: "" };
			expect(isAdmin(user)).toBe(false);
		});
	});

	describe("null/undefined handling", () => {
		it("should return false for null user", () => {
			expect(isAdmin(null)).toBe(false);
		});

		it("should return false for undefined user", () => {
			expect(isAdmin(undefined)).toBe(false);
		});
	});

	describe("adminUserIds functionality", () => {
		const options: AdminOptions = {
			adminUserIds: ["admin123", "superuser456"],
		};

		it("should return true for user ID in adminUserIds regardless of role", () => {
			const user = { ...mockUser, id: "admin123", role: "user" };
			expect(isAdmin(user, options)).toBe(true);
		});

		it("should return true for user ID in adminUserIds with no role", () => {
			const user = { ...mockUser, id: "superuser456", role: undefined };
			expect(isAdmin(user, options)).toBe(true);
		});

		it("should return false for user ID not in adminUserIds with non-admin role", () => {
			const user = { ...mockUser, id: "regular789", role: "user" };
			expect(isAdmin(user, options)).toBe(false);
		});

		it("should work with adminUserIds and regular role checking", () => {
			const userInList = { ...mockUser, id: "admin123", role: "user" };
			const userWithAdminRole = { ...mockUser, id: "other123", role: "admin" };
			const regularUser = { ...mockUser, id: "regular123", role: "user" };

			expect(isAdmin(userInList, options)).toBe(true);
			expect(isAdmin(userWithAdminRole, options)).toBe(true);
			expect(isAdmin(regularUser, options)).toBe(false);
		});
	});

	describe("custom adminRoles functionality", () => {
		it("should work with string adminRoles", () => {
			const options: AdminOptions = { adminRoles: "superuser" };
			const user = { ...mockUser, role: "superuser" };
			expect(isAdmin(user, options)).toBe(true);
		});

		it("should work with array adminRoles", () => {
			const options: AdminOptions = { adminRoles: ["admin", "superuser", "moderator"] };
			
			expect(isAdmin({ ...mockUser, role: "admin" }, options)).toBe(true);
			expect(isAdmin({ ...mockUser, role: "superuser" }, options)).toBe(true);
			expect(isAdmin({ ...mockUser, role: "moderator" }, options)).toBe(true);
			expect(isAdmin({ ...mockUser, role: "user" }, options)).toBe(false);
		});

		it("should return false for admin role when custom adminRoles don't include admin", () => {
			const options: AdminOptions = { adminRoles: ["superuser"] };
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user, options)).toBe(false);
		});
	});

	describe("multiple roles functionality", () => {
		it("should work with comma-separated roles", () => {
			const user = { ...mockUser, role: "user,editor,admin" };
			expect(isAdmin(user)).toBe(true);
		});

		it("should work with comma-separated roles with spaces", () => {
			const user = { ...mockUser, role: "user, editor, admin" };
			expect(isAdmin(user)).toBe(true);
		});

		it("should return false when none of multiple roles are admin", () => {
			const user = { ...mockUser, role: "user,editor,viewer" };
			expect(isAdmin(user)).toBe(false);
		});

		it("should work with custom adminRoles and multiple user roles", () => {
			const options: AdminOptions = { adminRoles: ["superuser", "moderator"] };
			const user = { ...mockUser, role: "user,editor,moderator" };
			expect(isAdmin(user, options)).toBe(true);
		});

		it("should handle empty roles in comma-separated string", () => {
			const user = { ...mockUser, role: "user,,admin," };
			expect(isAdmin(user)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should work with minimal user object", () => {
			const minimalUser = { id: "123", role: "admin" };
			expect(isAdmin(minimalUser)).toBe(true);
		});

		it("should work with minimal user object without role", () => {
			const minimalUser = { id: "123" };
			expect(isAdmin(minimalUser)).toBe(false);
		});

		it("should work with empty options object", () => {
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user, {})).toBe(true);
		});

		it("should handle undefined options", () => {
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user, undefined)).toBe(true);
		});

		it("should handle empty adminRoles array", () => {
			const options: AdminOptions = { adminRoles: [] };
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user, options)).toBe(false);
		});

		it("should handle empty adminUserIds array", () => {
			const options: AdminOptions = { adminUserIds: [] };
			const user = { ...mockUser, role: "admin" };
			expect(isAdmin(user, options)).toBe(true);
		});
	});

	describe("real-world scenarios", () => {
		it("should work in typical auth context", () => {
			const sessionUser = {
				id: "user_123",
				email: "admin@company.com",
				name: "Admin User",
				role: "admin",
				emailVerified: true,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			expect(isAdmin(sessionUser)).toBe(true);
		});

		it("should work with organization-style roles", () => {
			const options: AdminOptions = {
				adminRoles: ["org_admin", "site_admin", "super_admin"],
			};

			const orgAdmin = { ...mockUser, role: "org_admin" };
			const siteAdmin = { ...mockUser, role: "site_admin" };
			const regularMember = { ...mockUser, role: "member" };

			expect(isAdmin(orgAdmin, options)).toBe(true);
			expect(isAdmin(siteAdmin, options)).toBe(true);
			expect(isAdmin(regularMember, options)).toBe(false);
		});

		it("should prioritize adminUserIds over roles", () => {
			const options: AdminOptions = {
				adminRoles: ["super_admin"],
				adminUserIds: ["emergency_admin"],
			};

			// User with emergency admin ID but wrong role should still be admin
			const emergencyUser = { ...mockUser, id: "emergency_admin", role: "user" };
			expect(isAdmin(emergencyUser, options)).toBe(true);
		});
	});
});