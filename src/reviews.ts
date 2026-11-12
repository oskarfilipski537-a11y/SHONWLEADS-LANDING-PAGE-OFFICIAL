import { ReviewItem, StatItem } from './types.ts';

/**
 * ============================================================================
 * PLACEHOLDER METRICS (STAT BAR ABOVE REVIEWS)
 * ============================================================================
 */
export const STAT_BAR_METRICS: StatItem[] = [
  {
    id: "stat-1",
    value: "$0",
    label: "Cost on No-Shows",
    subtext: "Pay zero when homeowners miss the estimate"
  },
  {
    id: "stat-2",
    value: "100%",
    label: "Pay Only When They Show",
    subtext: "You're billed only when the homeowner meets your estimator."
  },
  {
    id: "stat-3",
    value: "1+ Crew",
    label: "Target Contractor Capacity",
    subtext: "Built specifically for growth-minded crews"
  }
];

/**
 * ============================================================================
 * CONTRACTOR REVIEWS & TESTIMONIALS
 * ============================================================================
 * Exact copy and card layout matching the approved contractor gallery showcase.
 */
export const CONTRACTOR_REVIEWS: ReviewItem[] = [
  {
    id: "review-1",
    name: "MARK CALLAHAN",
    company: "Callahan Custom Kitchens",
    trade: "Kitchen Remodeling",
    photoUrl: "https://res.cloudinary.com/diwxs2xe8/image/upload/v1792854944/Image_24_ppwwz3.jpg",
    quote: "“ShownLeads completely filled our calendar with high-budget homeowners. We closed 11 full kitchen renovations in our first month without touching a cold lead.”",
    metricTag: "32 shown estimates",
    rating: 5
  },
  {
    id: "review-2",
    name: "DAVID MILLER",
    company: "Miller Roofing & Exteriors",
    trade: "Metal Roofing",
    photoUrl: "https://res.cloudinary.com/diwxs2xe8/image/upload/v1792854408/Image_20_vuryj6.jpg",
    quote: "“Every single appointment showed up prepared with their budget ready. We locked in 9 high-ticket metal roof replacements within 4 weeks.”",
    metricTag: "26 shown estimates",
    rating: 5
  },
  {
    id: "review-3",
    name: "THOMAS & ELENA VANCE",
    company: "Vance Luxury Design",
    trade: "Bathroom Remodeling",
    photoUrl: "https://res.cloudinary.com/diwxs2xe8/image/upload/v1792854409/Image_19_wejrmg.jpg",
    quote: "“The human setters are a game changer. We got 21 vetted sit-downs and converted 8 luxury master bathroom remodels immediately.”",
    metricTag: "21 shown estimates",
    rating: 5
  },
  {
    id: "review-4",
    name: "ROBERT KOWALSKI",
    company: "Apex Surface & Flatwork",
    trade: "Epoxy & Concrete",
    photoUrl: "https://res.cloudinary.com/diwxs2xe8/image/upload/v1792854408/Image_17_w0msvz.jpg",
    quote: "“Zero tire-kickers or bargain hunters. 34 confirmed homeowner sits resulted in 12 concrete driveway and epoxy projects on our books.”",
    metricTag: "34 shown estimates",
    rating: 5
  }
];
