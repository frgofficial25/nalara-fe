
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Nalara API Documentation",
      "version": "1.0.0",
      "description": "Dokumentasi API untuk sistem autentikasi Nalara"
    },
    "servers": [
      {
        "url": "http://localhost:3000",
        "description": "Development Server"
      }
    ],
    "paths": {
      "/api/users": {
        "post": {
          "summary": "Buat user baru (Admin Level)",
          "description": "Membuat pengguna baru yang secara otomatis disetujui (Active) di Supabase dan Database Prisma. Akan mengembalikan password acak yang di-generate sistem.",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "username",
                    "email",
                    "full_name",
                    "role"
                  ],
                  "properties": {
                    "username": {
                      "type": "string",
                      "example": "budi123"
                    },
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "budi@example.com"
                    },
                    "full_name": {
                      "type": "string",
                      "example": "Budi Santoso"
                    },
                    "role": {
                      "type": "string",
                      "enum": [
                        "SuperAdmin",
                        "User",
                        "Lecturer",
                        "Mentor"
                      ],
                      "example": "User"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "User berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            }
          }
        },
        "get": {
          "summary": "Ambil daftar seluruh user",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar user berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            }
          }
        }
      },
      "/api/users/{id}": {
        "get": {
          "summary": "Ambil data user berdasarkan ID",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna"
            }
          ],
          "responses": {
            "200": {
              "description": "Data user berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "User tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Perbarui data user",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "username": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "full_name": {
                      "type": "string"
                    },
                    "role": {
                      "type": "string",
                      "enum": [
                        "SuperAdmin",
                        "User",
                        "Lecturer",
                        "Mentor"
                      ]
                    },
                    "status": {
                      "type": "string",
                      "enum": [
                        "Pending",
                        "Active",
                        "Inactive"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "User berhasil diperbarui"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "User tidak ditemukan"
            }
          }
        },
        "delete": {
          "summary": "Hapus user dari Supabase dan Database",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna"
            }
          ],
          "responses": {
            "200": {
              "description": "User berhasil dihapus"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "User tidak ditemukan"
            }
          }
        }
      },
      "/api/upload/lesson-image": {
        "post": {
          "summary": "Upload Lesson Image",
          "description": "Uploads an image asset for a lesson. Max size 5MB. Requires Lecturer, Owner, or Admin role.",
          "tags": [
            "Content"
          ],
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary",
                      "description": "The image file to upload (JPEG, PNG, WEBP, GIF)."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully uploaded image",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "url": {
                        "type": "string"
                      },
                      "path": {
                        "type": "string"
                      },
                      "size": {
                        "type": "number"
                      },
                      "type": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Bad request (invalid type, size, or missing file)"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden (insufficient role)"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/api/tugas": {
        "post": {
          "summary": "Tambah Tugas baru (Study Case / Practice)",
          "description": "Membuat tugas baru yang terhubung ke Pembelajaran dan Modul tertentu.\nGunakan tipe CaseStudy atau Practice. Untuk materi bacaan/video, gunakan endpoint /api/materi.\n**Hanya Lecturer yang dapat mengakses endpoint ini.**\nModul yang dipilih harus berada di bawah Pembelajaran yang sama.\nSlug akan di-generate otomatis dari judul.\n",
          "tags": [
            "Tugas"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title",
                    "type",
                    "uuid_pembelajaran",
                    "uuid_modul"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Tugas Membaca Bab 1"
                    },
                    "type": {
                      "type": "string",
                      "enum": [
                        "Reading",
                        "Video",
                        "CaseStudy",
                        "Practice"
                      ],
                      "example": "Reading"
                    },
                    "content": {
                      "type": "object",
                      "description": "Diisi data TipTap (JSON) jika type = Reading"
                    },
                    "youtube_link": {
                      "type": "string",
                      "description": "Diisi dengan URL YouTube jika type = Video"
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Pembelajaran induk",
                      "example": "550e8400-e29b-41d4-a716-446655440000"
                    },
                    "uuid_modul": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Modul yang ada di dalam Pembelajaran tersebut",
                      "example": "660e9500-f39c-52e5-b827-557766551111"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Tugas berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid atau modul tidak berada di bawah pembelajaran yang dipilih"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Pembelajaran atau Modul referensi tidak ditemukan"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        },
        "get": {
          "summary": "Ambil daftar seluruh Tugas (Study Case / Practice)",
          "description": "Mengembalikan semua data tugas beserta informasi pembelajaran dan modul yang direferensikan.\nMendukung filter opsional via query parameter.\n",
          "tags": [
            "Tugas"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "Filter tugas berdasarkan UUID Pembelajaran"
            },
            {
              "in": "query",
              "name": "uuid_modul",
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "Filter tugas berdasarkan UUID Modul"
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar tugas berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/api/tugas/{id}": {
        "get": {
          "summary": "Ambil detail Tugas berdasarkan ID",
          "description": "Mengembalikan detail tugas (Study Case / Practice) beserta informasi pembelajaran dan modul.",
          "tags": [
            "Tugas"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Tugas"
            }
          ],
          "responses": {
            "200": {
              "description": "Detail tugas berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Tugas tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Perbarui data Tugas (Study Case / Practice)",
          "description": "Memperbarui data tugas. Slug akan otomatis diperbarui jika judul berubah.\nJika uuid_modul diubah, modul baru harus berada di bawah pembelajaran yang sama.\n**Hanya Lecturer yang dapat mengakses endpoint ini.**\n",
          "tags": [
            "Tugas"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Tugas"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Tugas Menonton Video Bab 2"
                    },
                    "type": {
                      "type": "string",
                      "enum": [
                        "Reading",
                        "Video",
                        "CaseStudy",
                        "Practice"
                      ],
                      "example": "Video"
                    },
                    "content": {
                      "type": "object",
                      "description": "Diisi data TipTap (JSON) jika type = Reading"
                    },
                    "youtube_link": {
                      "type": "string",
                      "description": "Diisi dengan URL YouTube jika type = Video"
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Pembelajaran (opsional — isi jika ingin mengubah referensi)"
                    },
                    "uuid_modul": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Modul (opsional — isi jika ingin mengubah referensi)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Tugas berhasil diperbarui"
            },
            "400": {
              "description": "type tidak valid atau modul tidak berada di bawah pembelajaran yang dipilih"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Tugas, Pembelajaran, atau Modul tidak ditemukan"
            }
          }
        },
        "delete": {
          "summary": "Hapus Tugas",
          "description": "Menghapus data tugas berdasarkan ID. **Hanya Lecturer yang dapat mengakses endpoint ini.**",
          "tags": [
            "Tugas"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Tugas"
            }
          ],
          "responses": {
            "200": {
              "description": "Tugas berhasil dihapus"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Tugas tidak ditemukan"
            }
          }
        }
      },
      "/api/study-case-submissions/{tugasId}": {
        "post": {
          "summary": "Kumpulkan study case",
          "description": "Student mengirim file ipynb dan pdf. Submission langsung dinilai AI, tetapi nilai baru terlihat oleh student setelah diverifikasi Lecturer dan Mentor.",
          "tags": [
            "Study Case Submissions"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "tugasId",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "required": [
                    "ipynb",
                    "pdf"
                  ],
                  "properties": {
                    "ipynb": {
                      "type": "string",
                      "format": "binary"
                    },
                    "pdf": {
                      "type": "string",
                      "format": "binary"
                    },
                    "student_notes": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Submission berhasil dikumpulkan dan dinilai AI"
            }
          }
        }
      },
      "/api/study-case-submissions/me": {
        "get": {
          "summary": "Lihat submission study case milik student",
          "tags": [
            "Study Case Submissions"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ]
        }
      },
      "/api/study-case-submissions/review-queue": {
        "get": {
          "summary": "Queue verifikasi study case",
          "description": "Menampilkan submission yang belum dirilis untuk diverifikasi Lecturer dan Mentor.",
          "tags": [
            "Study Case Submissions"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ]
        }
      },
      "/api/study-case-submissions/{id}/verify": {
        "patch": {
          "summary": "Verifikasi nilai study case",
          "description": "Lecturer dan Mentor masing-masing memverifikasi submission. Setelah dua-duanya verified, nilai dirilis ke student.",
          "tags": [
            "Study Case Submissions"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ]
        }
      },
      "/api/students": {
        "get": {
          "summary": "Ambil daftar seluruh student",
          "description": "Mengambil data seluruh pengguna dengan role \"User\" beserta metrik progres belajar, status online, dan daftar kursus yang di-assign.",
          "tags": [
            "Students"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar student berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            }
          }
        }
      },
      "/api/students/{id}": {
        "get": {
          "summary": "Ambil detail data student berdasarkan ID",
          "description": "Mengambil data mendetail terkait student termasuk riwayat submission dan quiz attempt.",
          "tags": [
            "Students"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna (student)"
            }
          ],
          "responses": {
            "200": {
              "description": "Data student berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Student tidak ditemukan"
            }
          }
        }
      },
      "/api/students/{id}/urgent-tasks": {
        "get": {
          "summary": "Ambil daftar tugas paling mendesak yang belum dikerjakan (Study Case)",
          "description": "Mengambil tugas-tugas (Study Case / Practice) yang belum pernah di-submit oleh student, diurutkan berdasarkan yang paling lama dibuat (paling mendesak).",
          "tags": [
            "Students"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna (student)"
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar tugas mendesak berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Student tidak ditemukan"
            }
          }
        }
      },
      "/api/students/{id}/streak": {
        "get": {
          "summary": "Ambil data streak login harian student",
          "description": "Menampilkan jumlah streak login berturut-turut, status streak (active/at_risk/broken), dan waktu login terakhir.",
          "tags": [
            "Students"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID pengguna (student)"
            }
          ],
          "responses": {
            "200": {
              "description": "Data streak berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Student tidak ditemukan"
            }
          }
        }
      },
      "/api/quiz": {
        "post": {
          "summary": "Tambah Quiz baru beserta daftar pertanyaan",
          "description": "Membuat kuis baru. **Quiz minimal harus memiliki 10 soal.**\nPassing score ditetapkan otomatis sebesar **75**. Hanya boleh dikerjakan **1 kali**.\n**Hanya Lecturer yang dapat mengakses endpoint ini.**\n",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title",
                    "uuid_pembelajaran",
                    "questions"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Kuis TypeScript Fundamental"
                    },
                    "description": {
                      "type": "string",
                      "example": "Deskripsi lengkap kuis ini"
                    },
                    "deadline": {
                      "type": "string",
                      "format": "date-time",
                      "example": "2026-12-31T23:59:59Z"
                    },
                    "time_limit": {
                      "type": "integer",
                      "description": "Batas waktu dalam menit (null = tanpa batas)",
                      "example": 30
                    },
                    "is_published": {
                      "type": "boolean",
                      "description": "Status publikasi kuis",
                      "example": true
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid",
                      "example": "550e8400-e29b-41d4-a716-446655440000"
                    },
                    "uuid_modul": {
                      "type": "string",
                      "format": "uuid",
                      "description": "Opsional (isi jika kuis bagian dari modul)"
                    },
                    "questions": {
                      "type": "array",
                      "description": "Daftar soal (minimal 10)",
                      "items": {
                        "type": "object",
                        "required": [
                          "question_text",
                          "type",
                          "options"
                        ],
                        "properties": {
                          "question_text": {
                            "type": "string",
                            "example": "Apa output dari typeof null di JavaScript?"
                          },
                          "type": {
                            "type": "string",
                            "enum": [
                              "MultipleChoice",
                              "TrueFalse",
                              "Checkbox"
                            ],
                            "example": "MultipleChoice"
                          },
                          "options": {
                            "type": "array",
                            "description": "Daftar opsi jawaban beserta kunci jawaban",
                            "items": {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "string",
                                  "example": "A"
                                },
                                "text": {
                                  "type": "string",
                                  "example": "object"
                                },
                                "is_correct": {
                                  "type": "boolean",
                                  "example": true
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Quiz berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid atau soal kurang dari 10"
            },
            "403": {
              "description": "Forbidden - bukan Lecturer"
            }
          }
        },
        "get": {
          "summary": "Ambil daftar seluruh Quiz",
          "description": "Mengembalikan daftar kuis dengan filter opsional. Menampilkan rasio pengerjaan (siswa yang mengerjakan / total siswa).",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string"
              },
              "description": "Filter by Pembelajaran UUID"
            },
            {
              "in": "query",
              "name": "uuid_modul",
              "schema": {
                "type": "string"
              },
              "description": "Filter by Modul UUID"
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar quiz berhasil diambil"
            }
          }
        }
      },
      "/api/quiz/rekap": {
        "get": {
          "summary": "Ambil rekap pengerjaan Quiz peserta (Student/User)",
          "description": "Mengembalikan histori seluruh kuis yang dikerjakan beserta status kelulusan (skor >= 75).",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string"
              },
              "description": "Filter rekap hanya untuk pembelajaran tertentu"
            }
          ],
          "responses": {
            "200": {
              "description": "Rekapitulasi berhasil diambil"
            }
          }
        }
      },
      "/api/quiz/{id}": {
        "get": {
          "summary": "Detail Quiz berdasarkan ID beserta daftar pertanyaan",
          "description": "Urutan soal dan opsi jawaban diacak otomatis oleh server.",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Detail quiz berhasil diambil"
            },
            "404": {
              "description": "Quiz tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Perbarui data Quiz beserta pertanyaan",
          "description": "Memperbarui kuis. Jika field `questions` diisi, soal lama akan digantikan. **Minimal 10 soal.** Hanya Lecturer.",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "deadline": {
                      "type": "string",
                      "format": "date-time"
                    },
                    "time_limit": {
                      "type": "integer"
                    },
                    "is_published": {
                      "type": "boolean"
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "uuid_modul": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "questions": {
                      "type": "array",
                      "description": "Jika diisi, seluruh soal lama akan diganti (minimal 10)",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Quiz berhasil diperbarui"
            },
            "400": {
              "description": "Soal kurang dari 10"
            }
          }
        },
        "delete": {
          "summary": "Hapus Quiz",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Quiz berhasil dihapus"
            }
          }
        }
      },
      "/api/quiz/{id}/submit": {
        "post": {
          "summary": "Submit jawaban pengerjaan Quiz peserta",
          "description": "Mengevaluasi jawaban yang dikirim peserta dan mengembalikan hasil akhir (benar, salah, skor 0-100).\nPeserta hanya boleh submit **1 kali**. Passing score ditetapkan **75**.\n",
          "tags": [
            "Quiz"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "answers"
                  ],
                  "properties": {
                    "answers": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": [
                          "uuid_question",
                          "submitted_answer"
                        ],
                        "properties": {
                          "uuid_question": {
                            "type": "string",
                            "format": "uuid"
                          },
                          "submitted_answer": {
                            "description": "ID opsi (string) untuk MC/TF, atau array ID untuk Checkbox",
                            "example": "A"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Hasil quiz berhasil disubmit.\nResponse berisi: benar, salah, skor (0-100).\n"
            },
            "400": {
              "description": "Sudah pernah mengerjakan atau format tidak valid"
            }
          }
        }
      },
      "/api/profile": {
        "get": {
          "summary": "Ambil data profile user yang sedang login",
          "description": "Mengembalikan data profil user yang sesuai dengan Bearer Token yang dikirimkan. Data diambil dari database berdasarkan identitas user pada token.",
          "tags": [
            "Profile"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data profile",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "foto_profile": {
                            "type": "string",
                            "nullable": true
                          },
                          "username": {
                            "type": "string"
                          },
                          "nama_lengkap": {
                            "type": "string"
                          },
                          "email": {
                            "type": "string"
                          },
                          "role": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Token tidak valid atau tidak dikirimkan"
            },
            "404": {
              "description": "Profil tidak ditemukan di database"
            }
          }
        },
        "put": {
          "summary": "Ubah informasi akun (username / full_name)",
          "description": "Memperbarui data profil user yang sedang login berdasarkan Bearer Token.",
          "tags": [
            "Profile"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "username": {
                      "type": "string",
                      "example": "john_doe"
                    },
                    "full_name": {
                      "type": "string",
                      "example": "John Doe"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Profile berhasil diperbarui"
            },
            "400": {
              "description": "Tidak ada field yang dikirimkan"
            },
            "401": {
              "description": "Token tidak valid atau tidak dikirimkan"
            },
            "409": {
              "description": "Username sudah digunakan user lain"
            }
          }
        }
      },
      "/api/profile/password": {
        "put": {
          "summary": "Ganti Password",
          "description": "Mengganti password user dengan validasi (Minimal 8 karakter, ada huruf kapital, huruf kecil, angka, dan simbol khusus). Memerlukan password lama untuk verifikasi.",
          "tags": [
            "Profile"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "password_lama",
                    "password_baru",
                    "konfirmasi_password_baru"
                  ],
                  "properties": {
                    "password_lama": {
                      "type": "string",
                      "example": "OldPass@123"
                    },
                    "password_baru": {
                      "type": "string",
                      "example": "NewPass@123"
                    },
                    "konfirmasi_password_baru": {
                      "type": "string",
                      "example": "NewPass@123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Password berhasil diubah"
            },
            "400": {
              "description": "Validasi password gagal atau password tidak cocok"
            },
            "401": {
              "description": "Token tidak valid atau tidak dikirimkan"
            }
          }
        }
      },
      "/api/profile/avatar": {
        "put": {
          "summary": "Ganti Foto Profil",
          "description": "Upload foto profil baru untuk user yang sedang login berdasarkan Bearer Token.",
          "tags": [
            "Profile"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Foto profil berhasil diubah"
            },
            "401": {
              "description": "Token tidak valid atau tidak dikirimkan"
            }
          }
        }
      },
      "/api/pembelajaran": {
        "post": {
          "summary": "Tambah data Pembelajaran baru",
          "description": "Membuat data pembelajaran baru. **Hanya Lecturer yang dapat mengakses endpoint ini.**\nUUID user akan diambil otomatis dari Bearer Token — tidak perlu disertakan di body.\nSlug akan di-generate otomatis dari judul.\n",
          "tags": [
            "Pembelajaran"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Pengenalan Akuntansi Dasar"
                    },
                    "description": {
                      "type": "string",
                      "example": "Materi pengantar memahami konsep akuntansi dasar"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Pembelajaran berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid (title kosong)"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        },
        "get": {
          "summary": "Ambil daftar seluruh Pembelajaran",
          "description": "Mengembalikan semua data pembelajaran beserta informasi pembuat (creator) dan jumlah modul di dalamnya, menggunakan format Card.",
          "tags": [
            "Pembelajaran"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar pembelajaran berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/api/pembelajaran/{id}": {
        "get": {
          "summary": "Ambil detail Pembelajaran berdasarkan ID (termasuk list Modul dan Materi)",
          "description": "Mengembalikan detail pembelajaran beserta section tiap modul yang berisi daftar kuis dan materi (Reading/Video) lengkap dengan detail file.",
          "tags": [
            "Pembelajaran"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Pembelajaran"
            }
          ],
          "responses": {
            "200": {
              "description": "Detail pembelajaran berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Data tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Perbarui data Pembelajaran",
          "description": "Memperbarui data pembelajaran. Slug akan otomatis diperbarui jika judul berubah. **Hanya Lecturer yang dapat mengakses endpoint ini.**",
          "tags": [
            "Pembelajaran"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Pembelajaran"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Akuntansi Lanjutan"
                    },
                    "description": {
                      "type": "string",
                      "example": "Materi lanjutan akuntansi"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Data berhasil diperbarui"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Data tidak ditemukan"
            }
          }
        },
        "delete": {
          "summary": "Hapus data Pembelajaran",
          "description": "Menghapus data pembelajaran berdasarkan ID. **Hanya Lecturer yang dapat mengakses endpoint ini.**",
          "tags": [
            "Pembelajaran"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Pembelajaran"
            }
          ],
          "responses": {
            "200": {
              "description": "Data berhasil dihapus"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Data tidak ditemukan"
            }
          }
        }
      },
      "/api/modul": {
        "post": {
          "summary": "Tambah Modul baru",
          "description": "Membuat modul baru yang terhubung ke Pembelajaran tertentu. **Hanya Lecturer yang dapat mengakses endpoint ini.**\nUUID user diambil otomatis dari Bearer Token — tidak perlu disertakan di body.\nSlug akan di-generate otomatis dari judul.\n",
          "tags": [
            "Modul"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title",
                    "uuid_pembelajaran"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Modul Pengantar Keuangan"
                    },
                    "description": {
                      "type": "string",
                      "example": "Penjelasan konsep dasar keuangan pribadi"
                    },
                    "difficulty": {
                      "type": "string",
                      "enum": [
                        "Beginner",
                        "Intermediate",
                        "Advanced"
                      ],
                      "example": "Beginner"
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Pembelajaran yang menjadi referensi/induk modul ini",
                      "example": "550e8400-e29b-41d4-a716-446655440000"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Modul berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid (title atau uuid_pembelajaran kosong)"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Pembelajaran referensi tidak ditemukan"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        },
        "get": {
          "summary": "Ambil daftar seluruh Modul",
          "description": "Mengembalikan semua data modul beserta informasi pembuat (creator) dan pembelajaran yang direferensikan.",
          "tags": [
            "Modul"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar modul berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/api/modul/{id}": {
        "get": {
          "summary": "Ambil detail Modul berdasarkan ID",
          "description": "Mengembalikan detail modul beserta informasi pembuat dan pembelajaran yang direferensikan.",
          "tags": [
            "Modul"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Modul"
            }
          ],
          "responses": {
            "200": {
              "description": "Detail modul berhasil diambil"
            },
            "401": {
              "description": "API Key tidak valid atau tidak disertakan"
            },
            "404": {
              "description": "Modul tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Perbarui data Modul",
          "description": "Memperbarui data modul. Slug akan otomatis diperbarui jika judul berubah.\nuuid_pembelajaran dapat diubah untuk memindahkan modul ke pembelajaran lain.\n**Hanya Lecturer yang dapat mengakses endpoint ini.**\n",
          "tags": [
            "Modul"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Modul"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Modul Keuangan Lanjutan"
                    },
                    "description": {
                      "type": "string",
                      "example": "Konsep keuangan tingkat lanjut"
                    },
                    "difficulty": {
                      "type": "string",
                      "enum": [
                        "Beginner",
                        "Intermediate",
                        "Advanced"
                      ],
                      "example": "Intermediate"
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid",
                      "description": "UUID Pembelajaran referensi (opsional — isi jika ingin mengubah referensi)",
                      "example": "550e8400-e29b-41d4-a716-446655440000"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Modul berhasil diperbarui"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Modul atau Pembelajaran referensi tidak ditemukan"
            }
          }
        },
        "delete": {
          "summary": "Hapus Modul",
          "description": "Menghapus data modul berdasarkan ID. **Hanya Lecturer yang dapat mengakses endpoint ini.**",
          "tags": [
            "Modul"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Modul"
            }
          ],
          "responses": {
            "200": {
              "description": "Modul berhasil dihapus"
            },
            "401": {
              "description": "Token tidak valid atau tidak disertakan"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            },
            "404": {
              "description": "Modul tidak ditemukan"
            }
          }
        }
      },
      "/api/materi": {
        "get": {
          "summary": "List materi dalam modul (card view)",
          "description": "Mengambil daftar materi untuk sebuah modul dalam format card.\nJuga mengembalikan metadata halaman (nama pembelajaran, nama modul).\n",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_modul",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              },
              "description": "UUID Modul"
            }
          ],
          "responses": {
            "200": {
              "description": "Daftar materi berhasil diambil"
            },
            "400": {
              "description": "uuid_modul tidak disertakan"
            },
            "404": {
              "description": "Modul tidak ditemukan"
            }
          }
        },
        "post": {
          "summary": "Tambah materi baru (nama + tipe, belum ada file)",
          "description": "Membuat entri materi baru. File bisa diupload setelah pembuatan via endpoint upload.\nNomor urut (order_index) ditentukan otomatis berdasarkan urutan terakhir dalam modul.\n",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "title",
                    "type",
                    "uuid_pembelajaran",
                    "uuid_modul"
                  ],
                  "properties": {
                    "title": {
                      "type": "string",
                      "example": "Pengenalan Laporan Keuangan"
                    },
                    "type": {
                      "type": "string",
                      "enum": [
                        "Reading",
                        "Video"
                      ]
                    },
                    "uuid_pembelajaran": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "uuid_modul": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "video_url": {
                      "type": "string",
                      "description": "URL YouTube/eksternal (opsional, hanya untuk tipe Video)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Materi berhasil dibuat"
            },
            "400": {
              "description": "Input tidak valid"
            },
            "403": {
              "description": "Forbidden — bukan Lecturer"
            }
          }
        }
      },
      "/api/materi/{id}": {
        "get": {
          "summary": "Detail materi (nama, file preview, export)",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Detail materi berhasil diambil"
            },
            "404": {
              "description": "Materi tidak ditemukan"
            }
          }
        },
        "put": {
          "summary": "Update judul, tipe, atau urutan materi",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "type": {
                      "type": "string",
                      "enum": [
                        "Reading",
                        "Video"
                      ]
                    },
                    "order_index": {
                      "type": "integer"
                    },
                    "video_url": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Materi berhasil diperbarui"
            },
            "404": {
              "description": "Materi tidak ditemukan"
            }
          }
        },
        "delete": {
          "summary": "Hapus materi beserta file dari storage",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Materi berhasil dihapus"
            },
            "404": {
              "description": "Materi tidak ditemukan"
            }
          }
        }
      },
      "/api/materi/{id}/upload": {
        "post": {
          "summary": "Upload file untuk materi",
          "description": "Upload file ke Supabase Storage dan simpan metadata ke database.\n- Tipe **Reading**: menerima PDF, DOCX, PPT, PPTX\n- Tipe **Video**: menerima MP4, WebM, MOV, AVI\n- Ukuran maksimal: 100MB\n",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "File berhasil diupload"
            },
            "400": {
              "description": "File tidak valid atau ukuran terlalu besar"
            },
            "404": {
              "description": "Materi tidak ditemukan"
            }
          }
        }
      },
      "/api/materi/{id}/file": {
        "delete": {
          "summary": "Hapus file dari materi (materi tetap ada)",
          "description": "Menghapus file dari Supabase Storage, tapi record materi tetap dipertahankan.",
          "tags": [
            "Materi"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "string",
                "format": "uuid"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "File berhasil dihapus"
            },
            "400": {
              "description": "Materi tidak memiliki file"
            },
            "404": {
              "description": "Materi tidak ditemukan"
            }
          }
        }
      },
      "/api/grade-center/students": {
        "get": {
          "summary": "Ambil data nilai semua peserta (Lecturer/SuperAdmin)",
          "description": "Mengambil rekap nilai peserta, termasuk persentase, grade letter, dan status lulus.",
          "tags": [
            "Grade Center"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Pembelajaran"
            },
            {
              "in": "query",
              "name": "uuid_modul",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Modul"
            },
            {
              "in": "query",
              "name": "uuid_quiz",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Quiz"
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data nilai peserta"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/api/grade-center/analytics": {
        "get": {
          "summary": "Ambil data analitik nilai (Lecturer/SuperAdmin)",
          "description": "Mengambil ringkasan analitik seperti rata-rata keseluruhan, tingkat kelulusan, rasio pass/fail, dan distribusi grade.",
          "tags": [
            "Grade Center"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Pembelajaran"
            },
            {
              "in": "query",
              "name": "uuid_modul",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Modul"
            },
            {
              "in": "query",
              "name": "uuid_quiz",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Quiz"
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data analitik"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/api/grade-center/review-queue": {
        "get": {
          "summary": "Ambil antrian soal yang perlu dinilai manual (Lecturer/SuperAdmin)",
          "description": "Mengambil daftar soal (biasanya tipe Essay) yang butuh penilaian (needs_review = true).",
          "tags": [
            "Grade Center"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_quiz",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Quiz"
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil antrian penilaian"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/api/grade-center/review/{attemptId}/{questionId}": {
        "post": {
          "summary": "Submit nilai untuk soal manual (Lecturer/SuperAdmin)",
          "description": "Menyimpan nilai (dan feedback) untuk soal essay dari peserta tertentu, dan mengkalkulasi ulang total skor quiz.",
          "tags": [
            "Grade Center"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "path",
              "name": "attemptId",
              "required": true,
              "schema": {
                "type": "string"
              },
              "description": "UUID Attempt dari quiz yang dikerjakan peserta"
            },
            {
              "in": "path",
              "name": "questionId",
              "required": true,
              "schema": {
                "type": "string"
              },
              "description": "UUID Soal yang sedang dinilai"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "earned_score"
                  ],
                  "properties": {
                    "earned_score": {
                      "type": "number",
                      "description": "Nilai yang diberikan (0 sampai bobot maksimal soal)"
                    },
                    "feedback": {
                      "type": "string",
                      "description": "Pesan atau feedback dari penilai"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Penilaian berhasil disimpan"
            },
            "400": {
              "description": "Input tidak valid"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Attempt atau soal tidak ditemukan"
            }
          }
        }
      },
      "/api/grade-center/my-grades": {
        "get": {
          "summary": "Ambil data nilai saya sendiri (Student/User)",
          "description": "Peserta dapat melihat daftar nilainya sendiri.",
          "tags": [
            "Grade Center"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "parameters": [
            {
              "in": "query",
              "name": "uuid_pembelajaran",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Pembelajaran"
            },
            {
              "in": "query",
              "name": "uuid_modul",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Modul"
            },
            {
              "in": "query",
              "name": "uuid_quiz",
              "schema": {
                "type": "string"
              },
              "description": "Filter berdasarkan UUID Quiz"
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data nilai sendiri"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "User tidak ditemukan"
            }
          }
        }
      },
      "/api/enroll": {
        "get": {
          "summary": "Get eligible students for enrollment",
          "description": "Mengambil daftar student yang bisa diberikan akses kelas (untuk search/list).",
          "tags": [
            "Enroll"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil daftar student"
            },
            "401": {
              "description": "API Key tidak valid"
            }
          }
        },
        "post": {
          "summary": "Berikan Akses Kelas (Enroll)",
          "description": "Memberikan akses suatu kelas kepada satu atau lebih Student secara spesifik. Sistem akan mengirim email pemberitahuan ke student.",
          "tags": [
            "Enroll"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "course_id",
                    "student_ids"
                  ],
                  "properties": {
                    "course_id": {
                      "type": "string",
                      "example": "course-uuid"
                    },
                    "student_ids": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "example": [
                        "student-1",
                        "student-2"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Berhasil memberikan akses kelas"
            },
            "400": {
              "description": "Input tidak valid"
            },
            "401": {
              "description": "API Key tidak valid"
            }
          }
        }
      },
      "/api/dashboard/superadmin": {
        "get": {
          "summary": "Get SuperAdmin Dashboard",
          "description": "Mengembalikan agregasi data seluruh pengguna di platform.",
          "tags": [
            "Dashboard"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data dashboard",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "total_users": {
                            "type": "integer",
                            "example": 1500
                          },
                          "total_students": {
                            "type": "integer",
                            "example": 1200
                          },
                          "total_lecturers": {
                            "type": "integer",
                            "example": 50
                          },
                          "total_tentors": {
                            "type": "integer",
                            "example": 250
                          },
                          "signed_in_users": {
                            "type": "integer",
                            "example": 320
                          },
                          "inactive_users": {
                            "type": "integer",
                            "example": 15
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "API Key tidak valid"
            },
            "500": {
              "description": "Terjadi kesalahan pada server"
            }
          }
        }
      },
      "/api/dashboard/lecturer": {
        "get": {
          "summary": "Get Lecturer Dashboard",
          "description": "Mengembalikan data kelas dan submission untuk lecturer. \nTerdapat data `tugas_mendesak` (Hero Card) yang menampilkan daftar tugas Study Case dengan penilaian yang belum diverifikasi,\nlengkap dengan Nama Tugas, Kelas Asal, Modul Asal, Rasio Pengumpulan, dan Tenggat Verifikasi.\n",
          "tags": [
            "Dashboard"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data dashboard"
            },
            "401": {
              "description": "Token/API Key tidak valid atau tidak disertakan"
            }
          }
        }
      },
      "/api/dashboard/student": {
        "get": {
          "summary": "Get Student Dashboard",
          "description": "Mengembalikan progres belajar, ujian, dan tugas student.\nTerdapat data `current_level`, `learning_streak`, dan `tugas_mendesak` (Tugas/Study Case yang belum dikerjakan) \nlengkap dengan nama tugas, pembelajaran asal, dan modul asal.\n",
          "tags": [
            "Dashboard"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data dashboard",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "current_level": {
                            "type": "string",
                            "example": "Pemula"
                          },
                          "learning_streak": {
                            "type": "integer",
                            "example": 5
                          },
                          "tugas_mendesak": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "id_tugas": {
                                  "type": "string"
                                },
                                "nama_tugas": {
                                  "type": "string"
                                },
                                "pembelajaran_asal": {
                                  "type": "string"
                                },
                                "modul_asal": {
                                  "type": "string"
                                },
                                "tipe": {
                                  "type": "string"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Token/API Key tidak valid atau tidak disertakan"
            }
          }
        }
      },
      "/api/dashboard/tentor": {
        "get": {
          "summary": "Get Tentor Dashboard",
          "description": "Mengembalikan data kelas yang diampu dan submission untuk tentor.",
          "tags": [
            "Dashboard"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "Berhasil mengambil data dashboard"
            },
            "401": {
              "description": "API Key tidak valid"
            }
          }
        }
      },
      "/api/auth/login": {
        "post": {
          "summary": "Login user dengan email dan password",
          "tags": [
            "Auth"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "email",
                    "password"
                  ],
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email",
                      "example": "user@example.com"
                    },
                    "password": {
                      "type": "string",
                      "example": "password123"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Login sukses",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string",
                        "example": "Login berhasil"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "type": "object",
                            "properties": {
                              "email": {
                                "type": "string",
                                "example": "user@example.com"
                              },
                              "name": {
                                "type": "string",
                                "example": "Budi Santoso"
                              },
                              "role": {
                                "type": "string",
                                "example": "user"
                              }
                            }
                          },
                          "token": {
                            "type": "string",
                            "example": "dummy-jwt-token-xyz123"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              "description": "Input tidak lengkap (email/password kosong)",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": false
                      },
                      "message": {
                        "type": "string",
                        "example": "Email dan password wajib diisi"
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Email atau password salah",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": false
                      },
                      "message": {
                        "type": "string",
                        "example": "Email atau password salah"
                      }
                    }
                  }
                }
              }
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/api/auth/logout": {
        "post": {
          "summary": "Logout user",
          "tags": [
            "Auth"
          ],
          "responses": {
            "200": {
              "description": "Logout sukses",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean",
                        "example": true
                      },
                      "message": {
                        "type": "string",
                        "example": "Logout berhasil"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/auth/refresh": {
        "post": {
          "summary": "Refresh token menggunakan refresh_token",
          "description": "Digunakan ketika access_token sudah kedaluwarsa.",
          "tags": [
            "Auth"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "refresh_token"
                  ],
                  "properties": {
                    "refresh_token": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Token berhasil diperbarui"
            },
            "401": {
              "description": "Refresh token tidak valid atau expired (harus auto logout di frontend)"
            }
          }
        }
      },
      "/api/ai/generate-reading": {
        "post": {
          "summary": "Generate Konten Reading menggunakan AI (Groq)",
          "description": "Menghasilkan konten Reading terstruktur dalam format HTML menggunakan Groq LLM.\nAI akan menyesuaikan konten berdasarkan **lessonTitle** dan **moduleDescription** dari modul yang dipilih.\nRespons dikirim dalam bentuk **streaming text** (bukan JSON).\nHanya Lecturer dan SuperAdmin yang dapat mengakses endpoint ini.\n",
          "tags": [
            "AI Generator"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "prompt"
                  ],
                  "properties": {
                    "prompt": {
                      "type": "string",
                      "description": "Topik atau instruksi untuk konten yang akan dibuat",
                      "example": "Jelaskan konsep async/await dalam JavaScript"
                    },
                    "lessonTitle": {
                      "type": "string",
                      "description": "Judul modul/lesson untuk konteks AI (ambil dari data modul)",
                      "example": "JavaScript Asynchronous Programming"
                    },
                    "moduleDescription": {
                      "type": "string",
                      "description": "Deskripsi modul untuk konteks tambahan agar AI lebih relevan",
                      "example": "Modul ini membahas cara kerja JavaScript secara asynchronous menggunakan Promise dan async/await"
                    },
                    "language": {
                      "type": "string",
                      "enum": [
                        "en",
                        "id"
                      ],
                      "default": "id",
                      "description": "Bahasa output konten"
                    },
                    "refineMode": {
                      "type": "boolean",
                      "description": "Jika true, AI akan memperbaiki draf yang sudah ada",
                      "example": false
                    },
                    "existingContent": {
                      "type": "string",
                      "description": "Draf konten yang ingin diperbaiki (hanya relevan jika refineMode = true)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Stream teks HTML berhasil dikirim"
            },
            "400": {
              "description": "Prompt tidak disertakan atau terlalu panjang"
            },
            "401": {
              "description": "Token tidak valid"
            },
            "403": {
              "description": "Forbidden - bukan Lecturer atau SuperAdmin"
            },
            "502": {
              "description": "Gagal menghubungi Groq API"
            }
          }
        }
      },
      "/api/ai/generate-questions": {
        "post": {
          "summary": "Generate Soal Quiz dari Materi Reading menggunakan AI (Groq)",
          "description": "Menghasilkan soal quiz dalam berbagai format berdasarkan materi reading yang diberikan.\nOutput JSON **langsung kompatibel** dengan payload Create Quiz di frontend Nalara.\nTipe soal dan tingkat kesulitan disesuaikan dengan enum Nalara.\nHanya Lecturer dan SuperAdmin yang dapat mengakses endpoint ini.\n",
          "tags": [
            "AI Generator"
          ],
          "security": [
            {
              "ApiKeyAuth": []
            },
            {
              "BearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "readingMaterial",
                    "counts"
                  ],
                  "properties": {
                    "readingMaterial": {
                      "type": "string",
                      "description": "Teks materi reading yang menjadi sumber soal (minimal 80 karakter)",
                      "example": "JavaScript adalah bahasa pemrograman yang berjalan di browser. Async/await memungkinkan kode asynchronous ditulis seperti synchronous."
                    },
                    "lessonTitle": {
                      "type": "string",
                      "description": "Judul modul/lesson (ambil dari data modul)",
                      "example": "JavaScript Asynchronous Programming"
                    },
                    "moduleDescription": {
                      "type": "string",
                      "description": "Deskripsi modul agar AI dapat membuat soal yang lebih relevan",
                      "example": "Modul tentang async/await, Promise, dan event loop JavaScript"
                    },
                    "prompt": {
                      "type": "string",
                      "description": "Instruksi tambahan dari dosen untuk pembuatan soal",
                      "example": "Fokus pada kasus penggunaan Promise chaining dan error handling"
                    },
                    "language": {
                      "type": "string",
                      "enum": [
                        "en",
                        "id"
                      ],
                      "default": "id"
                    },
                    "difficulty": {
                      "type": "string",
                      "enum": [
                        "Beginner",
                        "Intermediate",
                        "Advanced"
                      ],
                      "default": "Intermediate",
                      "description": "Target tingkat kesulitan keseluruhan soal"
                    },
                    "counts": {
                      "type": "object",
                      "description": "Jumlah soal per tipe (total maksimum 25).\nTipe disesuaikan dengan enum Nalara.\n",
                      "properties": {
                        "MultipleChoice": {
                          "type": "integer",
                          "description": "Pilihan ganda (1 jawaban benar, 4 opsi A-D)",
                          "example": 3
                        },
                        "TrueFalse": {
                          "type": "integer",
                          "description": "Benar atau Salah",
                          "example": 2
                        },
                        "MultiSelect": {
                          "type": "integer",
                          "description": "Pilihan ganda banyak (lebih dari 1 jawaban benar)",
                          "example": 2
                        },
                        "Numeric": {
                          "type": "integer",
                          "description": "Jawaban berupa angka",
                          "example": 1
                        },
                        "Essay": {
                          "type": "integer",
                          "description": "Uraian (dinilai manual)",
                          "example": 1
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Soal berhasil dibuat dalam format JSON yang kompatibel dengan payload Frontend Nalara.\nContoh satu item soal yang dikembalikan:\n```json\n{\n  \"type\": \"MultipleChoice\",\n  \"question_text\": \"Apa yang dimaksud dengan async/await?\",\n  \"difficulty\": \"Intermediate\",\n  \"weight\": 2,\n  \"explanation\": \"Async/await adalah sintaks untuk menulis kode asynchronous...\",\n  \"options\": [\n    { \"id\": \"A\", \"text\": \"Cara menulis kode synchronous\", \"is_correct\": false },\n    { \"id\": \"B\", \"text\": \"Sintaks untuk menulis kode asynchronous secara lebih mudah\", \"is_correct\": true },\n    { \"id\": \"C\", \"text\": \"Library tambahan JavaScript\", \"is_correct\": false },\n    { \"id\": \"D\", \"text\": \"Fungsi bawaan browser\", \"is_correct\": false }\n  ]\n}\n```\n"
            },
            "400": {
              "description": "Input tidak valid atau materi terlalu pendek"
            },
            "401": {
              "description": "Token tidak valid"
            },
            "403": {
              "description": "Forbidden - bukan Lecturer atau SuperAdmin"
            },
            "502": {
              "description": "Gagal menghubungi Groq API"
            }
          }
        }
      }
    },
    "components": {
      "securitySchemes": {
        "ApiKeyAuth": {
          "type": "apiKey",
          "in": "header",
          "name": "x-api-key",
          "description": "Masukkan API Key Anda untuk mengakses endpoint ini"
        }
      }
    },
    "tags": []
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
