import React, { useState } from 'react';

type LevelTab = 'dasar' | 'menengah' | 'advanced';

export default function Curriculum() {
  const [activeTab, setActiveTab] = useState<LevelTab>('dasar');

  const tabData = {
    dasar: {
      title: 'Level Dasar (Preparatory)',
      duration: '32 Jam Instruksional',
      dates: '23, 24, 25, 26 Juli',
      schedule: [
        { day: 'Rabu, 22 Juli 2026', topic: 'Technical Meeting (100 Menit)', desc: 'Onboarding LMS Nalara.academy, instalasi tools, setup environment, & pengumuman case pitching. Dipandu oleh Muhammad Hafiizh Anindya.' },
        { day: 'Kamis, 23 Juli 2026', topic: 'Python Programming & Image Processing', desc: 'Sintaks Python lanjutan, NumPy, manipulasi citra menggunakan OpenCV, filter spasial, dan konversi ruang warna.' },
        { day: 'Jumat, 24 Juli 2026', topic: 'Exploring Data Analysis (EDA) & NumPy/Pandas', desc: 'Pemetaan data citra, augmentasi dataset, penanganan data tidak seimbang, dan pipeline pemrosesan awal.' },
        { day: 'Sabtu, 25 Juli 2026', topic: 'Exploring Data Analysis (EDA) & NumPy/Pandas', desc: 'Konvolusi dasar, pooling layer, perbandingan build model dengan TensorFlow vs PyTorch, dan transfer learning fundamental.' },
        { day: 'Minggu, 26 Juli 2026', topic: 'Data Splitting & Overfitting Workshop', desc: 'Strategi k-fold cross-validation, regularisasi (dropout, batch normalization), deteksi overfitting via grafik loss/accuracy, & Modul Ujian Dasar.' }
      ]
    },
    menengah: {
      title: 'Level Menengah (Intermediate)',
      duration: '32 Jam Instruksional',
      dates: '30, 31 Juli, 1, 2 Agustus',
      schedule: [
        { day: 'Rabu, 29 Juli 2026', topic: 'Review Evaluasi Level Dasar', desc: 'Analisis hasil ujian level dasar, pembahasan feedback coding portofolio, dan sinkronisasi tools model menengah.' },
        { day: 'Kamis, 30 Juli 2026', topic: 'Image Segmentation (Semantic & Instance)', desc: 'FCN, U-Net architecture, perbedaan segmentasi semantik dan instansi, penyusunan dataset mask annotation.' },
        { day: 'Jumat, 31 Juli 2026', topic: 'Modern Backbone & Vision Transformers', desc: 'ResNet, MobileNet untuk komputasi ringan, konsep Vision Transformers (ViT) dalam klasifikasi & segmentasi.' },
        { day: 'Sabtu, 1 Agustus 2026', topic: 'Transfer Learning & Custom Datasets', desc: 'Fine-tuning weights model pre-trained COCO dataset, penyesuaian learning rate scheduler untuk konvergensi optimal.' },
        { day: 'Minggu, 2 Agustus 2026', topic: 'Evaluation Metrics Workshop & Case Study', desc: 'Perhitungan IoU (Intersection over Union), Dice Coefficient, analisis kebingungan matriks presisi-recall, & Modul Ujian Menengah.' }
      ]
    },
    advanced: {
      title: 'Level Advanced (MLOps)',
      duration: '32 Jam Instruksional',
      dates: '6, 7, 8, 9 Agustus',
      schedule: [
        { day: 'Rabu, 5 Agustus 2026', topic: 'Briefing Project Akhir & Hybrid Pipeline', desc: 'Pembagian tim proyek, pengumuman studi kasus hybrid pipeline, dan konsultasi arsitektur deployment.' },
        { day: 'Kamis, 6 Agustus 2026', topic: 'MLOps Automation Lifecycle', desc: 'Version control untuk model (DVC), tracking eksperimen menggunakan MLflow, dan pembuatan docker image untuk environment model.' },
        { day: 'Jumat, 7 Agustus 2026', topic: 'Production API & Cloud Deployment', desc: 'Membangun REST API performa tinggi dengan FastAPI, deployment model ke Kubernetes/Cloud Engine, dan monitoring model drift.' },
        { day: 'Sabtu, 8 Agustus 2026', topic: 'Pitching Project Evaluated by Industry Reviewers', desc: 'Presentasi hasil proyek akhir di depan Dosen Pembina & reviewer industri terkemuka untuk validasi kelayakan produk.' },
        { day: 'Minggu, 9 Agustus 2026', topic: 'Graduation Ceremony & Career Networking', desc: 'Penyerahan sertifikat kelulusan resmi FRG FILKOM UB, sesi networking alumni, dan tips integrasi portofolio ke rekrutmen.' }
      ]
    }
  };

  const currentLevel = tabData[activeTab];

  return (
    <section style={styles.curriculumSection} id="syllabus">
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Kurikulum Terdistribusi Mingguan</h2>
        <p style={styles.sectionDesc}>
          Jadwal disusun secara berkala tiap akhir pekan (Rabu–Minggu) untuk memberikan waktu istirahat dan pemahaman konsep yang lebih matang, bukan kompresi satu minggu penuh yang melelahkan.
        </p>
      </div>

      {/* Stats Banner */}
      <div style={styles.academicCard}>
        <div style={styles.statBox}>
          <span style={styles.statNumber}>96 JP</span>
          <span style={styles.statLabel}>Porsi Praktikum & Proyek Lebih Dominan</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <span style={{ ...styles.statNumber, color: '#ffa826' }}>3-5 SKS</span>
          <span style={styles.statLabel}>Konversi SKS dengan Pihak Kampus</span>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('dasar')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'dasar' ? styles.tabBtnActive : {}),
          }}
        >
          Level Dasar (Preparatory)
        </button>
        <button
          onClick={() => setActiveTab('menengah')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'menengah' ? styles.tabBtnActive : {}),
          }}
        >
          Level Menengah (Intermediate)
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'advanced' ? styles.tabBtnActive : {}),
          }}
        >
          Level Lanjut (Advanced)
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={styles.tabContent}>
        <div style={styles.levelMetaCard}>
          <div style={styles.metaTextGroup}>
            <h3 style={styles.levelTitle}>{currentLevel.title}</h3>
            <span style={styles.levelDates}>📅 {currentLevel.dates} | ⏱️ {currentLevel.duration}</span>
          </div>
          
          <div style={styles.componentsRow}>
            <div style={styles.compItem}>
              <span style={styles.compIcon}>📄</span>
              <div>
                <strong style={styles.compTitle}>Materi Utama</strong>
                <span style={styles.compSub}>Slides & Handouts (.docx/.pptx)</span>
              </div>
            </div>
            <div style={styles.compItem}>
              <span style={styles.compIcon}>💻</span>
              <div>
                <strong style={styles.compTitle}>Modul Praktikum</strong>
                <span style={styles.compSub}>Code Repository & Notebooks</span>
              </div>
            </div>
            <div style={styles.compItem}>
              <span style={styles.compIcon}>✍️</span>
              <div>
                <strong style={styles.compTitle}>Modul Ujian</strong>
                <span style={styles.compSub}>Studi Kasus & Penilaian Riil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={styles.timelineList}>
          {currentLevel.schedule.map((item, index) => (
            <div key={index} style={styles.timelineItem}>
              <div style={styles.timelineDotContainer}>
                <div style={styles.timelineDot} />
                {index < currentLevel.schedule.length - 1 && <div style={styles.timelineLine} />}
              </div>
              <div style={styles.timelineContent}>
                <span style={styles.timelineDay}>{item.day}</span>
                <h4 style={styles.timelineTopic}>{item.topic}</h4>
                <p style={styles.timelineDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  curriculumSection: {
    padding: '5rem 1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  },
  sectionDesc: {
    fontSize: '1.1rem',
    maxWidth: '#94a3b8',
    margin: '0 auto',
    color: '#94a3b8',
    lineHeight: '1.6',
  },
  tabsContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '2.5rem',
    padding: '0.35rem',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    maxWidth: '720px',
    margin: '0 auto 2.5rem auto',
  },
  tabBtn: {
    flex: '1 1 auto',
    padding: '0.85rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    background: '#0252a3',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(2, 82, 163, 0.25)',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  levelMetaCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  metaTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  levelTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelDates: {
    fontSize: '0.95rem',
    color: '#38bdf8',
    fontWeight: 500,
  },
  componentsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '1.5rem',
  },
  compItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  compIcon: {
    fontSize: '1.75rem',
  },
  compTitle: {
    fontSize: '0.95rem',
    color: '#FFFFFF',
    display: 'block',
  },
  compSub: {
    fontSize: '0.8rem',
    color: '#64748b',
    display: 'block',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '1rem',
  },
  timelineItem: {
    display: 'flex',
    gap: '1.5rem',
    position: 'relative',
  },
  timelineDotContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#38bdf8',
    boxShadow: '0 0 10px #38bdf8',
    marginTop: '0.5rem',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    background: 'rgba(255, 255, 255, 0.08)',
    minHeight: '60px',
  },
  timelineContent: {
    paddingBottom: '2.5rem',
    flex: 1,
  },
  timelineDay: {
    fontSize: '0.85rem',
    color: '#ffa826',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    display: 'block',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
  },
  timelineTopic: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '0.5rem',
  },
  timelineDesc: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    lineHeight: '1.6',
  },
  academicCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    marginBottom: '3rem',
  },
  statBox: {
    textAlign: 'center',
    flex: '1 1 200px',
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#38bdf8',
    display: 'block',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
    display: 'block',
  },
  statDivider: {
    width: '1px',
    height: '60px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
};
