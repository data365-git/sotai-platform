'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, GripVertical, Star, Copy, ClipboardList, Save, Loader2 } from 'lucide-react'
import { useChecklists, useCreateChecklist, useUpdateChecklist, useDeleteChecklist } from '@/hooks/useChecklists'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

interface ChecklistItem {
  id?: string
  text: string
  type: 'YES_NO' | 'SCORE'
  weight: number
  order: number
  _uid?: string
}

function generateUID() {
  return Math.random().toString(36).slice(2)
}

function SortableItem({
  item, index, onChange, onDelete, disabled,
}: {
  item: ChecklistItem & { _uid: string }
  index: number
  onChange: (uid: string, updates: Partial<ChecklistItem>) => void
  onDelete: (uid: string) => void
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._uid })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 7, color: '#0f172a', fontSize: 12.5,
    padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(0,0,0,0.02)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 8, padding: '8px 10px', marginBottom: 4,
      }}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          style={{
            background: 'none', border: 'none', cursor: disabled ? 'default' : 'grab',
            color: '#475569', padding: 2, flexShrink: 0, display: 'flex',
          }}
        >
          <GripVertical size={14} />
        </button>

        {/* Order number */}
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, flexShrink: 0, width: 18, textAlign: 'right' }}>
          {index + 1}
        </span>

        {/* Text input */}
        <input
          type="text"
          value={item.text}
          onChange={(e) => onChange(item._uid, { text: e.target.value })}
          disabled={disabled}
          placeholder="Criterion text..."
          style={{ ...inputStyle, flex: 1 }}
        />

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {(['YES_NO', 'SCORE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange(item._uid, { type: t })}
              disabled={disabled}
              style={{
                padding: '4px 8px', borderRadius: 5, fontSize: 10, fontWeight: 500,
                cursor: disabled ? 'default' : 'pointer',
                background: item.type === t ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: item.type === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(0,0,0,0.06)',
                color: item.type === t ? '#a5b4fc' : '#64748b',
                transition: 'all 0.12s',
              }}
            >
              {t === 'YES_NO' ? 'Yes/No' : 'Score'}
            </button>
          ))}
        </div>

        {/* Weight */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>×</span>
          <input
            type="number"
            min="0.5"
            max="5"
            step="0.5"
            value={item.weight}
            onChange={(e) => onChange(item._uid, { weight: Number(e.target.value) })}
            disabled={disabled}
            style={{ ...inputStyle, width: 50, textAlign: 'center', padding: '5px 6px' }}
          />
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(item._uid)}
          disabled={disabled}
          style={{
            background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
            color: '#ef4444', opacity: disabled ? 0.3 : 0.6, padding: 2, display: 'flex',
            transition: 'opacity 0.12s',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function ChecklistsPage() {
  const { data: checklists = [], isLoading } = useChecklists()
  const createChecklist = useCreateChecklist()
  const updateChecklist = useUpdateChecklist()
  const deleteChecklist = useDeleteChecklist()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDefault, setEditDefault] = useState(false)
  const [editItems, setEditItems] = useState<(ChecklistItem & { _uid: string })[]>([])
  const [isDirty, setIsDirty] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const selectedChecklist = useMemo(
    () => checklists.find((c: any) => c.id === selectedId),
    [checklists, selectedId]
  )

  function selectChecklist(checklist: any) {
    setSelectedId(checklist.id)
    setEditName(checklist.name)
    setEditDesc(checklist.description || '')
    setEditDefault(checklist.isDefault)
    setEditItems(
      (checklist.items || []).map((item: any) => ({
        ...item, _uid: item.id || generateUID(),
      }))
    )
    setIsDirty(false)
  }

  function handleItemChange(uid: string, updates: Partial<ChecklistItem>) {
    setEditItems((prev) => prev.map((it) => it._uid === uid ? { ...it, ...updates } : it))
    setIsDirty(true)
  }

  function handleItemDelete(uid: string) {
    setEditItems((prev) => prev.filter((it) => it._uid !== uid))
    setIsDirty(true)
  }

  function addItem() {
    const newItem: ChecklistItem & { _uid: string } = {
      _uid: generateUID(),
      text: '',
      type: 'YES_NO',
      weight: 1,
      order: editItems.length + 1,
    }
    setEditItems((prev) => [...prev, newItem])
    setIsDirty(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setEditItems((items) => {
        const oldIndex = items.findIndex((i) => i._uid === active.id)
        const newIndex = items.findIndex((i) => i._uid === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setIsDirty(true)
    }
  }

  async function handleSave() {
    if (!selectedId) return
    const data = {
      name: editName,
      description: editDesc,
      isDefault: editDefault,
      items: editItems.map((it, i) => ({
        text: it.text,
        type: it.type,
        weight: it.weight,
        order: i + 1,
      })),
    }
    try {
      await updateChecklist.mutateAsync({ id: selectedId, data })
      setIsDirty(false)
      toast.success('Checklist saved!')
    } catch {
      toast.error('Failed to save checklist')
    }
  }

  async function handleCreate() {
    try {
      const newChecklist = await createChecklist.mutateAsync({
        name: 'New Checklist',
        description: '',
        isDefault: false,
        items: [{ text: 'First criterion', type: 'YES_NO', weight: 1, order: 1 }],
      })
      selectChecklist(newChecklist)
      toast.success('Checklist created!')
    } catch {
      toast.error('Failed to create checklist')
    }
  }

  async function handleDuplicate() {
    if (!selectedChecklist) return
    try {
      const newChecklist = await createChecklist.mutateAsync({
        name: `${selectedChecklist.name} (Copy)`,
        description: selectedChecklist.description || '',
        isDefault: false,
        items: (selectedChecklist.items || []).map((it: any) => ({
          text: it.text, type: it.type, weight: it.weight, order: it.order,
        })),
      })
      selectChecklist(newChecklist)
      toast.success('Checklist duplicated!')
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Delete this checklist? This cannot be undone.')) return
    try {
      await deleteChecklist.mutateAsync(selectedId)
      setSelectedId(null)
      toast.success('Checklist deleted')
    } catch {
      toast.error('Failed to delete checklist')
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8, color: '#0f172a', fontSize: 13,
    padding: '8px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100vh', overflow: 'hidden' }}>
      {/* Left: Checklist list */}
      <div style={{
        height: '100vh', overflowY: 'auto',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        background: '#f8fafc',
      }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Checklists</h1>
            <button
              onClick={handleCreate}
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)',
                color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3].map((i) => <LoadingSkeleton key={i} height={52} />)}
            </div>
          )}

          {!isLoading && checklists.map((checklist: any) => (
            <div
              key={checklist.id}
              onClick={() => selectChecklist(checklist)}
              style={{
                padding: '10px 12px', borderRadius: 9, marginBottom: 4,
                cursor: 'pointer', transition: 'all 0.12s',
                background: selectedId === checklist.id ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.02)',
                border: selectedId === checklist.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={14} color={selectedId === checklist.id ? '#a5b4fc' : '#64748b'} />
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: selectedId === checklist.id ? '#0f172a' : '#94a3b8',
                  flex: 1,
                }}>
                  {checklist.name}
                </span>
                {checklist.isDefault && (
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                )}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, marginLeft: 22 }}>
                {(checklist.items || []).length} items
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div style={{ height: '100vh', overflowY: 'auto' }}>
        {!selectedId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
            <ClipboardList size={40} color="#334155" />
            <p style={{ color: '#64748b', fontSize: 14 }}>Select a checklist to edit</p>
            <button
              onClick={handleCreate}
              style={{ padding: '8px 20px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              Create New Checklist
            </button>
          </div>
        ) : (
          <div style={{ padding: '24px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Edit Checklist
                {isDirty && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8, fontWeight: 400 }}>• unsaved changes</span>}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDuplicate}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
                    color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateChecklist.isPending}
                  style={{
                    padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: isDirty ? '#6366f1' : 'rgba(99,102,241,0.3)',
                    border: '1px solid rgba(99,102,241,0.5)',
                    color: 'white', cursor: updateChecklist.isPending ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: updateChecklist.isPending ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {updateChecklist.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              </div>
            </div>

            {/* Name + Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setIsDirty(true) }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => { setEditDesc(e.target.value); setIsDirty(true) }}
                  placeholder="Optional description..."
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Default toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 8 }}>
              <input
                type="checkbox"
                id="isDefault"
                checked={editDefault}
                onChange={(e) => { setEditDefault(e.target.checked); setIsDirty(true) }}
                style={{ width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="isDefault" style={{ fontSize: 13, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={13} color="#f59e0b" fill={editDefault ? '#f59e0b' : 'none'} />
                Set as default checklist (used for new reviews)
              </label>
            </div>

            {/* Items */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Criteria ({editItems.length})
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748b' }}>
                  <span>Drag to reorder</span>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={editItems.map((i) => i._uid)} strategy={verticalListSortingStrategy}>
                  {editItems.map((item, index) => (
                    <SortableItem
                      key={item._uid}
                      item={item}
                      index={index}
                      onChange={handleItemChange}
                      onDelete={handleItemDelete}
                      disabled={false}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add item */}
              <button
                onClick={addItem}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', border: '1px dashed rgba(99,102,241,0.3)',
                  color: '#6366f1', cursor: 'pointer', marginTop: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.12s',
                }}
              >
                <Plus size={14} />
                Add Criterion
              </button>
            </div>

            {/* Score summary */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>TOTAL WEIGHT</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
                {editItems.reduce((sum, it) => sum + (it.weight || 0), 0).toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>points across {editItems.length} criteria</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
