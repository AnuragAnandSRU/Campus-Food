export type UserRole = 'student' | 'staff' | 'owner' | 'admin';

/** What a staff member does on the canteen floor. A staffer can do both. */
export type StaffDuty = 'kitchen' | 'delivery';

/** A power an owner can grant a staff member. Owners implicitly have all. */
export type StaffPermission = 'manage_menu' | 'view_analytics';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  hostelBlock?: string;
  roomNumber?: string;
  canteenId?: string;
  staffDuties?: StaffDuty[];
  permissions?: StaffPermission[];
  isVerified: boolean;
  isActive: boolean;
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

/** Which entrance a login came through. Each door only admits matching roles. */
export type LoginAudience = 'student' | 'business' | 'admin';

export interface LoginDto {
  email: string;
  password: string;
  /**
   * The door this login was submitted through. When present, the backend
   * rejects accounts whose role doesn't belong to that door (hard separation
   * between the student, partner, and admin entrances). Omit for a legacy
   * any-role login.
   */
  audience?: LoginAudience;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

/** Payload for an invitee setting their password via the invitation link. */
export interface AcceptInviteDto {
  token: string;
  password: string;
}

/** Admin provisioning of a staff or owner account (invite-link flow). */
export interface ProvisionUserDto {
  email: string;
  name: string;
  phone: string;
  role: 'staff' | 'owner';
  canteenId: string;
  /** Required for staff (at least one); optional for owner. */
  staffDuties?: StaffDuty[];
  /** Optional powers granted to a staff member up front. */
  permissions?: StaffPermission[];
}

/** A provisioned staff/owner account as shown in the admin team list. */
export interface ProvisionedUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  staffDuties?: StaffDuty[];
  permissions?: StaffPermission[];
  canteen: { _id: string; name: string } | null;
  isActive: boolean;
  createdAt: Date;
}

/** Result of provisioning (or resending): the account plus a shareable link. */
export interface ProvisionResult {
  user: {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
  inviteLink: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  hostelBlock?: string;
  roomNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
