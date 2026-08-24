/**
 * useCertificate — Hook untuk generate & download sertifikat siswa
 *
 * Alur:
 * 1. Fetch pengaturan sertifikat dari /api/pembelajaran/:id/certificate
 * 2. Load gambar template dari Cloudinary via CORS proxy
 * 3. Tulis nama siswa di posisi yang telah dikonfigurasi menggunakan Canvas API
 * 4. Trigger download PNG ke browser
 */

import { getStoredToken } from '@/services/auth';
import { apiGet } from '@/lib/api';

export interface CertificateSettings {
  uuid_pembelajaran: string;
  title: string;
  certificate_template_url: string | null;
  certificate_name_position_x: number | null;
  certificate_name_position_y: number | null;
  certificate_name_font_size: number | null;
  certificate_name_color: string | null;
}

function getAuthHeaders() {
  const token = getStoredToken();
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers['x-api-key'] = apiKey;
  else if (token) headers['x-api-key'] = token;
  return { token: token || undefined, headers };
}

/** Ambil pengaturan sertifikat untuk satu kelas */
export async function fetchCertificateSettings(courseId: string): Promise<CertificateSettings | null> {
  try {
    const auth = getAuthHeaders();
    const res = await apiGet<any>(`/api/pembelajaran/${courseId}/certificate`, {
      token: auth.token,
      headers: auth.headers,
    });
    return res?.data || res || null;
  } catch (e) {
    console.error('fetchCertificateSettings error:', e);
    return null;
  }
}

/** Ambil status kelulusan siswa untuk kelas tertentu */
export async function fetchGraduationStatus(
  courseId: string,
  userId: string
): Promise<{ is_passed: boolean; final_score: number } | null> {
  try {
    const auth = getAuthHeaders();
    const res = await apiGet<any>(`/api/grades/status/${courseId}/${userId}`, {
      token: auth.token,
      headers: auth.headers,
    });
    return res?.data || null;
  } catch {
    return null;
  }
}

/**
 * Load gambar dari URL (mendukung CORS melalui crossOrigin='anonymous')
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generate sertifikat dan langsung trigger download sebagai PNG.
 *
 * @param settings  Pengaturan sertifikat dari DB
 * @param studentName  Nama lengkap siswa yang akan ditulis di sertifikat
 * @param fileName  Nama file PNG yang akan didownload
 */
export async function downloadCertificate(
  settings: CertificateSettings,
  studentName: string,
  fileName?: string
): Promise<void> {
  if (!settings.certificate_template_url) {
    throw new Error('Template sertifikat belum dikonfigurasi untuk kelas ini.');
  }

  const templateUrl = settings.certificate_template_url;
  const posX = settings.certificate_name_position_x ?? 50; // persen (0-100)
  const posY = settings.certificate_name_position_y ?? 50; // persen (0-100)
  const fontSize = settings.certificate_name_font_size ?? 48;
  const color = settings.certificate_name_color ?? '#000000';

  // 1. Load gambar template
  const img = await loadImage(templateUrl);

  // 2. Buat canvas sesuai ukuran gambar
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context tidak tersedia');

  // 3. Draw gambar template
  ctx.drawImage(img, 0, 0);

  // 4. Konfigurasi teks
  ctx.font = `bold ${fontSize}px 'Georgia', 'Times New Roman', serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 5. Hitung posisi pixel dari persentase
  const x = (posX / 100) * canvas.width;
  const y = (posY / 100) * canvas.height;

  // 6. Tulis nama siswa
  ctx.fillText(studentName, x, y);

  // 7. Trigger download
  const link = document.createElement('a');
  link.download = fileName || `Sertifikat_${settings.title}_${studentName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
