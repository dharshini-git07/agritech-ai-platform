export interface SellerProfile {
  sellerType: 'Farmer' | 'Nursery' | 'Organic Store' | 'Hydroponics Supplier' | 'Terrace Equipment Supplier';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  businessName: string;
  description: string;
  address: string;
  contactNumber: string;
  rating: number;
}

export interface Product {
  id?: string;
  productName: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  sellerId: string;
  sellerType: string;
  businessName: string;
  organicCertified: boolean;
  location: string;
  availability: 'in_stock' | 'out_of_stock';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
