/** Shared by server and client code (no server imports here). */
export const COURSE_STATUSES = ["in_progress", "planned", "completed", "dropped"] as const;
export const COURSE_FORMATS = ["course", "book", "certificate", "workshop", "self_study", "other"] as const;
export const SKILL_CATEGORIES = ["language", "technical", "soft", "professional", "other"] as const;
