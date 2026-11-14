export interface SeedProduct {
  id: string;
  name: string;
  category: 'COFFEE' | 'TEA' | 'ICE_BLENDED' | 'SNACK';
  price: number;
  imageUrl: string;
  description: string;
  stock: number;
  sizeOptions: { size: 'S' | 'M' | 'L'; extraPrice: number }[];
  toppingOptions: { id: string; name: string; price: number }[];
}

export const INITIAL_PRODUCTS: SeedProduct[] = [
  {
    id: 'prod_cf_01',
    name: 'Cà Phê Sữa Đá Sài Gòn',
    category: 'COFFEE',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    description: 'Hương vị cà phê Robusta Buôn Ma Thuột đậm đà kết hợp cùng sữa đặc béo ngậy thơm ngon truyền thống.',
    stock: 50,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 5000 },
      { size: 'L', extraPrice: 10000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_02', name: 'Lớp Kem Phô Mai (Cheese)', price: 10000 },
      { id: 'top_03', name: 'Thạch Cà Phê Đậm Vị', price: 8000 },
    ],
  },
  {
    id: 'prod_cf_02',
    name: 'Americano Đá Tỉnh Táo',
    category: 'COFFEE',
    price: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80',
    description: 'Gấp đôi shot espresso Arabica thơm ngát thanh thoát, kéo dài bằng nước mát tinh khiết giúp bạn tập trung làm việc.',
    stock: 40,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 5000 },
      { size: 'L', extraPrice: 10000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_04', name: 'Thêm 1 Shot Espresso', price: 12000 },
    ],
  },
  {
    id: 'prod_cf_03',
    name: 'Cappuccino Kem Sữa Nghệ Thuật',
    category: 'COFFEE',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    description: 'Espresso hòa quyện hoàn hảo cùng sữa tươi thanh trùng đánh bọt mịn như nhung và phủ bột ca cao nguyên chất.',
    stock: 30,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 6000 },
      { size: 'L', extraPrice: 12000 },
    ],
    toppingOptions: [
      { id: 'top_02', name: 'Lớp Kem Phô Mai (Cheese)', price: 10000 },
      { id: 'top_05', name: 'Bột Quế Hữu Cơ', price: 5000 },
    ],
  },
  {
    id: 'prod_cf_04',
    name: 'Caramel Macchiato Hảo Hạng',
    category: 'COFFEE',
    price: 48000,
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    description: 'Sự cân bằng tinh tế giữa vani dịu ngọt, sữa tươi béo ngậy, cà phê espresso đậm đà và sốt caramel hảo hạng phủ trên cùng.',
    stock: 25,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 6000 },
      { size: 'L', extraPrice: 12000 },
    ],
    toppingOptions: [
      { id: 'top_02', name: 'Lớp Kem Phô Mai (Cheese)', price: 10000 },
      { id: 'top_06', name: 'Sốt Caramel Thêm', price: 6000 },
    ],
  },
  {
    id: 'prod_tea_01',
    name: 'Trà Đào Cam Sả Tươi Mát',
    category: 'TEA',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    description: 'Trà ủ lạnh hương đào thanh nhẹ, kết hợp cam vàng mọng nước và sả tươi đập dập thơm lừng giải nhiệt tức thì.',
    stock: 35,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 5000 },
      { size: 'L', extraPrice: 10000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_07', name: 'Miếng Đào Giòn Thêm (3 miếng)', price: 10000 },
      { id: 'top_08', name: 'Hạt Chia Hữu Cơ', price: 6000 },
    ],
  },
  {
    id: 'prod_tea_02',
    name: 'Trà Ô Long Sen Vàng Macchiato',
    category: 'TEA',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Trà ô long thượng hạng đượm khói nhẹ, kết hợp hạt sen bùi béo ninh mềm và lớp macchiato mặn mà khó cưỡng.',
    stock: 20,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 5000 },
      { size: 'L', extraPrice: 10000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_02', name: 'Lớp Kem Phô Mai (Cheese)', price: 10000 },
      { id: 'top_09', name: 'Hạt Sen Hầm Đường Phèn', price: 10000 },
    ],
  },
  {
    id: 'prod_ice_01',
    name: 'Matcha Đá Xay Kem Tuyết',
    category: 'ICE_BLENDED',
    price: 52000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    description: 'Bột Matcha Uji chuẩn Nhật Bản xay nhuyễn cùng sữa tươi và đá tuyết, phủ kem whipping bông xốp cao cấp.',
    stock: 15,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 7000 },
      { size: 'L', extraPrice: 14000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_10', name: 'Đậu Đỏ Ngọt Ngào', price: 8000 },
    ],
  },
  {
    id: 'prod_ice_02',
    name: 'Chocolate Bỉ Đá Xay Hạnh Nhân',
    category: 'ICE_BLENDED',
    price: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    description: 'Socola Bỉ 70% đậm vị quyến rũ kết hợp lát hạnh nhân giòn rụm và sốt fudge ngọt bùi say mê.',
    stock: 10,
    sizeOptions: [
      { size: 'S', extraPrice: 0 },
      { size: 'M', extraPrice: 7000 },
      { size: 'L', extraPrice: 14000 },
    ],
    toppingOptions: [
      { id: 'top_01', name: 'Trân Châu Trắng', price: 8000 },
      { id: 'top_02', name: 'Lớp Kem Phô Mai (Cheese)', price: 10000 },
    ],
  },
];
