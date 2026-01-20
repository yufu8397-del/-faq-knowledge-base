export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  helpful_count: number;
}

export type Category = string;
