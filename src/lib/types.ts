/**
 * Shared shapes for discovery records. These were previously duplicated in the
 * discovery page and each Add modal, which meant adding a field to one left the
 * others structurally incompatible.
 */

export interface InsightItem {
  id: string;
  productArea: string;
  theme: string;
  persona?: string | null;
  oneLiner: string;
  content?: string | null;
  client?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  date?: string | null;
  wtp?: string | null;
  /** The free-text client this arrived with, when a remap replaced it. */
  clientRaw?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  commentCount?: number;
}

export interface Question {
  id: string;
  productArea: string;
  theme: string;
  persona: string | null;
  question: string;
  notesIntent: string | null;
  source: string | null;
  createdBy: string | null;
}

export interface Source {
  id: string;
  name: string;
  productArea: string;
  format: string | null;
  date: string | null;
  topics: string | null;
  link: string | null;
  notes: string | null;
  createdBy: string | null;
}
