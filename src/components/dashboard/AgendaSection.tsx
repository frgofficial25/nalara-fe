"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import Portal from '@/components/common/Portal';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { getStoredToken } from '@/services/auth';

interface Agenda {
  uuid_agenda: string;
  nama_agenda: string;
  waktu_mulai: string;
  waktu_selesai: string;
  link_meet: string | null;
}

interface AgendaSectionProps {
  allowManage?: boolean;
}

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function AgendaSection({ allowManage = false }: AgendaSectionProps) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    nama_agenda: '',
    waktu_mulai: '',
    waktu_selesai: '',
    link_meet: '',
  });

  const getHeaders = useCallback(() => {
    const token = getStoredToken();
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const headers: Record<string, string> = {};

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (token) {
      headers['x-api-key'] = token;
    }

    return { token: token || undefined, headers };
  }, []);

  const fetchAgendas = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Agenda[] }>('/api/agenda', getHeaders());
      if (!res?.success) {
        throw new Error('Gagal memuat agenda');
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const filtered = (res.data || [])
        .filter((item) => new Date(item.waktu_selesai) >= todayStart)
        .sort((a, b) => new Date(a.waktu_mulai).getTime() - new Date(b.waktu_mulai).getTime());

      setAgendas(filtered);
      setFlashMessage((current) => (current?.type === 'error' ? null : current));
    } catch (err) {
      console.error('Error fetching dashboard agendas:', err);
      setFlashMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat agenda',
      });
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchAgendas();
    });
  }, [fetchAgendas]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  const hasAgendas = useMemo(() => agendas.length > 0, [agendas]);

  const resetForm = () => {
    setForm({
      nama_agenda: '',
      waktu_mulai: '',
      waktu_selesai: '',
      link_meet: '',
    });
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAgenda(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
  };

  const openEditModal = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setForm({
      nama_agenda: agenda.nama_agenda,
      waktu_mulai: toDateTimeLocalValue(agenda.waktu_mulai),
      waktu_selesai: toDateTimeLocalValue(agenda.waktu_selesai),
      link_meet: agenda.link_meet || '',
    });
    setFormError(null);
    setModalMode('edit');
  };

  const openDeleteModal = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setFormError(null);
    setModalMode('delete');
  };

  const validateForm = () => {
    if (!form.nama_agenda || !form.waktu_mulai || !form.waktu_selesai) {
      return 'Nama agenda, waktu mulai, dan waktu selesai wajib diisi';
    }

    if (new Date(form.waktu_selesai) <= new Date(form.waktu_mulai)) {
      return 'Waktu selesai harus lebih besar dari waktu mulai';
    }

    return null;
  };

  const handleCreateOrUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        nama_agenda: form.nama_agenda,
        waktu_mulai: new Date(form.waktu_mulai).toISOString(),
        waktu_selesai: new Date(form.waktu_selesai).toISOString(),
        link_meet: form.link_meet.trim() || null,
      };

      if (modalMode === 'edit' && selectedAgenda) {
        const response = await apiPut<{ success: boolean; message?: string }>(
          `/api/agenda/${selectedAgenda.uuid_agenda}`,
          payload,
          getHeaders()
        );

        if (!response?.success) {
          throw new Error(response?.message || 'Gagal memperbarui agenda');
        }

        setFlashMessage({ type: 'success', text: 'Agenda berhasil diperbarui' });
      } else {
        const response = await apiPost<{ success: boolean; message?: string }>('/api/agenda', payload, getHeaders());

        if (!response?.success) {
          throw new Error(response?.message || 'Gagal menambahkan agenda');
        }

        setFlashMessage({ type: 'success', text: 'Agenda berhasil ditambahkan' });
      }

      closeModal();
      await fetchAgendas();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan agenda');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgenda) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await apiDelete<{ success: boolean; message?: string }>(
        `/api/agenda/${selectedAgenda.uuid_agenda}`,
        getHeaders()
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Gagal menghapus agenda');
      }

      closeModal();
      setFlashMessage({ type: 'success', text: 'Agenda berhasil dihapus' });
      await fetchAgendas();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus agenda');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = () => {
    if (!modalMode) {
      return null;
    }

    const isDelete = modalMode === 'delete';
    const heading = modalMode === 'create' ? 'Create New Event' : modalMode === 'edit' ? 'Edit Event' : 'Delete Event';

    return (
      <Portal>
        <div style={s.modalOverlay} onClick={closeModal}>
          <div
            style={{ ...s.modalContent, maxWidth: isDelete ? 440 : 760 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>{heading}</h3>
                {!isDelete && (
                  <p style={s.modalSubtitle}>Schedule teaching activity, meeting, consultation, assessment, or academic event.</p>
                )}
              </div>
              <button onClick={closeModal} style={s.closeBtn} type="button">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={s.modalAlert}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {isDelete ? (
              <div style={s.deleteWrap}>
                <p style={s.deleteText}>
                  Hapus agenda <strong style={{ color: '#fff' }}>{selectedAgenda?.nama_agenda}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div style={s.modalFooter}>
                  <button type="button" onClick={closeModal} style={s.cancelBtn} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleDelete} style={s.dangerBtn} disabled={submitting}>
                    {submitting ? 'Deleting...' : 'Delete Event'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} style={s.form}>
                <div style={s.formGrid}>
                  <div style={s.formGroupWide}>
                    <label style={s.label}>Event Title</label>
                    <input
                      type="text"
                      required
                      value={form.nama_agenda}
                      onChange={(event) => setForm((current) => ({ ...current, nama_agenda: event.target.value }))}
                      placeholder="e.g. Database Systems Lecture"
                      style={s.input}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.waktu_mulai}
                      onChange={(event) => setForm((current) => ({ ...current, waktu_mulai: event.target.value }))}
                      style={s.input}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.waktu_selesai}
                      onChange={(event) => setForm((current) => ({ ...current, waktu_selesai: event.target.value }))}
                      style={s.input}
                    />
                  </div>
                  <div style={s.formGroupWide}>
                    <label style={s.label}>Meeting Link</label>
                    <input
                      type="url"
                      value={form.link_meet}
                      onChange={(event) => setForm((current) => ({ ...current, link_meet: event.target.value }))}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      style={s.input}
                    />
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button type="button" onClick={closeModal} style={s.cancelBtn} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" style={s.submitBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Event' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--azure)" />
            <h3 style={s.title}>Today&apos;s Schedule</h3>
          </div>
          {allowManage && (
            <button onClick={openCreateModal} style={s.addBtn} type="button">
              <Plus size={14} />
              <span>Add Event</span>
            </button>
          )}
        </div>

        {flashMessage && (
          <div style={flashMessage.type === 'success' ? s.successAlert : s.errorAlert}>
            {flashMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{flashMessage.text}</span>
          </div>
        )}

        <div style={s.listContainer}>
          {loading ? (
            <div style={s.loadingContainer}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Memuat agenda...</span>
            </div>
          ) : !hasAgendas ? (
            <div style={s.emptyState}>
              <p>Tidak ada agenda hari ini atau waktu dekat.</p>
            </div>
          ) : (
            agendas.map((item, index) => {
              const today = isToday(item.waktu_mulai);
              const isLastItem = index === agendas.length - 1;

              return (
                <div key={item.uuid_agenda} style={s.itemRow}>
                  <div style={s.timelineCol}>
                    <div style={{ ...s.dot, backgroundColor: today ? 'var(--azure)' : 'rgba(255,255,255,0.24)' }} />
                    {!isLastItem && <div style={s.line} />}
                  </div>

                  <div style={s.timeCol}>
                    <strong style={s.timeText}>{formatTime(item.waktu_mulai)}</strong>
                    <span style={s.durationText}>{getDurationString(item.waktu_mulai, item.waktu_selesai)}</span>
                  </div>

                  <div style={s.contentCol}>
                    <div style={s.itemTopRow}>
                      <div>
                        <h4 style={s.agendaTitle}>{item.nama_agenda}</h4>
                        <div style={s.metaRow}>
                          <span style={s.dateBadge}>
                            <Clock size={12} />
                            <span>{formatDateLabel(item.waktu_mulai, today)}</span>
                          </span>
                          {item.link_meet ? (
                            <a href={item.link_meet} target="_blank" rel="noopener noreferrer" style={s.meetBadge}>
                              <Video size={12} />
                              <span>Live</span>
                            </a>
                          ) : (
                            <span style={s.offlineText}>Offline Session</span>
                          )}
                        </div>
                      </div>

                      {allowManage && (
                        <div style={s.actionRow}>
                          <button type="button" onClick={() => openEditModal(item)} style={s.iconBtn} title="Edit event">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => openDeleteModal(item)} style={s.iconBtnDanger} title="Delete event">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />

      {renderModal()}
    </>
  );
}

function toDateTimeLocalValue(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDurationString(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.max(Math.round(diffMs / (1000 * 60)), 0);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();

  return date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();
}

function formatDateLabel(dateStr: string, today: boolean) {
  if (today) {
    return 'Hari ini';
  }

  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

const s: Record<string, React.CSSProperties> = {
  card: {
    padding: '22px 24px',
    borderRadius: '12px',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 12px 40px rgba(2, 6, 23, 0.18)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#F8FAFC',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    maxHeight: '240px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px 0',
    color: 'var(--grey-blue)',
    fontSize: '0.85rem',
  },
  emptyState: {
    padding: '20px 0',
    textAlign: 'center',
    color: 'var(--grey-blue)',
    fontSize: '0.85rem',
  },
  itemRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  timelineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '4px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(65, 150, 240, 0.4)',
  },
  line: {
    width: '1px',
    minHeight: '32px',
    background: 'rgba(255, 255, 255, 0.08)',
    marginTop: '6px',
  },
  timeCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '72px',
    paddingTop: '2px',
  },
  timeText: {
    color: '#fff',
    fontSize: '0.95rem',
  },
  durationText: {
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
    marginTop: '2px',
  },
  contentCol: {
    flex: 1,
  },
  itemTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  agendaTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: '#E2E8F0',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.72rem',
    color: 'var(--grey-blue)',
  },
  meetBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#34D399',
    background: 'rgba(52, 211, 153, 0.1)',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
    textDecoration: 'none',
  },
  offlineText: {
    fontSize: '0.72rem',
    color: 'var(--grey)',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--azure)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  iconBtnDanger: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid rgba(239,68,68,0.2)',
    background: 'rgba(239,68,68,0.08)',
    color: '#FF6B6B',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(52, 211, 153, 0.12)',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    color: '#6EE7B7',
    fontSize: '0.82rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(248, 113, 113, 0.12)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    color: '#FCA5A5',
    fontSize: '0.82rem',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'rgba(2, 6, 23, 0.72)',
    backdropFilter: 'blur(10px)',
  },
  modalContent: {
    width: '100%',
    maxWidth: '760px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(180deg, rgba(7, 12, 22, 0.98) 0%, rgba(4, 10, 20, 0.98) 100%)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '24px 24px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  modalTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '1.75rem',
    fontWeight: 700,
  },
  modalSubtitle: {
    margin: '6px 0 0',
    color: 'rgba(226, 232, 240, 0.68)',
    fontSize: '0.88rem',
  },
  closeBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#CBD5E1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  modalAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '18px 24px 0',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(248, 113, 113, 0.12)',
    border: '1px solid rgba(248, 113, 113, 0.18)',
    color: '#FCA5A5',
    fontSize: '0.82rem',
  },
  form: {
    padding: '20px 24px 24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px 20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGroupWide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    gridColumn: '1 / -1',
  },
  label: {
    color: '#E2E8F0',
    fontSize: '0.84rem',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: '#fff',
    padding: '12px 14px',
    fontSize: '0.92rem',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '22px',
  },
  cancelBtn: {
    minWidth: '120px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#E2E8F0',
    padding: '12px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    minWidth: '140px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #0B7BFF, #045BB5)',
    color: '#fff',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(6, 113, 224, 0.25)',
  },
  dangerBtn: {
    minWidth: '140px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
    color: '#fff',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteWrap: {
    padding: '20px 24px 24px',
  },
  deleteText: {
    margin: 0,
    color: '#CBD5E1',
    fontSize: '0.92rem',
    lineHeight: 1.6,
  },
};
