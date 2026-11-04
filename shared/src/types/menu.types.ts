export type MenuCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages' | 'Desserts';

export interface MenuItem {
  _id: string;
  canteenId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemDto {
  canteenId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: MenuCategory;
  isVeg: boolean;
  preparationTime: number;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {
  isAvailable?: boolean;
}

export interface PopulatedFavoriteItem extends Omit<MenuItem, 'canteenId'> {
  canteenId: {
    _id: string;
    name: string;
    location?: string;
    isActive?: boolean;
  };
}
