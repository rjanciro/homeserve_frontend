export type UserType = 'homeowner' | 'housekeeper' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  userType: UserType;
  profileImage?: string;
  houseNumber?: string;
  streetName?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  experience?: string;
  specialties?: string;
  bio?: string;
  createdAt: Date;
  isEmailVerified?: boolean;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}