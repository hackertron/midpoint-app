export interface Location {
  latitude: number;
  longitude: number;
}

export interface CreateUserRequest {
  email: string;
  display_name: string;
  password: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface UserUpdateRequest {
  location: Location;
}

export interface UserResponse {
  id: number;
  email: string;
  display_name: string;
  token: string;
  location: Location;
}

export interface ErrorResponse {
  status: number;
  message: string;
}

export type GroupType = 'public' | 'protected' | 'private';

export interface GroupCreator {
  id: number;
  display_name: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  type: GroupType;
  code: string;
  creator: GroupCreator;
  midpoint_latitude: number;
  midpoint_longitude: number;
  radius: number;
  member_count?: number;
  members?: GroupUserResponse[];
  places?: GroupPlaceResponse[];
}

export interface GroupUserResponse {
  user_id: number;
  group_id: string;
  display_name: string;
  latitude: number;
  longitude: number;
  role: 'admin' | 'member';
}

export interface GroupPlaceResponse {
  place_id: string;
  group_id: string;
  name: string;
  address: string;
  type: 'restaurant' | 'bar' | 'cafe' | 'park';
  rating: number;
  map_uri: string;
  latitude: number;
  longitude: number;
}