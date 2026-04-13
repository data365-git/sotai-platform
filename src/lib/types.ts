import type { Lead, SalesRep, Transcript, Review, Checklist, ChecklistItem, CallRecording, LeadStatus, ItemType } from '@prisma/client'

export type { LeadStatus, ItemType }

export interface TranscriptLine {
  timestamp: number
  speaker: string
  speakerRole: 'rep' | 'lead'
  text: string
}

export interface VerdictItem {
  verdict: 'pass' | 'fail' | 'unclear'
  reasoning: string
  manualOverride: boolean
}

export interface VerdictMap {
  [itemId: string]: VerdictItem
}

export interface AnalyticsKPIs {
  totalCalls: number
  avgScore: number
  passRate: number
  mostActiveRep: string
}

export interface RepPerformance {
  repId: string
  repName: string
  avgScore: number
  callCount: number
}

export interface ScoreTrendPoint {
  date: string
  avgScore: number
}

export interface FailingItem {
  itemText: string
  failCount: number
  checklistName: string
}

export interface RepSummary {
  id: string
  name: string
  callCount: number
  avgScore: number
}

export interface AnalyticsPayload {
  kpis: AnalyticsKPIs
  repPerformance: RepPerformance[]
  scoreTrend: ScoreTrendPoint[]
  failingItems: FailingItem[]
  reps: RepSummary[]
}

export type CallRecordingWithRelations = CallRecording & {
  transcript: Transcript | null
  reviews: ReviewWithRelations[]
}

export type LeadWithRelations = Lead & {
  rep: SalesRep
  recordings: CallRecordingWithRelations[]
}

export type ReviewWithRelations = Review & {
  checklist: Checklist & {
    items: ChecklistItem[]
  }
  reviewer?: SalesRep | null
}

export interface Filters {
  search?: string
  repId?: string
  status?: LeadStatus | LeadStatus[]
  scoreMin?: number
  scoreMax?: number
  dateFrom?: string
  dateTo?: string
}

export interface LeadListItem {
  id: string
  name: string
  phone: string
  repId: string
  rep: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  latestCallDate: string | null
  totalDuration: number
  recordingCount: number
  status: LeadStatus
  bitrix24Id: string | null
  bitrix24Status: string | null
  latestScore: number | null
  latestChecklistName: string | null
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[]
}

export interface SettingsData {
  id: number
  bitrix24WebhookUrl: string | null
  defaultChecklistId: string | null
  aiProvider: string
  aiModel: string
  scorePassThreshold: number
  reviewerSignature: string | null
  updatedAt: string
}
