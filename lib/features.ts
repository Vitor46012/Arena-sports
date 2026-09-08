export type PlanType = "BASIC" | "PRO" | "MASTER";

export interface ArenaFeatures {
  obs_integration: boolean;
  qr_codes: boolean;
  live_cameras: boolean;
  custom_branding: boolean;
  max_courts: number;
}

export const PLAN_DEFAULTS: Record<PlanType, ArenaFeatures> = {
  BASIC: {
    obs_integration: false,
    qr_codes: false,
    live_cameras: false,
    custom_branding: false,
    max_courts: 1,
  },
  PRO: {
    obs_integration: true,
    qr_codes: true,
    live_cameras: true,
    custom_branding: false,
    max_courts: 3,
  },
  MASTER: {
    obs_integration: true,
    qr_codes: true,
    live_cameras: true,
    custom_branding: true,
    max_courts: 10,
  },
};

export const DEFAULT_FEATURES = PLAN_DEFAULTS.BASIC;
