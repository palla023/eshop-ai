export interface IUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
  profile_pic?: string;
  created_at: string;
  updated_at: string;
}