
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  spec: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
  selected: boolean;
}

export const cartItems: CartItem[] = [
  {
    id: 'cart-001',
    productId: 'SF001',
    name: '意式轻奢真皮沙发',
    image: 'https://readdy.ai/api/search-image?query=luxury%20Italian%20style%20genuine%20leather%20sofa%20in%20light%20luxury%20design%20with%20elegant%20tufted%20backrest%20and%20golden%20metal%20legs%2C%20modern%20living%20room%20furniture%20with%20premium%20craftsmanship%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20white%20background&width=800&height=800&seq=prod-sf001&orientation=squarish',
    spec: '单扶手 1100x1100x600CM',
    color: '米白色',
    price: 14550,
    quantity: 1,
    stock: 28,
    selected: true
  },
  {
    id: 'cart-002',
    productId: 'BD001',
    name: '轻奢软包双人床',
    image: 'https://readdy.ai/api/search-image?query=luxury%20upholstered%20double%20bed%20with%20elegant%20tufted%20headboard%20in%20light%20luxury%20style%2C%20premium%20velvet%20fabric%20in%20champagne%20gold%20color%20with%20modern%20design%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20white%20background&width=800&height=800&seq=prod-bd001&orientation=squarish',
    spec: '1800mm × 2000mm',
    color: '香槟金',
    price: 6800,
    quantity: 1,
    stock: 32,
    selected: true
  },
  {
    id: 'cart-003',
    productId: 'DT001',
    name: '实木餐桌椅组合',
    image: 'https://readdy.ai/api/search-image?query=solid%20wood%20dining%20table%20and%20chairs%20set%20with%20natural%20wood%20grain%20finish%2C%20modern%20minimalist%20design%20with%20rectangular%20table%20and%20four%20comfortable%20chairs%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20white%20background&width=800&height=800&seq=prod-dt001&orientation=squarish',
    spec: '一桌四椅',
    color: '原木色',
    price: 4580,
    quantity: 2,
    stock: 25,
    selected: false
  }
];
