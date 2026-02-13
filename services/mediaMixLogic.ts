
import { 
  MediaMixInput, 
  MediaMixResult, 
  MediaMixLine, 
  CatalogItem,
  Booking
} from '../types';

export const parseImpressions = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/,/g, '');
  const match = cleaned.match(/([\d.]+)(만|천)?/);
  if (!match) return 0;
  let num = parseFloat(match[1]);
  if (match[2] === '만') num *= 10000;
  if (match[2] === '천') num *= 1000;
  return num;
};

/**
 * 10만 단위 올림 처리 함수
 */
const roundUpTo100k = (val: number): number => {
  return Math.ceil(val / 100000) * 100000;
};

/**
 * 특정 기간 동안 해당 상품의 가용 구좌 확인
 */
const checkAvailability = (
  productId: string, 
  totalSlots: number, 
  startDate: string, 
  days: number, 
  bookings: Booking[]
): number => {
  if (!startDate) return totalSlots;
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);

  let maxUsedInPeriod = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const currentStr = d.toISOString().split('T')[0];
    const usedToday = bookings
      .filter(b => b.productId === productId && currentStr >= b.start_date && currentStr <= b.end_date)
      .reduce((acc, curr) => acc + curr.slots_used, 0);
    maxUsedInPeriod = Math.max(maxUsedInPeriod, usedToday);
  }

  return totalSlots - maxUsedInPeriod;
};

export const createLine = (item: CatalogItem, days: number): MediaMixLine => {
  const scale = days / 28;
  // 계산 후 10만 단위 올림 적용
  const price_actual = roundUpTo100k(item.price_4w * scale);
  const numeric_4w = parseImpressions(item.impressions_4w);
  const scaled_numeric = Math.floor(numeric_4w * scale);
  
  let impressions_actual_text = "";
  if (typeof item.impressions_4w === 'string' && numeric_4w > 0) {
    impressions_actual_text = `${item.impressions_4w} (x${days}/28d)`;
  } else {
    impressions_actual_text = `${scaled_numeric.toLocaleString()}`;
  }

  return {
    ...item,
    days,
    price_actual,
    impressions_actual_text,
    impressions_numeric: scaled_numeric
  };
};

export const generateMediaMix = (input: MediaMixInput): MediaMixResult => {
  const { budget_total, catalog, priority_order, discount, duration_days, start_date, rules, existing_bookings } = input;
  const selectedLines: MediaMixLine[] = [];
  let currentSubtotal = 0;

  // 우선순위에 따라 카탈로그 정렬
  const sortedCatalog = [...catalog].sort((a, b) => {
    const idxA = priority_order.indexOf(a.id);
    const idxB = priority_order.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const tempBookings = [...existing_bookings];

  // 제안 엔진
  for (const item of sortedCatalog) {
    if (selectedLines.length >= rules.max_lines) break;

    const available = checkAvailability(item.id, item.total_slots, start_date, duration_days, tempBookings);
    if (available <= 0) continue;

    const line = createLine(item, duration_days);
    if (currentSubtotal + line.price_actual <= budget_total) {
      selectedLines.push(line);
      currentSubtotal += line.price_actual;
      
      const end = new Date(start_date);
      end.setDate(end.getDate() + duration_days);
      tempBookings.push({
        id: `proposed-${item.id}`,
        productId: item.id,
        clientName: 'Proposed',
        start_date: start_date,
        end_date: end.toISOString().split('T')[0],
        slots_used: 1
      });
    }
  }

  return calculateResult(selectedLines, budget_total, discount.rate || 0, duration_days);
};

export const calculateResult = (lines: MediaMixLine[], budget_total: number, discountRate: number, duration_days: number): MediaMixResult => {
  const subtotal = lines.reduce((sum, l) => sum + l.price_actual, 0);
  const discount_applied = Math.floor(subtotal * (discountRate / 100));
  const discounted_subtotal = Math.max(0, subtotal - discount_applied);
  const residual = budget_total - discounted_subtotal;
  const residual_percent = budget_total > 0 ? (residual / budget_total) * 100 : 0;

  return {
    lines,
    subtotal,
    discount_applied,
    discount_label: discountRate > 0 ? `할인 (${discountRate}%)` : "없음",
    discounted_subtotal,
    residual,
    residual_percent,
    total_days: duration_days
  };
};
