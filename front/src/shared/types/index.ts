export interface LandRecord {
  id: string;
  cadastralNumber?: string;
  address?: string;
  ownerName?: string;
  area?: number;
  landUseType?: string;
  registrationDate?: string;
}

export interface PropertyRecord {
  id: string;
  cadastralNumber?: string;
  address?: string;
  ownerName?: string;
  area?: number;
  propertyType?: string;
  taxAmount?: number;
  registrationDate?: string;
}

export interface DiscrepancyTask {
  id: string;
  type: 'missing_property' | 'missing_land' | 'area_mismatch' | 'owner_mismatch';
  severity: 'high' | 'medium' | 'low';
  landRecord?: LandRecord;
  propertyRecord?: PropertyRecord;
  matchedBy?: 'cadastral' | 'address' | 'owner_area';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface User {
  id: string;
  name: string;
  role: 'head' | 'inspector' | 'admin';
  email: string;
}

export type UserRole = User['role'];
