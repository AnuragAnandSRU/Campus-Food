export type UserRole = 'student' | 'staff' | 'owner' | 'admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  hostelBlock?: string;
  roomNumber?: string;
  canteenId?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  hostelBlock?: string;
  roomNumber?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}
