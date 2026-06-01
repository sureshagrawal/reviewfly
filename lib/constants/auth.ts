/**
 * Auth-related constants.
 */
export const AUTH_COOKIE_ACCESS = "rf_access";
export const AUTH_COOKIE_REFRESH = "rf_refresh";
export const AUTH_COOKIE_CSRF = "rf_csrf";

export const BUSINESS_USER_ROLES = ["owner", "admin", "viewer"] as const;
export type BusinessUserRole = (typeof BUSINESS_USER_ROLES)[number];

export const AUDIT_ACTIONS = [
  "register",
  "login",
  "logout",
  "refresh",
  "password_changed",
  "settings_updated",
  "tag_created",
  "tag_updated",
  "tag_deleted",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
