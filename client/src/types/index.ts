export type UserRole = "student" | "tutor" | "coordinator";

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  degree?: string;
  year?: number;
  skills?: string[];
  interests?: string;
  workStyle?: string;
  aiSummary?: string;
  department?: string;
  bio?: string;
  scope?: "TFM" | "TFG";
}

export interface AuthResponse {
  token: string;
  user: User;
}
