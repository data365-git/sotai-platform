'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Phone, ExternalLink, Phone as PhoneIcon, Calendar, Clock } from 'lucide-react'
import { useLeadDetail } from '@/hooks/useLeadDetail'
import { useChecklists } from '@/hooks/useChecklists'
import { TranscriptPanel } from '@/components/lead-detail/TranscriptPanel'
import { ReviewPanel } from '@/components/lead-detail/ReviewPanel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { formatDuration, formatDate, getInitials, getAvatarGradient } from '@/lib/utils'
import { useLocale } from '@/hooks/useLocale'

const AudioPlayer = dynamic(
  () => import('@/components/lead-detail/AudioPlayer').then((m) => m.AudioPlayer),
  { ssr: false, loading: () => <div className="shimmer" style={{ height: 120, borderRadius: 12 }} /> }
)

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { t } = useLocale()
  const { data: lead, isLoading: leadLoading } = useLeadDetail(id)
  const { data: allChecklists = [] } = useChecklists()

  const [selectedRecordingIdx, setSelectedRecordingIdx] = useState(0)
  const [currentAudioTime, setCurrentAudioTime] = useState(0)
  const [seekTo, setSeekTo] = useState<number | null>(null)

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentAudioTime(time)
  }, [])

  const handleTranscriptSeek = useCallback((t: number) => {
    setSeekTo(t)
    setTimeout(() => setSeekTo(null), 100)
  }, [])

  const handleRecordingChange = useCallback((idx: number) => {
    setSelectedRecordingIdx(idx)
    setCurrentAudioTime(0)
    setSeekTo(null)
  }, [])

  if (leadLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 380px', height: '100vh', overflow: 'hidden' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: 24, borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
            <LoadingSkeleton height={200} className="mb-4" />
            <LoadingSkeleton height={16} className="mb-2" />
            <LoadingSkeleton height={16} width="60%" className="mb-2" />
            <LoadingSkeleton height={16} width="80%" />
          </div>
        ))}
      </div>
    )
  }

  if (!lead) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <p style={{ color: '#64748b', fontSize: 14 }}>{t.common.notFound}</p>
        <button
          onClick={() => router.push('/')}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          {t.common.backToLeads}
        </button>
      </div>
    )
  }

  const recordings = lead.recordings ?? []
  const selectedRecording = recordings[selectedRecordingIdx] ?? null
  const transcript = selectedRecording?.transcript ?? null
  const transcriptLines = transcript?.lines ?? []
  const reviews = selectedRecording?.reviews ?? []

  // Aggregate totals for left panel
  const totalDuration = recordings.reduce((sum: number, r: any) => sum + (r.duration ?? 0), 0)
  const latestCallDate = recordings.length > 0
    ? recordings.reduce((latest: any, r: any) =>
        new Date(r.callDate) > new Date(latest.callDate) ? r : latest
      ).callDate
    : null

  const panelStyle = {
    height: '100vh',
    overflowY: 'auto' as const,
    borderRight: '1px solid rgba(0,0,0,0.06)',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 380px', height: '100vh', overflow: 'hidden' }}>
      {/* LEFT PANEL */}
      <div style={{ ...panelStyle, padding: '20px 20px 32px', background: '#f8fafc' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: 13, marginBottom: 20,
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={14} />
          {t.leadDetail.back}
        </button>

        {/* Avatar + Name */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
            background: getAvatarGradient(lead.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white',
          }}>
            {getInitials(lead.name)}
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>
            {lead.name}
          </h1>
          <StatusBadge status={lead.status} />
        </div>

        {/* Contact info */}
        <div style={{
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
        }}>
          <InfoRow icon={<Phone size={12} />} label={t.leadDetail.phone} value={lead.phone} />
          {latestCallDate && (
            <InfoRow icon={<Calendar size={12} />} label={t.leadDetail.lastCall} value={formatDate(latestCallDate)} />
          )}
          {totalDuration > 0 && (
            <InfoRow icon={<Clock size={12} />} label={t.leadDetail.total} value={formatDuration(totalDuration)} />
          )}
          <InfoRow icon={<PhoneIcon size={12} />} label={t.leadDetail.calls} value={`${recordings.length} ${recordings.length !== 1 ? t.leadDetail.calls_few : t.leadDetail.calls}`} />
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginBottom: 16 }} />

        {/* Sales Rep */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {t.leadDetail.salesRep}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: getAvatarGradient(lead.rep?.name || ''),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>
              {getInitials(lead.rep?.name || '?')}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{lead.rep?.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{lead.rep?.email}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginBottom: 16 }} />

        {lead.bitrix24Status && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {t.leadDetail.leadStatus}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{lead.bitrix24Status}</span>
          </div>
        )}

        <button
          disabled
          title="Connect Bitrix24 to open leads"
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.07)',
            color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: 0.6,
          }}
        >
          <ExternalLink size={13} />
          {t.leadDetail.openBitrix}
        </button>

        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <div style={{
            textAlign: 'center', padding: '6px 10px', borderRadius: 8,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.15)',
          }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.08em' }}>
              DEMO DATA
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div style={{ ...panelStyle, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Recording tab strip */}
        {recordings.length > 1 && (
          <div style={{
            display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.06)',
            overflowX: 'auto', background: '#f8fafc',
          }}>
            {recordings.map((rec: any, idx: number) => (
              <button
                key={rec.id}
                onClick={() => handleRecordingChange(idx)}
                style={{
                  padding: '10px 16px', flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: selectedRecordingIdx === idx
                    ? '2px solid #6366f1'
                    : '2px solid transparent',
                  color: selectedRecordingIdx === idx ? '#6366f1' : '#64748b',
                  fontSize: 12, fontWeight: selectedRecordingIdx === idx ? 600 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                Call {idx + 1}
                {rec.callDate && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                    {formatDate(rec.callDate)}
                  </span>
                )}
                {rec.duration > 0 && (
                  <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>
                    · {formatDuration(rec.duration)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '20px 24px 32px' }}>
          {/* Audio player */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title={t.leadDetail.callRecording} />
            {selectedRecording?.audioUrl ? (
              <AudioPlayer
                key={selectedRecording.id}
                audioUrl={selectedRecording.audioUrl}
                peaks={Array.isArray(selectedRecording.audioPeaks) ? selectedRecording.audioPeaks : undefined}
                onTimeUpdate={handleTimeUpdate}
                seekTo={seekTo}
              />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', background: '#f1f5f9', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ color: '#64748b', fontSize: 13 }}>{t.leadDetail.noAudio}</p>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <SectionHeader title={t.leadDetail.transcript} inline />
              {transcript && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(transcript.detectedLanguages || [transcript.language]).map((lang: string) => (
                    <span key={lang} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 20,
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                      color: '#a5b4fc', fontWeight: 600,
                    }}>
                      {lang}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, color: '#64748b', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                    {transcriptLines.length} {t.leadDetail.lines}
                  </span>
                </div>
              )}
            </div>

            <div style={{
              background: '#f1f5f9', borderRadius: 12, padding: '8px',
              border: '1px solid rgba(0,0,0,0.06)',
              maxHeight: 'calc(100vh - 380px)', overflowY: 'auto',
            }}>
              <TranscriptPanel
                lines={transcriptLines as any}
                currentTime={currentAudioTime}
                onSeek={handleTranscriptSeek}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ height: '100vh', overflowY: 'auto', background: '#f8fafc' }}>
        <div style={{ padding: '20px 0 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, padding: '0 20px 16px' }}>
            {t.leadDetail.qualityReview}
          </h2>
        </div>

        {selectedRecording ? (
          <ReviewPanel
            key={selectedRecording.id}
            reviews={reviews}
            allChecklists={allChecklists}
            recordingId={selectedRecording.id}
            leadId={id}
          />
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            No recording selected
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ color: '#64748b', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, minWidth: 60 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{value}</span>
    </div>
  )
}

function SectionHeader({ title, inline }: { title: string; inline?: boolean }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 700, color: '#0f172a',
      margin: 0, marginBottom: inline ? 0 : 12,
      display: inline ? 'inline-block' : 'block',
      letterSpacing: '-0.1px',
    }}>
      {title}
    </h2>
  )
}
