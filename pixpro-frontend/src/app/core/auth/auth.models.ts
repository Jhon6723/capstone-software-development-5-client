// Payload (Adjust according to the contract defined by the backend team.)
export interface LoginRequest {
  email: string;
  password: string;
}

// Placeholder (Expected response from the Auth Microservice upon successful login.)
export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}
