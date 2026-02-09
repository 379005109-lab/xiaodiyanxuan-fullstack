import HeroBanner from './components/HeroBanner';
import BargainZone from './components/BargainZone';
import RecommendProducts from './components/RecommendProducts';
import SpaceInspiration from './components/SpaceInspiration';
import FeaturedProducts from './components/FeaturedProducts';
import ShopInfoCard from './components/ShopInfoCard';
import TabBar from '../../components/TabBar';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white pb-[60px]">
      {/* 全宽 Hero 轮播 - 突破容器左右边距，铺满屏幕 */}
      <div className="-mx-0 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <HeroBanner />
      </div>

      {/* 主内容区 */}
      <div className="space-y-0">
        {/* 砍价专区 */}
        <div className="px-4 pt-8 pb-6">
          <BargainZone />
        </div>

        {/* 1px 分割线 */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* 新品推荐 */}
        <div className="pt-8 pb-6">
          <RecommendProducts />
        </div>

        {/* 1px 分割线 */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* 空间灵感 */}
        <div className="pt-8 pb-6">
          <SpaceInspiration />
        </div>

        {/* 1px 分割线 */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* 精选好物 */}
        <div className="pt-8 pb-6">
          <FeaturedProducts />
        </div>

        {/* 1px 分割线 */}
        <div className="mx-4 border-t border-[#E5E5EA]" />

        {/* 店铺信息 */}
        <div className="pt-8 pb-8">
          <ShopInfoCard />
        </div>
      </div>

      {/* 底部 TabBar */}
      <TabBar />
    </div>
  );
};

export default HomePage;
