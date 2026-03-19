declare const __OPENCODE_EDITION__: string

export const EDITION = __OPENCODE_EDITION__
export const isAudit = EDITION === "audit"
