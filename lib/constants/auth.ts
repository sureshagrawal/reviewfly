/**
 * Auth-related constants.
 */
export const AUTH_COOKIE_ACCESS = "rf_access";
export const AUTH_COOKIE_REFRESH = "rf_refresh";
export const AUTH_COOKIE_CSRF = "rf_csrf";
export const AUTH_COOKIE_OAUTH_STATE = "rf_oauth_state";
export const AUTH_COOKIE_OAUTH_NEXT = "rf_oauth_next";

export const BUSINESS_USER_ROLES = ["owner", "admin", "viewer"] as const;
export type BusinessUserRole = (typeof BUSINESS_USER_ROLES)[number];

export const AUDIT_ACTIONS = [
  "register",
  "login",
  "login_google",
  "logout",
  "refresh",
  "password_reset_requested",
  "password_reset_completed",
  "password_changed",
  "profile_updated",
  "settings_updated",
  "tenant_suspended",
  "tenant_restored",
  "tenant_impersonated",
  "pool_created",
  "pool_updated",
  "pool_deleted",
  "tag_created",
  "tag_updated",
  "tag_deleted",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
