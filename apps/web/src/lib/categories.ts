import { Product } from '@/types';

// Tên hiển thị duy nhất cho mỗi danh mục, dùng chung cho tab lọc và nhãn trên thẻ món
export const CATEGORY_LABELS: Record<Product['category'], string> = {
  COFFEE: 'Cà phê',
  TEA: 'Trà trái cây',
  ICE_BLENDED: 'Đá xay',
  SNACK: 'Bánh ngọt',
};

export const CATEGORY_FILTERS: { id: 'ALL' | Product['category']; label: string }[] = [
  { id: 'ALL', label: 'Tất cả món' },
  { id: 'COFFEE', label: CATEGORY_LABELS.COFFEE },
  { id: 'TEA', label: CATEGORY_LABELS.TEA },
  { id: 'ICE_BLENDED', label: CATEGORY_LABELS.ICE_BLENDED },
];
