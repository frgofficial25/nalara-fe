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
    const heading = modalMode === 'create' ? 'Tambah Agenda Baru' : modalMode === 'edit' ? 'Edit Agenda' : 'Hapus Agenda';

    return (
      <Portal>
        <div style={s.modalOverlay} onClick={closeModal}>
          <div
            className="glass-panel"
            style={{ ...s.modalContent, maxWidth: isDelete ? 440 : 480 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{heading}</h3>
              <button onClick={closeModal} style={s.modalCloseBtn} type="button">
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
                    Batal
                  </button>
                  <button type="button" onClick={handleDelete} style={s.dangerBtn} disabled={submitting}>
                    {submitting ? 'Menghapus...' : 'Hapus Agenda'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} style={s.form}>
                <div style={s.formGroup}>
                  <label style={s.label}>Nama Agenda</label>
                  <input
                    type="text"
                    required
                    value={form.nama_agenda}
                    onChange={(event) => setForm((current) => ({ ...current, nama_agenda: event.target.value }))}
                    placeholder="Contoh: Kuliah Pengantar AI & MLOps"
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.waktu_mulai}
                    onChange={(event) => setForm((current) => ({ ...current, waktu_mulai: event.target.value }))}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.waktu_selesai}
                    onChange={(event) => setForm((current) => ({ ...current, waktu_selesai: event.target.value }))}
                    style={s.input}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Link Meeting (Opsional)</label>
                  <input
                    type="url"
                    value={form.link_meet}
                    onChange={(event) => setForm((current) => ({ ...current, link_meet: event.target.value }))}
                    placeholder="Contoh: https://meet.google.com/xxx-xxxx-xxx"
                    style={s.input}
                  />
                </div>
                <div style={s.modalFooter}>
                  <button type="button" onClick={closeModal} style={s.cancelBtn} disabled={submitting}>
                    Batal
                  </button>
                  <button type="submit" style={s.submitBtn} disabled={submitting}>
                    {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Tambah Agenda' : 'Simpan Perubahan'}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(21, 21, 23, 0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--grey-blue)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.85rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--grey-blue)',
  },
  input: {
    backgroundColor: '#18181b',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    color: 'var(--silver)',
    padding: '9px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  submitBtn: {
    backgroundColor: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    background: 'linear-gradient(135deg, var(--navy), var(--m-blue))',
    border: 'none',
    color: '#ffffff',
    padding: '9px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    boxShadow: '0 4px 12px rgba(6, 113, 224, 0.3)',
  },
  dangerBtn: {
    backgroundColor: 'linear-gradient(135deg, #EF4444, #DC2626)',
    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
    border: 'none',
    color: '#ffffff',
    padding: '9px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
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
