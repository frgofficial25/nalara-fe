import React, { useState } from 'react';

type LevelTab = 'dasar' | 'menengah' | 'advanced';

export default function Curriculum() {
  const [activeTab, setActiveTab] = useState<LevelTab>('dasar');

  const tabData = {
    dasar: {
      title: 'Level Dasar (Preparatory)',
      duration: '32 Jam Instruksional',
      dates: '23, 24, 25, 26, 27 Juli',
      schedule: [
        { day: 'Rabu, 22 Juli 2026', topic: 'Technical Meeting (100 Menit)', desc: 'Onboarding LMS Nalara.academy, instalasi tools, setup environment, & pengumuman case pitching. Dipandu oleh Muhammad Hafiizh Anindya.' },
        { day: 'Kamis, 23 Juli 2026', topic: 'Modul 1: Python Programming & OOP', desc: 'Sintaks Python lanjutan, NumPy, konsep dasar Object-Oriented Programming (OOP) untuk penulisan kode yang modular dan terstruktur.' },
        { day: 'Jumat, 24 Juli 2026', topic: 'Modul 2: Fondasi AI & Machine Learning — Data Tabular', desc: 'Pemahaman data & statistik deskriptif, preprocessing (KNN Imputer, outlier winsorizing), feature engineering (datetime, aggregasi), pencegahan data leakage, penanganan class imbalance (SMOTE), serta pemodelan (8 algoritma klasik), evaluasi (PR-AUC), dan interpretasi model (SHAP, LIME).' },
        { day: 'Sabtu, 25 Juli 2026', topic: 'Modul 3: Fondasi Data Citra & OpenCV', desc: 'Citra digital sebagai matriks angka (piksel, resolusi, bit depth), konversi ruang warna (Grayscale, RGB, HSV), transformasi geometri (resize, crop, rotasi, flip), filter spasial (Gaussian/Median Blur), deteksi tepi (Canny/Sobel), histogram equalization/CLAHE, dan class ImageProcessor.' },
        { day: 'Minggu, 26 Juli 2026', topic: 'Modul 4: Exploratory Data Analysis (EDA) Data Citra', desc: 'Struktur folder dataset, train/val/test split, visualisasi histogram intensitas piksel, deteksi class imbalance, analisis dimensi & kualitas citra (corrupt, duplikat, blur, distorsi), analisis bounding box (deteksi objek) & mask (segmentasi), serta konsep domain shift.' },
        { day: 'Senin, 27 Juli 2026', topic: 'Modul 5: Machine Learning Klasik untuk Data Citra & Ujian Dasar', desc: 'Augmentasi gambar, curse of dimensionality, ekstraksi fitur (Color Histogram), klasifikasi supervised (KNN, SVM), evaluasi model (confusion matrix, PR/F1-score), unsupervised learning (K-Means & Color Quantization), kompresi gambar, analisis batas kemampuan ML klasik (hand-crafted features), serta evaluasi akhir tingkat dasar.' }
      ]
    },
    menengah: {
      title: 'Level Menengah (Intermediate)',
      duration: '32 Jam Instruksional',
      dates: '31 Juli, 1, 2, 3 Agustus',
      schedule: [
        { day: 'Kamis, 30 Juli 2026', topic: 'Review Evaluasi Level Dasar', desc: 'Analisis hasil ujian level dasar, pembahasan feedback coding portofolio, dan sinkronisasi tools model menengah.' },
        { day: 'Jumat, 31 Juli 2026', topic: 'Modul 6: Fundamental Deep Learning & CNN', desc: 'Arsitektur Neural Network (neuron, weight, activation function ReLU/Sigmoid/Softmax), forward pass & backpropagation secara konseptual, optimizer (Adam), dataset Fashion MNIST, "The Big 4 Layers" CNN (Convolutional, Pooling, Flatten, Dense), regularisasi (Dropout, Early Stopping, Data Augmentation), serta visualisasi training curve.' },
        { day: 'Sabtu, 1 Agustus 2026', topic: 'Modul 7: Image Classification & Transfer Learning', desc: 'Penggunaan Pre-Trained Models (VGG, ResNet, MobileNet, EfficientNet) yang dilatih di ImageNet, teknik Feature Extraction (membekukan base model), teknik Fine-Tuning (membuka kunci & melatih layer teratas dengan learning rate rendah), evaluasi model, interpretability dengan Grad-CAM & Saliency Map, serta uji signifikansi (McNemar, bootstrap).' },
        { day: 'Minggu, 2 Agustus 2026', topic: 'Modul 8: Object Detection', desc: 'Deteksi multi-objek menggunakan arsitektur YOLO, anatomi bounding box, IoU, live inference YOLOv8n, grid-based approach vs sliding window, metrik evaluasi mAP & confidence threshold, ekstraksi data ke JSON, class imbalance level objek (focal loss), penanganan objek kecil, custom object detection training, format anotasi (COCO, Pascal VOC, YOLO), dan video tracking (Kalman Filter, Hungarian Algorithm).' },
        { day: 'Senin, 3 Agustus 2026', topic: 'Modul 9: Image Segmentation & Ujian Menengah', desc: 'Semantic vs instance segmentation, arsitektur U-Net (encoder-decoder, skip connection), inference YOLOv8n-seg, metrik evaluasi (IoU, Dice Coefficient), konversi mask ke metrik bisnis (luas area kerusakan), Segment Anything Model (SAM) untuk zero-shot & promptable segmentation, serta evaluasi akhir tingkat menengah & visualisasi Virtual Background.' }
      ]
    },
    advanced: {
      title: 'Level Advanced (MLOps)',
      duration: '32 Jam Instruksional',
      dates: '7, 8, 9, 10 Agustus',
      schedule: [
        { day: 'Kamis, 6 Agustus 2026', topic: 'Modul 10: Briefing Project Akhir & Hybrid Pipeline', desc: 'Pembagian tim proyek, pengumuman studi kasus hybrid pipeline, dan konsultasi arsitektur deployment.' },
        { day: 'Jumat, 7 Agustus 2026', topic: 'Modul 11: MLOps Automation Lifecycle', desc: 'Version control untuk model (DVC), tracking eksperimen menggunakan MLflow, dan pembuatan docker image untuk environment model.' },
        { day: 'Sabtu, 8 Agustus 2026', topic: 'Modul 12: Production API & Cloud Deployment', desc: 'Membangun REST API performa tinggi dengan FastAPI, deployment model ke Kubernetes/Cloud Engine, dan monitoring model drift.' },
        { day: 'Minggu, 9 Agustus 2026', topic: 'Modul 13: Pitching Project Evaluated by Industry Reviewers', desc: 'Presentasi hasil proyek akhir di depan Dosen Pembina & reviewer industri terkemuka untuk validasi kelayakan produk.' },
        { day: 'Senin, 10 Agustus 2026', topic: 'Graduation Ceremony & Career Networking', desc: 'Penyerahan sertifikat kelulusan resmi FRG FILKOM UB, sesi networking alumni, dan tips integrasi portofolio ke rekrutmen.' }
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
