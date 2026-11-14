const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('brewlite_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export const api = {
  // 1. Products
  async getProducts(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Không thể tải danh sách sản phẩm');
    }
    return res.json();
  },

  async getProductById(id: string) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) {
      throw new Error('Không thể tải chi tiết sản phẩm');
    }
    return res.json();
  },

  // Mã giảm giá: backend kiểm tra mã và tính số tiền giảm cho tạm tính hiện tại (FR-09)
  async quotePromotion(
    code: string,
    subtotal: number,
  ): Promise<{ code: string; description: string; discountAmount: number; finalAmount: number }> {
    const res = await fetch(
      `${API_BASE_URL}/promotions/${encodeURIComponent(code)}?subtotal=${Math.round(subtotal)}`,
    );
    const result = await res.json();
    if (!res.ok) {
      const message = Array.isArray(result.message) ? result.message[0] : result.message;
      throw new Error(message || 'Mã ưu đãi không hợp lệ hoặc đã hết hạn');
    }
    return result;
  },

  // 2. Auth
  async register(data: { email: string; password: string; fullName: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Đăng ký thất bại');
    }
    return result;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Đăng nhập thất bại');
    }
    return result;
  },

  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new Error('Chưa đăng nhập hoặc phiên làm việc hết hạn');
    }
    return res.json();
  },

  // 3. Orders
  async createOrder(data: {
    items: {
      productId: string;
      size: 'S' | 'M' | 'L';
      toppingIds: string[];
      qty: number;
    }[];
    promotionCode?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Tạo đơn hàng thất bại');
    }
    return result;
  },

  // Màn hình quầy (KDS) của nhân viên: toàn bộ đơn của cửa hàng
  async getAllOrders() {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: { ...getAuthHeader() },
    });
    if (res.status === 401) {
      throw new Error('Vui lòng đăng nhập để xem danh sách đơn quầy');
    }
    if (res.status === 403) {
      throw new Error('Chỉ tài khoản nhân viên quầy mới xem được danh sách đơn');
    }
    if (!res.ok) {
      throw new Error('Không thể tải danh sách đơn quầy');
    }
    return res.json();
  },

  async getMyOrders() {
    const res = await fetch(`${API_BASE_URL}/orders/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new Error('Không thể tải lịch sử đơn hàng');
    }
    return res.json();
  },

  async getOrderById(id: string) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new Error('Không thể tìm thấy thông tin đơn hàng');
    }
    return res.json();
  },

  async cancelOrder(id: string) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Hủy đơn hàng thất bại');
    }
    return result;
  },

  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Chuyển trạng thái thất bại');
    }
    return result;
  },

  // 4. Payments
  async processPayment(data: {
    orderId: string;
    method: 'MOMO' | 'VNPAY' | 'CARD';
    amount: number;
    idempotencyKey?: string;
    simulateFailure?: boolean;
  }) {
    const key =
      data.idempotencyKey ||
      `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
        ...getAuthHeader(),
      },
      body: JSON.stringify({ ...data, idempotencyKey: key }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Giao dịch thanh toán thất bại');
    }
    return result;
  },
};
