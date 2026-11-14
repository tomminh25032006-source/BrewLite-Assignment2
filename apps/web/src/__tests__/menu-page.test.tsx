import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MenuPage from '@/app/menu/page';
import { api } from '@/services/api';

jest.mock('next/navigation', () => ({
  usePathname: () => '/menu',
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/services/api', () => ({
  api: { getProducts: jest.fn() },
}));

const getProducts = api.getProducts as jest.Mock;

const latte = {
  id: 'prod_cf_01',
  name: 'Cà Phê Sữa Đá Sài Gòn',
  category: 'COFFEE',
  price: 35000,
  imageUrl: 'https://example.com/cf.jpg',
  description: 'Robusta Buôn Ma Thuột',
  stock: 50,
  version: 0,
  isActive: true,
  sizeOptions: [{ size: 'S', extraPrice: 0 }],
  toppingOptions: [],
};

// FE-T01: Màn hình menu mobile-first với trạng thái loading / empty / error (Task 4.3)
describe('FE-T01 Menu page', () => {
  beforeEach(() => getProducts.mockReset());

  it('hiển thị skeleton khi đang tải rồi hiển thị danh sách món', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    getProducts.mockReturnValue(new Promise((r) => (resolve = r)));

    const { container } = render(<MenuPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    resolve([latte]);
    expect(await screen.findByText('Cà Phê Sữa Đá Sài Gòn')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(0);
  });

  it('hiển thị empty state khi không có món phù hợp', async () => {
    getProducts.mockResolvedValue([]);
    render(<MenuPage />);
    expect(await screen.findByText('Chưa tìm thấy món phù hợp')).toBeInTheDocument();
  });

  it('hiển thị error state và cho phép thử lại', async () => {
    getProducts.mockRejectedValueOnce(new Error('Không thể tải danh sách sản phẩm'));
    render(<MenuPage />);

    expect(await screen.findByText('Không thể tải thực đơn')).toBeInTheDocument();
    expect(screen.getByText('Không thể tải danh sách sản phẩm')).toBeInTheDocument();

    getProducts.mockResolvedValueOnce([latte]);
    fireEvent.click(screen.getByText('Thử lại kết nối'));
    await waitFor(() => expect(screen.getByText('Cà Phê Sữa Đá Sài Gòn')).toBeInTheDocument());
  });

  it('lọc theo danh mục gọi lại API với category tương ứng', async () => {
    getProducts.mockResolvedValue([latte]);
    render(<MenuPage />);
    await screen.findByText('Cà Phê Sữa Đá Sài Gòn');

    fireEvent.click(screen.getByText('Trà trái cây'));
    await waitFor(() => expect(getProducts).toHaveBeenLastCalledWith('TEA', ''));
  });
});
