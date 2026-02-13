
export interface CatalogItem {
  id: string; // 상품 식별자 추가
  screen: string;
  placement: string;
  size: string;
  ad_type: string;
  price_4w: number;
  rotation: string;
  total_slots: number; // 총 구좌수
  impressions_4w: string | number;
  ctr: string;
}

export interface Booking {
  id: string;
  productId: string;
  clientName: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  slots_used: number;
}

export interface DiscountConfig {
  type: 'none' | 'package' | 'longterm';
  amount?: number;
  rate?: number;
}

export interface Rules {
  min_total_weeks: number;
  line_week_options: number[];
  allow_duplicate_lines: boolean;
  max_lines: number;
  must_include?: string[];
  big_residual_threshold: number;
}

export interface MediaMixInput {
  budget_total: number;
  catalog: CatalogItem[];
  priority_order: string[];
  commission_rate: number;
  discount: DiscountConfig;
  duration_days: number;
  start_date: string; // 캠페인 시작일
  rules: Rules;
  existing_bookings: Booking[]; // 부킹 현황 데이터
}

export interface MediaMixLine extends CatalogItem {
  days: number;
  price_actual: number;
  impressions_actual_text: string;
  impressions_numeric: number;
}

export interface MediaMixResult {
  lines: MediaMixLine[];
  subtotal: number;
  discount_applied: number;
  discount_label: string;
  discounted_subtotal: number;
  residual: number;
  residual_percent: number;
  total_days: number;
}
