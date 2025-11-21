import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    company: [
      { name: '关于我们', path: '/about' },
      { name: '联系我们', path: '/contact' },
      { name: '加入我们', path: '/careers' },
      { name: '新闻资讯', path: '/news' },
    ],
    service: [
      { name: '设计服务', path: '/design-service' },
      { name: '配送安装', path: '/delivery' },
      { name: '售后服务', path: '/after-sales' },
      { name: '常见问题', path: '/faq' },
    ],
    help: [
      { name: '购物指南', path: '/guide' },
      { name: '支付方式', path: '/payment' },
      { name: '退换货政策', path: '/refund-policy' },
      { name: '隐私政策', path: '/privacy' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* 公司信息 */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">家</span>
              </div>
              <span className="text-xl font-bold text-white">品质家居</span>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              致力于为每个家庭提供高品质、高性价比的家居产品和专业的设计服务。
              让每个人都能拥有理想中的家。
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>400-888-8888</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@furniture.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>广东省深圳市南山区科技园</span>
              </div>
            </div>
          </div>

          {/* 公司 */}
          <div>
            <h3 className="text-white font-semibold mb-4">公司</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 服务 */}
          <div>
            <h3 className="text-white font-semibold mb-4">服务</h3>
            <ul className="space-y-2">
              {footerLinks.service.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 帮助 */}
          <div>
            <h3 className="text-white font-semibold mb-4">帮助</h3>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 社交媒体 */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 品质家居. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

