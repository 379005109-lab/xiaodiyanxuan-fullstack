export const mockInvoices = [
  {
    id: '1',
    type: 'personal' as const,
    title: '张三',
    taxNumber: '',
    email: 'zhangsan@example.com',
    isDefault: true
  },
  {
    id: '2',
    type: 'company' as const,
    title: '深圳市科技有限公司',
    taxNumber: '91440300MA5XXXXX',
    bankName: '中国工商银行深圳科技园支行',
    bankAccount: '4000 0200 0920 1234 567',
    address: '深圳市南山区科技园南区',
    phone: '0755-88888888',
    email: 'finance@company.com',
    isDefault: false
  },
  {
    id: '3',
    type: 'company' as const,
    title: '广州贸易发展有限公司',
    taxNumber: '91440100MA5YYYYY',
    bankName: '中国建设银行广州天河支行',
    bankAccount: '4367 4200 1234 5678 901',
    address: '广州市天河区珠江新城',
    phone: '020-66666666',
    email: 'invoice@trade.com',
    isDefault: false
  }
];