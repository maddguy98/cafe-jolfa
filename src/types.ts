export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  count?: number;
}

export interface CustomizationOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface MenuItem {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  price: number; // in Tomans
  shortPriceBadge?: string;
  categoryId: string;
  image: string;
  imageAlt?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isSpecialToday?: boolean;
  badge?: string;
  calories?: number;
  preparationTime?: string;
  rating?: number;
  tags?: string[];
  customizations?: {
    milk?: CustomizationOption[];
    sweetness?: CustomizationOption[];
    temperature?: CustomizationOption[];
    syrups?: CustomizationOption[];
  };
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  selectedMilk?: string;
  selectedSweetness?: string;
  selectedTemperature?: string;
  selectedSyrups?: string[];
  extraShots?: number;
  notes?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  orderType: 'dine_in' | 'takeaway';
  tableNumber?: string;
  createdAt: string;
  estimatedReadyTime: string;
  customerName: string;
  customerPhone: string;
}

export interface ServiceRequest {
  id: string;
  tableNumber: string;
  requestType: 'bill' | 'clean' | 'reorder' | 'water' | 'napkin_sugar' | 'custom';
  requestLabel: string;
  customNote?: string;
  createdAt: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed';
  handledBy?: string;
}

export type StaffRole = 'reception' | 'waiter';

export type TabType = 'menu' | 'home' | 'orders';

