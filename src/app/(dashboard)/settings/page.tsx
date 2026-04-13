'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings2, Save, Loader2, Shield, Bot, Sliders, Link } from 'lucide-react'
import { useChecklists } from '@/hooks/useChecklists'

interface SettingsData {
  id: number
  bitrix24WebhookUrl: string | null
  defaultChecklistId: string | null
  aiProvider: string
  aiModel: string
  scorePassThreshold: number
  reviewerSignature: string | null
}

export default function SettingsPage() {
  const { data: checklistsData } = useChecklists()
  const checklists = Array.isArray(checklistsData) ? checklistsData : []
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved successfully!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const update = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8, color: '#0f172a', fontSize: 13,
    padding: '9px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const cardStyle: React.CSSProperties = {
    background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 12, padding: '20px 24px', marginBottom: 20,
  }

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div className="shimmer" style={{ height: 32, width: 160, borderRadius: 8, marginBottom: 24 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={cardStyle}>
            <div className="shimmer" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 16 }} />
            <div className="shimmer" style={{ height: 40, borderRadius: 8, marginBottom: 12 }} />
            <div className="shimmer" style={{ height: 40, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    )
  }

  if (!settings) return null

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings2 size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Settings
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 1 }}>
              Platform configuration
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: '#6366f1', border: '1px solid rgba(99,102,241,0.5)',
            color: 'white', cursor: isSaving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            opacity: isSaving ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Bitrix24 Integration */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link size={15} color="#6366f1" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Bitrix24 Integration
          </h2>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24', fontWeight: 600,
          }}>
            DEMO MODE
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Webhook URL
          </label>
          <input
            type="url"
            value={settings.bitrix24WebhookUrl || ''}
            onChange={(e) => update('bitrix24WebhookUrl', e.target.value || null)}
            placeholder="https://your-domain.bitrix24.uz/rest/1/..."
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 5, margin: '5px 0 0' }}>
            Enter your Bitrix24 webhook URL to sync leads and contacts automatically.
          </p>
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: 12, color: '#f59e0b',
        }}>
          Currently running in demo mode with sample data. Connect Bitrix24 to import real leads.
        </div>
      </div>

      {/* AI Settings */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Bot size={15} color="#6366f1" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            AI Configuration
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              AI Provider
            </label>
            <select
              value={settings.aiProvider}
              onChange={(e) => update('aiProvider', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
              <option value="local">Local Model</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Model
            </label>
            <select
              value={settings.aiModel}
              onChange={(e) => update('aiModel', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {settings.aiProvider === 'gemini' && (
                <>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </>
              )}
              {settings.aiProvider === 'openai' && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </>
              )}
              {settings.aiProvider === 'claude' && (
                <>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </>
              )}
              {settings.aiProvider === 'local' && (
                <option value="local">Local Model</option>
              )}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            API Key
          </label>
          <input
            type="password"
            placeholder="Enter your API key..."
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 5, margin: '5px 0 0' }}>
            API key is stored securely and used for AI-powered transcription and analysis.
          </p>
        </div>
      </div>

      {/* Scoring Settings */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sliders size={15} color="#6366f1" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Scoring & Reviews
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Pass Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.scorePassThreshold}
              onChange={(e) => update('scorePassThreshold', Number(e.target.value))}
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 5, margin: '5px 0 0' }}>
              Calls scoring above this threshold are marked as "Pass"
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Default Checklist
            </label>
            <select
              value={settings.defaultChecklistId || ''}
              onChange={(e) => update('defaultChecklistId', e.target.value || null)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">None (use marked default)</option>
              {checklists.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Reviewer Signature
          </label>
          <input
            type="text"
            value={settings.reviewerSignature || ''}
            onChange={(e) => update('reviewerSignature', e.target.value || null)}
            placeholder="e.g., QA Team — SotAI Platform"
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 5, margin: '5px 0 0' }}>
            Appended to review summaries when locking a review
          </p>
        </div>
      </div>

      {/* Platform Info */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={15} color="#6366f1" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Platform Info
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Platform', 'SotAI v1.0.0'],
            ['Framework', 'Next.js 16'],
            ['Database', 'PostgreSQL (Prisma)'],
            ['Language', 'TypeScript'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
