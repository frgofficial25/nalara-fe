import React, { useState } from 'react';
import Card from '../quiz/Card';

type LevelTab = 'dasar' | 'menengah' | 'advanced';

export default function Curriculum() {
  const [activeTab, setActiveTab] = useState<LevelTab>('dasar');

  const tabData = {
    dasar: {
      title: 'Level Dasar: Foundations of AI & Computer Vision',
      duration: '32 Jam Instruksional Total',
      dates: '23, 24, 25, 26 Juli',
      schedule: [
        { day: 'Rabu, 22 Juli', topic: 'Technical Meeting (60 Menit)', desc: 'Onboarding LMS Nalara.academy, instalasi tools, setup environment, & pengumuman case pitching. Dipandu oleh Muhammad Hafiizh Anindya.' },
        { day: 'Kamis, 23 Juli', topic: 'Python programming & Image Processing', desc: 'Sintaks Python lanjutan, NumPy, manipulasi citra menggunakan OpenCV, filter spasial, dan konversi ruang warna.' },
        { day: 'Jumat, 24 Juli', topic: 'Exploratory Data Analysis (EDA) & AI Workflows', desc: 'Pemetaan data citra, augmentasi dataset, penanganan data tidak seimbang, dan pipeline pemrosesan awal.' },
        { day: 'Sabtu, 25 Juli', topic: 'CNN Architectures (TensorFlow & PyTorch)', desc: 'Konvolusi dasar, pooling layer, perbandingan build model dengan TensorFlow vs PyTorch, dan transfer learning fundamental.' },
        { day: 'Minggu, 26 Juli', topic: 'Data Splitting & Overfitting Workshop', desc: 'Strategi k-fold cross-validation, regularisasi (dropout, batch normalization), deteksi overfitting via grafik loss/accuracy, & Modul Ujian Dasar.' }
      ]
    },
    menengah: {
      title: 'Level Menengah: Advanced CV & Segmentation',
      duration: '32 Jam Instruksional Total',
      dates: '30, 31 Juli, 1, 2 Agustus',
      schedule: [
        { day: 'Rabu, 29 Juli', topic: 'Review Evaluasi Level Dasar', desc: 'Analisis hasil ujian level dasar, pembahasan feedback coding portofolio, dan sinkronisasi tools model menengah.' },
        { day: 'Kamis, 30 Juli', topic: 'Image Segmentation (Semantic & Instance)', desc: 'FCN, U-Net architecture, perbedaan segmentasi semantik dan instansi, penyusunan dataset mask annotation.' },
        { day: 'Jumat, 31 Juli', topic: 'Modern Backbone & Vision Transformers', desc: 'ResNet, MobileNet untuk komputasi ringan, konsep Vision Transformers (ViT) dalam klasifikasi & segmentasi.' },
        { day: 'Sabtu, 1 Agustus', topic: 'Transfer Learning & Custom Datasets', desc: 'Fine-tuning weights model pre-trained COCO dataset, penyesuaian learning rate scheduler untuk konvergensi optimal.' },
        { day: 'Minggu, 2 Agustus', topic: 'Evaluation Metrics Workshop & Case Study', desc: 'Perhitungan IoU (Intersection over Union), Dice Coefficient, analisis kebingungan matriks presisi-recall, & Modul Ujian Menengah.' }
      ]
    },
    advanced: {
      title: 'Level Advanced: Production & MLOps Deployment',
      duration: '32 Jam Instruksional Total',
      dates: '6, 7, 8, 9 Agustus',
      schedule: [
        { day: 'Rabu, 5 Agustus', topic: 'Briefing Project Akhir & Hybrid Pipeline', desc: 'Pembagian tim proyek, pengumuman studi kasus hybrid pipeline, dan konsultasi arsitektur deployment.' },
        { day: 'Kamis, 6 Agustus', topic: 'MLOps Automation Lifecycle', desc: 'Version control untuk model (DVC), tracking eksperimen menggunakan MLflow, dan pembuatan docker image untuk environment model.' },
        { day: 'Jumat, 7 Agustus', topic: 'Production API & Cloud Deployment', desc: 'Membangun REST API performa tinggi dengan FastAPI, deployment model ke Kubernetes/Cloud Engine, dan monitoring model drift.' },
        { day: 'Sabtu, 8 Agustus', topic: 'Pitching Project Evaluated by Industry Reviewers', desc: 'Presentasi hasil proyek akhir di depan Dosen Pembina & reviewer industri terkemuka untuk validasi kelayakan produk.' },
        { day: 'Minggu, 9 Agustus', topic: 'Graduation Ceremony & Career Networking', desc: 'Penyerahan sertifikat kelulusan resmi FRG FILKOM UB, sesi networking alumni, dan tips integrasi portofolio ke rekrutmen.' }
      ]
    }
  };

  const currentLevel = tabData[activeTab];

  return (
    <section style={styles.curriculumSection} id="syllabus">
      <div style={styles.sectionHeader}>
        <span className="badge-tech">Timeline & Silabus</span>
        <h2 style={styles.sectionTitle}>Kurikulum Terdistribusi Mingguan</h2>
        <p style={styles.sectionDesc}>
          Jadwal disusun secara berkala tiap akhir pekan (Rabu–Minggu) untuk memberikan waktu istirahat dan pemahaman konsep yang lebih matang, bukan kompresi satu minggu penuh yang melelahkan.
        </p>
      </div>

      {/* Academic Compliance & Study Load Banner */}
      <div style={styles.academicCard}>
        <div style={styles.academicLeft}>
          <span style={styles.academicBadge}>🎓 Academic Compliance & Study Load</span>
          <h3 style={styles.academicCardTitle}>Rigorous Academic Standard</h3>
          <p style={styles.academicCardDesc}>
            Program pelatihan terstruktur ini dirancang untuk mencakup kompetensi teoritis dan praktis setara dengan standar kurikulum perguruan tinggi dan kebutuhan riil industri.
          </p>
        </div>
        <div style={styles.academicStats}>
          <div style={styles.statBox}>
            <span style={styles.statNumber}>96 JP</span>
            <span style={styles.statLabel}>Total Beban Belajar (3 Levels × 32 JP)</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statBox}>
            <span style={{ ...styles.statNumber, color: 'var(--lemon)' }}>3 SKS</span>
            <span style={styles.statLabel}>Setara Satuan Kredit Semester (SKS)</span>
          </div>
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
          Level Dasar (Foundations)
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
          Level Advanced (MLOps)
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

        {/* Timeline Timeline List */}
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
    padding: '4rem 1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    marginTop: '0.75rem',
    marginBottom: '1rem',
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: '1.05rem',
    maxWidth: '700px',
    margin: '0 auto',
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
    border: '1px solid var(--border-color)',
    maxWidth: '700px',
    margin: '0 auto 2.5rem auto',
  },
  tabBtn: {
    flex: '1 1 auto',
    padding: '0.85rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--grey-blue)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  tabBtnActive: {
    background: 'var(--navy)',
    color: 'var(--white)',
    boxShadow: '0 4px 12px rgba(6, 99, 199, 0.25)',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  levelMetaCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
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
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  levelDates: {
    fontSize: '0.95rem',
    color: 'var(--azure)',
    fontWeight: 500,
  },
  componentsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    borderTop: '1px solid var(--border-color)',
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
    color: 'var(--white)',
    display: 'block',
  },
  compSub: {
    fontSize: '0.8rem',
    color: 'var(--l-grey)',
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
    background: 'var(--azure)',
    boxShadow: '0 0 8px var(--azure)',
    marginTop: '0.5rem',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    background: 'var(--border-color)',
    minHeight: '60px',
  },
  timelineContent: {
    paddingBottom: '2.5rem',
    flex: 1,
  },
  timelineDay: {
    fontSize: '0.85rem',
    color: 'var(--lemon)',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    display: 'block',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
  },
  timelineTopic: {
    fontSize: '1.15rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  timelineDesc: {
    fontSize: '0.95rem',
    color: 'var(--grey-blue)',
    lineHeight: '1.6',
  },
  academicCard: {
    background: 'linear-gradient(135deg, rgba(6, 99, 199, 0.08) 0%, rgba(255, 178, 64, 0.04) 100%)',
    border: '1px solid rgba(6, 113, 224, 0.25)',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    marginBottom: '3rem',
  },
  academicLeft: {
    flex: '2 1 400px',
  },
  academicBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--azure)',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  academicCardTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--white)',
    marginBottom: '0.5rem',
  },
  academicCardDesc: {
    fontSize: '0.95rem',
    color: 'var(--grey-blue)',
    lineHeight: '1.6',
  },
  academicStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flex: '1 1 auto',
    justifyContent: 'center',
    background: 'rgba(33, 33, 33, 0.5)',
    padding: '1.25rem 1.75rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  statBox: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--azure)',
    display: 'block',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--l-grey)',
    marginTop: '0.25rem',
    display: 'block',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: 'var(--border-color)',
  },
};
