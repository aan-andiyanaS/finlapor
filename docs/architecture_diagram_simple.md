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
activityDiagram
    start
    :Terima Data dari ESP32;
    fork
        :Proses Citra (YOLOv11);
        :Dapatkan Bounding Box Objek;
    fork again
        :Proses Sensor (VL53L5CX);
        :Dapatkan Matriks Jarak 8x8;
    end fork
    
    :Hitung Posisi Horizontal (X) Objek;
    
    if (X < 20% ATAU X > 80%) then (Luar Jangkauan Sensor)
        :Set Status: Jarak Tidak Diketahui;
        if (X < 20%) then (Jam 10)
            :Set Arah: Jam 10;
        else (Jam 2)
            :Set Arah: Jam 2;
        endif
    else (Dalam Jangkauan Sensor)
        :Mapping Grid (Pixel / 60);
        :Ambil Data Jarak dari Array;
        if (X < 40%) then (Jam 11)
            :Set Arah: Jam 11;
        elseif (X < 60%) then (Jam 12)
            :Set Arah: Jam 12;
        else (Jam 1)
            :Set Arah: Jam 1;
        endif
    endif
    
    :Generate Kalimat Output;
    stop
```
