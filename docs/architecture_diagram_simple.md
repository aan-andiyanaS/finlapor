# System Workflow & Architecture

This document explains the system architecture based on `diagram-block-sistem.png` and details the initial setup workflow.

## 1. System Block Diagram Overview

The system consists of three main units:

1.  **Wearable Head Unit (IoT Device)**
    *   **ESP32-S3 (N16R8):** The core controller.
    *   **OV2640 Camera:** Captures visual data.
    *   **VL53L5CX ToF Sensor:** Measures distance (depth sensing).
    *   **Connectivity:** Communicates via WiFi (WebSocket) and Bluetooth (Provisioning).

2.  **Processing Unit (Smartphone)**
    *   **Kotlin App:** Acts as the central hub and WebSocket Server.
    *   **AI Processing:** Uses NPU/GPU to run YOLOv11 Nano (TFLite) for object detection.
    *   **Logic Fusion:** Combines visual data and distance data to make decisions.

3.  **User Interaction Unit**
    *   **Audio Output:** Text-to-Speech feedback via Bluetooth earphones.
    *   **Audio Input:** Voice commands via microphone.

## 2. Initial Setup Workflow (Provisioning)

The following flowchart illustrates the process when the device is turned on for the first time.

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart LR
    %% Phase 1: Inisialisasi
    subgraph P1["Inisialisasi"]
        direction TB
        Start([Mulai:<br/>Nyalakan Perangkat])
        ActivateBLE[BLE Aktif]
        UserAction[/User: Nyalakan<br/>Bluetooth & Hotspot/]
        Start --> ActivateBLE --> UserAction
    end

    %% Phase 2: Koneksi BLE
    subgraph P2["Koneksi BLE"]
        direction TB
        OpenApp[User: Buka Aplikasi]
        ScanBLE[App: Menu Scan BLE]
        SelectDev[User: Pilih<br/>Perangkat IoT]
        ConnectBLE[Terkoneksi via BLE]
        OpenApp --> ScanBLE --> SelectDev --> ConnectBLE
    end

    %% Phase 3: Provisioning WiFi
    subgraph P3["Provisioning WiFi"]
        direction TB
        ScanWiFi[IoT: Scan WiFi]
        ListWiFi[App: Daftar WiFi]
        SelectWiFi[User: Pilih Hotspot]
        SendCreds[Kirim Kredensial WiFi]
        ConnectWiFi[IoT: Koneksi WiFi]
        CheckConn{Terkoneksi?}
        ScanWiFi --> ListWiFi --> SelectWiFi --> SendCreds --> ConnectWiFi --> CheckConn
        CheckConn -- Tidak --> ScanWiFi
    end

    %% Phase 4: Aktivasi
    subgraph P4["Aktivasi"]
        direction TB
        SaveCreds[Simpan WiFi<br/>ke NVS]
        ActivateSystem[Sistem Aktif]
        End([Selesai])
        SaveCreds --> ActivateSystem --> End
    end

    %% Inter-phase connections
    UserAction --> OpenApp
    ConnectBLE --> ScanWiFi
    CheckConn -- Ya --> SaveCreds

    %% Styling
    classDef mobile fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef iot fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef user fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    class OpenApp,ScanBLE,ListWiFi,SendCreds,ActivateSystem mobile;
    class Start,ActivateBLE,ScanWiFi,ConnectWiFi,SaveCreds,End iot;
    class UserAction,SelectDev,SelectWiFi user;
```

### Penjelasan Alur:

1.  **Memulai Program:**
    *   Nyalakan perangkat IoT.
    *   BLE pada perangkat IoT akan otomatis aktif (advertising).
2.  **Aksi User:**
    *   User menyalakan Bluetooth dan Hotspot pada smartphone.
    *   User membuka aplikasi Android.
3.  **Scanning & Koneksi BLE:**
    *   Aplikasi menampilkan menu scan BLE.
    *   User memilih perangkat IoT yang muncul di daftar scan.
4.  **Provisioning WiFi:**
    *   Setelah terkoneksi via BLE, perangkat IoT melakukan scanning WiFi di sekitar.
    *   Hasil scan dikirim ke aplikasi via BLE.
    *   User memilih WiFi (Hotspot Smartphone) dan perangkat IoT akan mencoba terhubung.
5.  **Aktivasi Sistem:**
    *   Jika koneksi WiFi berhasil, perangkat IoT menyimpan kredensial WiFi ke memori (NVS).
    *   Sistem pada blok Mobile (Processing Unit) akan aktif sepenuhnya (siap menerima stream data).

```mermaid
flowchart TD
    START([Mulai]) --> INIT[Inisialisasi Hardware:\nESP32, Kamera, VL53L5CX]
    INIT --> CEK_WIFI{Cek Koneksi WiFi?}
    
    %% LOGIKA OFFLINE / FAIL-SAFE
    CEK_WIFI -- Putus > 5 Detik --> MODE_SAFETY[MODE SAFETY / OFFLINE]
    MODE_SAFETY --> CAM_OFF[Matikan Kamera]
    MODE_SAFETY --> BACA_SENSOR_OFF[Baca Sensor Jarak VL53L5CX]
    BACA_SENSOR_OFF --> LOGIKA_BUZZER{Jarak < 1 Meter?}
    LOGIKA_BUZZER -- Ya --> BUZZ_ON[Bunyikan Buzzer]
    LOGIKA_BUZZER -- Tidak --> BUZZ_OFF[Buzzer Diam]
    BUZZ_ON --> RETRY[Coba Reconnect WiFi]
    BUZZ_OFF --> RETRY
    RETRY --> CEK_WIFI

    %% LOGIKA ONLINE
    CEK_WIFI -- Terhubung --> CEK_CAHAYA{Cek Kecerahan?}
    
    %% LOGIKA GELAP
    CEK_CAHAYA -- Gelap --> MODE_LOW[MODE LOW-LIGHT]
    MODE_LOW --> CAM_LOW[Kamera Low FPS]
    MODE_LOW --> STOP_STREAM[Stop Video Streaming]
    MODE_LOW --> BACA_SENSOR_OFF
    
    %% LOGIKA TERANG (SMART)
    CEK_CAHAYA -- Terang --> MODE_SMART[MODE SMART / AI]
    MODE_SMART --> KIRIM_DATA[Kirim Video + Data Jarak ke HP]
    KIRIM_DATA --> YOLO[Proses AI YOLOv11]
    YOLO --> MAPPING[Mapping Grid Sensor & Arah Jam]
    MAPPING --> CEK_MODE{Mode Otonom?}
    
    %% LOGIKA OUTPUT
    CEK_MODE -- Ya --> FILTER_BAHAYA{Objek < 1 Meter & Depan?}
    FILTER_BAHAYA -- Ya --> TTS_WARN[Suara Peringatan: AWAS]
    FILTER_BAHAYA -- Tidak --> SILENT[Diam]
    
    CEK_MODE -- Tidak (Tanya) --> TTS_INFO[Suara Info: Objek + Arah Jam]
    
    TTS_WARN --> LOOP((Loop))
    SILENT --> LOOP
    TTS_INFO --> LOOP
    LOOP --> CEK_WIFI 
```

```mermaid
---
config:
  layout: dagre
---
flowchart LR
    MODE_SMART(["Mode <br>Smart / AI"]) --> CEK_GERAK{"Accelerometer:<br>User Bergerak?"}
    CEK_GERAK -- Diam <br>&gt; 10 Detik --> PAUSE_YOLO["Pause <br>YOLO<br>&amp; <br>Streaming"]
    PAUSE_YOLO --> SENSOR_ONLY["Sensor <br>VL53L5CX <br>Tetap Aktif<br>+<br>Buzzer"]
    SENSOR_ONLY -- User <br>Bergerak <br>Lagi --> CEK_GERAK
    CEK_GERAK -- Ya --> KIRIM_DATA["Kirim <br>Video <br>+ <br>Data <br>Jarak ke HP"]
    KIRIM_DATA --> YOLO["Proses <br>Citra AI<br>YOLOv11"] & ToF["Proses <br>Matriks <br>Jarak <br>VL53L5CX"]
    YOLO --> MAPPING{"Logika <br>Mapping  Arah <br>Jam 10-2"}
    ToF --> MAPPING
    MAPPING -- X &lt; 20% <br>/<br>X &gt; 80% --> LUAR["Set: <br>Arah Jam 10<br>atau <br>2  Status:<br>Jarak <br>Tidak <br>Diketahui"]
    MAPPING -- "X <br>= <br>20% - 80%" --> DALAM["Set: <br>Arah Jam <br>11, 12, atau 1"]
    DALAM --> HITUNG_GRID["Hitung Grid<br>Pixel/60 <br>Ambil <br>Data <br>Array Jarak"]
    LUAR --> GOTO_OUTPUT(["Lanjut ke<br>Diagram 3b: <br>Mode Aplikasi"])
    HITUNG_GRID --> GOTO_OUTPUT

     CEK_GERAK:::decision
     PAUSE_YOLO:::design
     SENSOR_ONLY:::design
     KIRIM_DATA:::research
     YOLO:::research
     ToF:::research
     MAPPING:::decision
     LUAR:::design
     DALAM:::design
     HITUNG_GRID:::research
    classDef research fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef design fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef impl fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef decision fill:#fce4ec,stroke:#c62828,stroke-width:2px
```

```mermaid
---
config:
  layout: elk
---
flowchart LR
    ENTRY_OFF(["WiFi <br>Putus <br>&gt; 5 Detik"]) --> MODE_SAFETY["MODE SAFETY <br>/ OFFLINE"]
    MODE_SAFETY --> CAM_OFF["Matikan <br>Kamera"] & BACA_SENSOR["Baca <br>Sensor <br>Jarak <br>VL53L5CX"]
    BACA_SENSOR --> LOGIKA_BUZZER{"Jarak <br>&lt; 1 Meter?"}
    LOGIKA_BUZZER -- Ya --> BUZZ_ON["Bunyikan <br>Buzzer"]
    LOGIKA_BUZZER -- Tidak --> BUZZ_OFF["Buzzer<br>Diam"]
    BUZZ_ON --> RETRY["Coba <br>Reconnect <br>WiFi"]
    BUZZ_OFF --> RETRY
    RETRY --> CEK_ULANG{"Reconnect <br>Berhasil?"}
    CEK_ULANG -- Ya --> KEMBALI_UTAMA(["Kembali ke <br>Diagram 2: <br>Cek Kecerahan"])
    CEK_ULANG -- Tidak --> BACA_SENSOR
    ENTRY_GELAP(["Cahaya <br>Gelap"]) --> MODE_LOW["MODE <br>LOW-LIGHT"]
    MODE_LOW --> CAM_LOW["Kamera <br>Low FPS"] & STOP_STREAM["Stop <br>Video <br>Streaming"] & BACA_SENSOR

     MODE_SAFETY:::design
     CAM_OFF:::research
     BACA_SENSOR:::research
     LOGIKA_BUZZER:::decision
     BUZZ_ON:::impl
     BUZZ_OFF:::impl
     RETRY:::design
     CEK_ULANG:::decision
     MODE_LOW:::design
     CAM_LOW:::research
     STOP_STREAM:::research
    classDef research fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef design fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef impl fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef decision fill:#fce4ec,stroke:#c62828,stroke-width:2px
```

```mermaid
---
config:
  layout: dagre
---
flowchart TB
 subgraph ANALISIS["Analisis Kebutuhan Sistem"]
        KEBUTUHAN_SW["Kebutuhan Software: Android App, Dataset YOLO, Library"]
        KEBUTUHAN_HW["Kebutuhan Hardware: ESP32-S3, Kamera, VL53L5CX, Baterai"]
  end
 subgraph PERANCANGAN["Perancangan Sistem"]
        DESAIN_LOGIKA["Desain Logika:
        Flowchart, UML, Mapping Sensor 8x8"]
        DESAIN_MEKANIK["Desain Mekanik:
        Casing Kacamata & Tata Letak"]
        DESAIN_ARSITEKTUR["Desain Arsitektur:
        Diagram Blok & Wiring Skematik"]
  end
 subgraph IMPLEMENTASI["Implementasi & Pembuatan Alat"]
        RAKIT["Perakitan Hardware & Coding Android"]
        TRAINING["Training Model AI: YOLOv11 Nano Custom Dataset"]
  end
 subgraph AWAL[" "]
        PENGUMPULAN_DATA["Pengumpulan Data:
        1. Dataset Sekunder: COCO/Open Images
        2. Dataset Primer: Foto Rintangan Lokal
        3. Observasi Perilaku Tunanetra"]
        IDENTIFIKASI["Identifikasi Masalah: Keterbatasan Tongkat Putih & Risiko Cedera Kepala"]
        STUDI_LIT["Studi Literatur:
        1. Alat Bantu Tunanetra Smart Stick/Glasses
        2. Deep Learning YOLOv11
        3. Sensor ToF &amp; IoT ESP32"]
  end
    DESAIN_ARSITEKTUR <--> DESAIN_MEKANIK
    DESAIN_MEKANIK <--> DESAIN_LOGIKA
    TRAINING <--> RAKIT
    STUDI_LIT --> IDENTIFIKASI
    IDENTIFIKASI --> PENGUMPULAN_DATA
    KEBUTUHAN_HW <--> KEBUTUHAN_SW
    START(["Mulai"]) --> AWAL
    AWAL --> ANALISIS
    ANALISIS --> PERANCANGAN
    PERANCANGAN --> IMPLEMENTASI
    IMPLEMENTASI --> PENGUJIAN{"Pengujian <br>Sistem"}
    PENGUJIAN -- Gagal / Error --> DEBUG["Perbaikan & Debugging"]
    DEBUG --> IMPLEMENTASI
    PENGUJIAN -- Berhasil --> ANALISIS_HASIL["Analisis Hasil Pengujian:
1. Akurasi Deteksi & Jarak
2. Latensi & Kinerja
3. Usability User"]
    ANALISIS_HASIL --> KESIMPULAN["Penarikan Kesimpulan & Saran"]
    KESIMPULAN --> SELESAI(["Selesai"])

     KEBUTUHAN_SW:::design
     KEBUTUHAN_HW:::design
     DESAIN_LOGIKA:::design
     DESAIN_MEKANIK:::design
     DESAIN_ARSITEKTUR:::design
     RAKIT:::impl
     TRAINING:::impl
     PENGUMPULAN_DATA:::research
     IDENTIFIKASI:::research
     STUDI_LIT:::research
     ANALISIS:::design
     PERANCANGAN:::design
     IMPLEMENTASI:::impl
     PENGUJIAN:::decision
     DEBUG:::impl
     ANALISIS_HASIL:::research
     KESIMPULAN:::research
    classDef research fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef design fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef impl fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef decision fill:#fce4ec,stroke:#c62828,stroke-width:2px
```
