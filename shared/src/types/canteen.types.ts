export interface OpeningHours {
  open: string;  // "07:00"
  close: string; // "22:00"
}

export interface Canteen {
  _id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  ownerId?: string;
  openingHours: OpeningHours;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Canteen as returned to admins, with the owner populated (or null). */
export interface AdminCanteen extends Omit<Canteen, 'ownerId'> {
  ownerId?: { _id: string; name: string; email: string } | null;
}

export interface CreateCanteenDto {
  name: string;
  description: string;
  location: string;
  image?: string;
  openingHours: OpeningHours;
}

export interface UpdateCanteenDto extends Partial<CreateCanteenDto> {
  isActive?: boolean;
}
