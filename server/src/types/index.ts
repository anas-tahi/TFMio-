// ── Roles ──
export enum UserRole {
  STUDENT = "student",
  TUTOR = "tutor",
  COORDINATOR = "coordinator",
}

// ── Work type ──
export enum WorkType {
  TFM = "TFM",
  TFG = "TFG",
}

// ── Topic status ──
export enum TopicStatus {
  DRAFT = "draft",
  PENDING = "pending", // awaiting coordinator approval
  ACTIVE = "active",
  CLOSED = "closed",
}

// ── Interest / match status ──
export enum InterestStatus {
  PENDING = "pending", // student expressed interest, tutor hasn't decided
  ACCEPTED = "accepted", // tutor accepted → becomes a match
  REJECTED = "rejected",
}

// ── Lifecycle stage of a matched work ──
export enum WorkStage {
  MATCHED = "matched", // tutor accepted, awaiting coordinator approval
  APPROVED = "approved", // coordinator approved the match
  IN_PROGRESS = "in_progress", // student working, documents being submitted
  DEFENSE_READY = "defense_ready", // final memory approved, awaiting defense
  DEFENDED = "defended", // defense held, awaiting grade
  GRADED = "graded", // final grade entered
}

// ── Document type & status ──
export enum DocumentType {
  PROPOSAL = "proposal",
  MEMORY = "memory",
}

export enum DocumentStatus {
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REVISION_REQUESTED = "revision_requested",
}

// ── Notification kinds ──
export enum NotificationType {
  MATCH = "match",
  APPROVAL = "approval",
  DOCUMENT = "document",
  DEFENSE = "defense",
  GRADE = "grade",
  INTEREST = "interest",
  SYSTEM = "system",
}
