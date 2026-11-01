export interface QuizAnswers {
  crews: string;
  extraEstimates: string;
  monthlyRevenue: string;
  monthlyRevenueIndex?: number;
  fullName: string;
  email: string;
  phone: string;
  consent: boolean;
  consentTimestamp: string;
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  page_url?: string;
  referrer?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  company: string;
  trade: string;
  avatarUrl?: string;
  photoUrl?: string;
  avatarInitial?: string;
  headline?: string;
  quote: string;
  metricTag?: string;
  rating: number; // 1-5
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  subtext?: string;
}

export interface ScreenshotItem {
  id: string;
  title: string;
  caption: string;
  contractorTrade: string;
  imageUrl?: string; // If left blank, styled WhatsApp mockup is rendered
  senderName: string;
  senderPhonePreview: string;
  messages: Array<{
    sender: 'contractor' | 'shownleads';
    text: string;
    time: string;
  }>;
}
