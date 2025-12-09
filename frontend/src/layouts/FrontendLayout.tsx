import { Outlet } from 'react-router-dom'
import Header from '@/components/frontend/Header'
import Footer from '@/components/frontend/Footer'
import ContactFloat from '@/components/frontend/ContactFloat'
import CompareModal from '@/components/frontend/CompareModal'

export default function FrontendLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ContactFloat />
      <CompareModal />
    </div>
  )
}

