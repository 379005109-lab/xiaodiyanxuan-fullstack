import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Edit2, Trash2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import axios from '@/lib/axios'

interface Address {
  _id: string
  name: string
  phone: string
  address: string
  isDefault: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', isDefault: false })
  const [saving, setSaving] = useState(false)
  const { token, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      navigate('/')
      return
    }
    loadAddresses()
  }, [isAuthenticated])

  const loadAddresses = async () => {
    try {
      const data: any = await axios.get('/addresses')
      setAddresses(data?.data || [])
    } catch (e) {
      console.error('加载地址失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      toast.error('请填写完整信息')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await axios.put(`/addresses/${editingId}`, form)
      } else {
        await axios.post('/addresses', form)
      }

      toast.success(editingId ? '地址更新成功' : '地址添加成功')
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', phone: '', address: '', isDefault: false })
      loadAddresses()
    } catch (e) {
      toast.error('操作失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (addr: Address) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      isDefault: addr.isDefault
    })
    setEditingId(addr._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个地址吗？')) return
    try {
      await axios.delete(`/addresses/${id}`)
      toast.success('地址已删除')
      loadAddresses()
    } catch (e) {
      toast.error('删除失败')
    }
  }

  const setDefault = async (id: string) => {
    try {
      await axios.put(`/addresses/${id}/default`, {})
      toast.success('已设为默认地址')
      loadAddresses()
    } catch (e) {
      toast.error('操作失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的地址</h1>
            <p className="text-gray-500 text-sm">管理您的收货地址</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setForm({ name: '', phone: '', address: '', isDefault: false })
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-900"
          >
            <Plus className="w-4 h-4" /> 添加地址
          </button>
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">{editingId ? '编辑地址' : '新增地址'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">收货人</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="请输入收货人姓名"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">手机号</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">详细地址</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
                  placeholder="请输入详细地址"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-600">设为默认地址</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-900 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无收货地址</p>
              <p className="text-sm text-gray-400 mt-1">点击上方按钮添加新地址</p>
            </div>
          ) : (
            addresses.map(addr => (
              <div key={addr._id} className={`bg-white rounded-xl shadow-sm border p-4 ${addr.isDefault ? 'border-primary' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold">{addr.name}</span>
                      <span className="text-gray-500">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">默认</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{addr.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefault(addr._id)}
                        className="text-xs text-gray-500 hover:text-primary px-2 py-1"
                      >
                        设为默认
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(addr)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
