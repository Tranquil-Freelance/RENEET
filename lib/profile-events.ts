/** Fired after profile/onboarding is saved so header and other UI can refresh. */
export const PROFILE_UPDATED_EVENT = "prepinsights:profile-updated";

export type ProfileUpdatedDetail = {
  name?: string;
  state?: string | null;
};

export function dispatchProfileUpdated(detail?: ProfileUpdatedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, { detail }));
}
