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
  MATCHED = "matched", // tutor accepted, awaiting coordinator review
  APPROVED = "approved", // tutor gave final confirmation after coordinator review
  IN_PROGRESS = "in_progress", // student working, documents being submitted
  DEFENSE_READY = "defense_ready", // final memory approved, awaiting defense
  DEFENDED = "defended", // defense held, awaiting grade
  GRADED = "graded", // final grade entered
}

// ── Coordinator decision on a match — this is now an intermediate review,
// not the final word. It always goes back to the tutor afterward. ──
export enum CoordinatorDecision {
  PENDING = "pending",
  APPROVED = "approved", // coordinator is fine with it as-is
  REJECTED = "rejected",
  NOT_REVIEWED = "not_reviewed", // "no intervenir"
}

// ── Tutor's final decision, after seeing the coordinator's input ──
export enum TutorFinalDecision {
  PENDING = "pending", // waiting on tutor, after coordinator reviewed
  CONFIRMED = "confirmed", // tutor confirms the match goes ahead
  CANCELLED = "cancelled", // tutor cancels it after coordinator's input
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

// ── Student-proposed topic status ──
export enum ProposalStatus {
  PENDING = "pending", // waiting on tutor
  REVISION_REQUESTED = "revision_requested", // tutor asked for changes
  ACCEPTED = "accepted", // tutor accepted → becomes a Work, goes to coordinator
  REJECTED = "rejected",
}