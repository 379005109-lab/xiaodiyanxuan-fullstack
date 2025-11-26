
import React, { useState } from 'react';
import Header from './components/Header';
import GeminiChat from './components/GeminiChat';
import ShopView from './components/ShopView';
import HomeView from './components/HomeView';
import CollectionsView from './components/CollectionsView';
import DesignView from './components/DesignView';
import ProductDetailView from './components/ProductDetailView';
import OrderManagementView from './components/OrderManagementView';
import CartView from './components/CartView';
import CheckoutModal from './components/CheckoutModal';
import CollectionDetailView from './components/CollectionDetailView';
import ComparisonView from './components/ComparisonView';
import OrderSuccessView from './components/OrderSuccessView';
import LoginModal from './components/LoginModal';
import CustomizationModal from './components/CustomizationModal';
import WishlistView from './components/WishlistView';
import AdminPortal from './components/AdminPortal'; // New Import
import { PRODUCTS, PRODUCT_DETAILS } from './constants';
import { Page, ProductDetail, CartItem, Language, Order } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentLang, setCurrentLang] = useState<Language>('zh');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Wishlist State
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Customization State
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [customizationProduct, setCustomizationProduct] = useState('');

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);

  // Comparison State
  const [comparisonList, setComparisonList] = useState<ProductDetail[]>([]);

  // Helper to switch pages
  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'product-detail') {
        setSelectedProductId(null);
    }
  };

  const handleProductClick = (productId: string) => {
      setSelectedProductId(productId);
      setCurrentPage('product-detail');
  };

  // Auth Guard Helper
  const checkAuth = (action: () => void) => {
      if (isLoggedIn) {
          action();
      } else {
          setShowLoginModal(true);
      }
  };

  const handleLogin = () => {
      setIsLoggedIn(true);
      setShowLoginModal(false);
  };

  const startCheckout = (items: CartItem[], total: number) => {
      checkAuth(() => {
          setCheckoutItems(items);
          setCheckoutTotal(total);
          setIsCheckoutOpen(true);
      });
  };

  const handleCheckoutConfirm = () => {
      // Simulate ID generation
      const newOrderId = `ORD${Date.now()}`;
      setLastOrderId(newOrderId);
      setIsCheckoutOpen(false);
      setCurrentPage('order-success');
  };

  // Logic to get product details, fallback to generic info if no detailed mock exists
  const getProductDetail = (id: string): ProductDetail => {
      if (PRODUCT_DETAILS[id]) return PRODUCT_DETAILS[id];
      // Fallback for items without specific details mock
      const basic = PRODUCTS.find(p => p.id === id);
      if (!basic) return PRODUCT_DETAILS['1']; // fallback safety
      
      return {
          ...basic,
          description: "这款产品体现了自然主义的核心美学，简约而不简单。",
          images: [basic.imageUrl, basic.imageUrl, basic.imageUrl],
          specs: [
              { id: 's1', name: '标准版', price: basic.price, originalPrice: basic.price * 1.1, dimensions: '常规尺寸' }
          ],
          materials: [
              { id: 'm1', group: 'Basic', name: '默认材质', type: 'fabric', thumbnail: 'https://placehold.co/100x100/CCCCCC/FFFFFF?text=Def' }
          ]
      };
  };

  const addToCompare = (product: ProductDetail) => {
      if (comparisonList.length >= 4) {
          alert('最多只能对比4个商品');
          return;
      }
      if (comparisonList.some(p => p.id === product.id)) {
          alert('该商品已在对比栏中');
          return;
      }
      setComparisonList(prev => [...prev, product]);
      setCurrentPage('comparison');
  };

  const removeFromCompare = (id: string) => {
      setComparisonList(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerateOrder = (order: Order) => {
      // Check auth before order generation if from collections
      checkAuth(() => {
        console.log('Generated Order:', order);
        setLastOrderId(order.id);
        setCurrentPage('order-success');
      });
  };

  // Wishlist Logic
  const toggleWishlist = (id: string) => {
      setWishlist(prev => 
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
  };

  const getWishlistProducts = () => {
      return PRODUCTS.filter(p => wishlist.includes(p.id));
  };

  // Customization Logic
  const handleRequestCustomization = (productName: string) => {
      checkAuth(() => {
          setCustomizationProduct(productName);
          setShowCustomizationModal(true);
      });
  };

  const handleBookService = (serviceName: string) => {
      checkAuth(() => {
          // In real app, open booking modal
          alert(`已收到您的"${serviceName}"预约申请，客服稍后联系您。`);
      });
  };

  // RENDER ADMIN PORTAL EXCLUSIVELY IF ON ADMIN PAGE
  if (currentPage === 'admin') {
      return <AdminPortal onExit={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-stone-50 text-primary">
      {currentPage !== 'collection-detail' && (
          <Header 
            currentPage={currentPage} 
            setCurrentPage={handlePageChange}
            currentLang={currentLang}
            setLang={setCurrentLang}
            isLoggedIn={isLoggedIn}
            onLoginClick={() => setShowLoginModal(true)}
            wishlistCount={wishlist.length}
          />
      )}
      
      <main className="flex-1">
        {currentPage === 'home' && <HomeView setCurrentPage={handlePageChange} onProductClick={handleProductClick} />}
        {currentPage === 'shop' && <ShopView onProductClick={handleProductClick} />}
        {currentPage === 'collections' && <CollectionsView setCurrentPage={handlePageChange} />}
        {currentPage === 'design' && <DesignView onBookService={handleBookService} />}
        {currentPage === 'orders' && <OrderManagementView />}
        {currentPage === 'cart' && <CartView onCheckout={startCheckout} />}
        {currentPage === 'wishlist' && (
            <WishlistView 
                products={getWishlistProducts()} 
                onRemove={(id) => toggleWishlist(id)}
                onViewProduct={handleProductClick}
            />
        )}
        {currentPage === 'collection-detail' && (
            <CollectionDetailView 
                onBack={() => handlePageChange('collections')} 
                onGenerateOrder={handleGenerateOrder}
                onQuickView={handleProductClick} 
            />
        )}
        {currentPage === 'product-detail' && selectedProductId && (
            <ProductDetailView 
                product={getProductDetail(selectedProductId)} 
                onBack={() => handlePageChange('shop')}
                setCurrentPage={handlePageChange}
                onAddToCompare={addToCompare}
                onCheckout={startCheckout}
                isWishlisted={wishlist.includes(selectedProductId)}
                onToggleWishlist={toggleWishlist}
                onRequestCustomization={handleRequestCustomization}
                isLoggedIn={isLoggedIn}
                onRequireLogin={() => setShowLoginModal(true)}
            />
        )}
        {currentPage === 'comparison' && (
            <ComparisonView 
                products={comparisonList} 
                onRemove={removeFromCompare} 
                onClear={() => setComparisonList([])}
            />
        )}
        {currentPage === 'order-success' && (
            <OrderSuccessView 
                orderId={lastOrderId}
                setCurrentPage={handlePageChange}
            />
        )}
      </main>
      
      {/* Footer - Hide on collection detail for immersion */}
      {currentPage !== 'collection-detail' && (
        <footer className="border-t border-stone-200 bg-white py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div>
                    <h4 className="font-serif font-bold text-lg mb-4 text-primary">XiaoDi Yanxuan</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">致力于为您甄选全球顶级设计家具，<br/>打造独一无二的自然居家美学。</p>
                </div>
                <div className="md:col-span-2 flex flex-col md:flex-row justify-end items-center gap-6 text-sm text-stone-500">
                    <a href="#" className="hover:text-primary transition-colors">关于我们</a>
                    <a href="#" className="hover:text-primary transition-colors">配送服务</a>
                    <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
                    <span>© 2024 XiaoDi Yanxuan.</span>
                </div>
            </div>
        </footer>
      )}

      <GeminiChat products={PRODUCTS} />
      
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={checkoutItems}
        totalAmount={checkoutTotal}
        onConfirm={handleCheckoutConfirm}
      />

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <CustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        productName={customizationProduct}
      />
    </div>
  );
};

export default App;
