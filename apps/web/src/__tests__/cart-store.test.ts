import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types';

const latte: Product = {
  id: 'prod_cf_01',
  name: 'Cà Phê Sữa Đá',
  category: 'COFFEE',
  price: 35000,
  imageUrl: '',
  description: '',
  stock: 50,
  version: 0,
  isActive: true,
  // Phụ thu size lấy theo cấu hình từng món, không cố định 5k/10k
  sizeOptions: [
    { size: 'S', extraPrice: 0 },
    { size: 'M', extraPrice: 5000 },
    { size: 'L', extraPrice: 12000 },
  ],
  toppingOptions: [],
};
const cheese = { id: 'top_02', name: 'Kem Cheese', price: 10000 };

// FE-T02: Giỏ hàng và tính tổng tiền (FR-03)
describe('FE-T02 cartStore', () => {
  beforeEach(() => useCartStore.getState().clearCart());

  it('tính đơn giá theo size + topping và gộp cùng cấu hình', () => {
    const { addItem } = useCartStore.getState();
    addItem(latte, 'M', [cheese], 1);
    addItem(latte, 'M', [cheese], 2);

    const { items, getTotalItems, getSubtotal } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].unitPrice).toBe(50000);
    expect(getTotalItems()).toBe(3);
    expect(getSubtotal()).toBe(150000);
  });

  it('phụ thu size theo sizeOptions của sản phẩm (khớp giá backend)', () => {
    useCartStore.getState().addItem(latte, 'L', [], 1);
    expect(useCartStore.getState().items[0].unitPrice).toBe(35000 + 12000);
  });

  it('cập nhật số lượng về 0 thì xóa món, lưu xuống localStorage', () => {
    const { addItem } = useCartStore.getState();
    addItem(latte, 'S', [], 1);
    const id = useCartStore.getState().items[0].id;

    useCartStore.getState().updateQty(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('brewlite_cart')!)).toEqual([]);
  });
});
