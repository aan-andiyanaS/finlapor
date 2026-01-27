"""
FinLapor AI Service - AWS Lambda Function
Synced with backend/internal/services/huggingface.go

Features:
- OCR for receipt scanning (Donut model)
- Chat with age-based personalization (LLM)
- Auto-categorization (BART zero-shot)
- Financial insights generation
"""

import json
import os
import requests
from datetime import datetime

# Environment variables
HF_TOKEN = os.environ.get('HF_TOKEN', '')
OCR_MODEL = os.environ.get('HF_OCR_MODEL', 'naver-clova-ix/donut-base-finetuned-cord-v2')
LLM_MODEL = os.environ.get('HF_LLM_MODEL', 'Qwen/Qwen2.5-72B-Instruct')

# HuggingFace API endpoints
HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models"
HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions"

def lambda_handler(event, context):
    """
    Main Lambda handler for AI service.
    Routes requests to appropriate handlers based on action.
    """
    action = event.get('action', '')
    
    handlers = {
        'health': handle_health,
        'ocr': handle_ocr,
        'categorize': handle_categorize,
        'chat': handle_chat,
        'insight': handle_insight,
    }
    
    handler = handlers.get(action)
    if handler:
        return handler(event)
    
    return response(400, {'error': f'Unknown action: {action}'})


def response(status_code, body):
    """Create standardized response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }


def handle_health(event):
    """Health check endpoint"""
    return response(200, {
        'status': 'ok',
        'service': 'finlapor-ai',
        'version': '2.0',
        'hf_configured': bool(HF_TOKEN),
        'models': {
            'ocr': OCR_MODEL,
            'llm': LLM_MODEL
        }
    })


# =============================================================================
# OCR HANDLER
# =============================================================================

def handle_ocr(event):
    """
    Handle OCR request using Hugging Face Donut model.
    Extracts data from receipt images.
    """
    image_url = event.get('image_url', '')
    image_base64 = event.get('image_base64', '')
    
    if not image_url and not image_base64:
        return response(400, {'error': 'image_url or image_base64 is required'})
    
    if not HF_TOKEN:
        print("⚠️ HF_TOKEN not configured, using mock OCR")
        return response(200, mock_ocr_result())
    
    try:
        # Get image data
        if image_base64:
            import base64
            image_data = base64.b64decode(image_base64)
        else:
            img_resp = requests.get(image_url, timeout=30)
            image_data = img_resp.content
        
        # Call HuggingFace OCR
        api_url = f"{HF_INFERENCE_URL}/{OCR_MODEL}"
        headers = {"Authorization": f"Bearer {HF_TOKEN}"}
        
        resp = requests.post(api_url, headers=headers, data=image_data, timeout=60)
        result = resp.json()
        
        # Parse result
        parsed = parse_ocr_result(result)
        return response(200, parsed)
        
    except Exception as e:
        print(f"❌ OCR error: {e}")
        return response(200, mock_ocr_result())


def parse_ocr_result(result):
    """Parse OCR result from Donut model"""
    import re
    
    parsed = {
        'vendor': 'Unknown Store',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'total': 0,
        'items': [],
        'category': 'Belanja',
        'confidence': 0.85,
        'raw_text': ''
    }
    
    if isinstance(result, list) and len(result) > 0:
        text = result[0].get('generated_text', '')
        parsed['raw_text'] = text
        
        # Extract total
        total_match = re.search(r'total.*?(\d+[\d,.]*)', text, re.IGNORECASE)
        if total_match:
            parsed['total'] = float(total_match.group(1).replace(',', '').replace('.', ''))
        
        # Extract items
        items = re.findall(r'<s_nm>(.*?)</s_nm>', text)
        prices = re.findall(r'<s_price>(.*?)</s_price>', text)
        
        for i, item in enumerate(items):
            price = float(prices[i].replace(',', '').replace('.', '')) if i < len(prices) else 0
            parsed['items'].append({
                'name': item,
                'price': price,
                'qty': 1
            })
    
    return parsed


def mock_ocr_result():
    """Return mock OCR result when HF_TOKEN not set"""
    return {
        'vendor': 'Indomaret',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'total': 85000,
        'items': [
            {'name': 'Indomie Goreng x3', 'price': 10500, 'qty': 3},
            {'name': 'Aqua 600ml x2', 'price': 6000, 'qty': 2},
            {'name': 'Roti Tawar', 'price': 15000, 'qty': 1}
        ],
        'category': 'Belanja',
        'confidence': 0.92,
        'raw_text': '[Mock OCR - Set HF_TOKEN for real AI]'
    }


# =============================================================================
# CHAT HANDLER (with Age-based Personalization)
# =============================================================================

def handle_chat(event):
    """
    Financial assistant chatbot with age-based personalization.
    Matches behavior from backend/internal/services/huggingface.go
    """
    message = event.get('message', '')
    context = event.get('context', {})
    user_age = event.get('user_age', 25)
    
    if not message:
        return response(400, {'error': 'message is required'})
    
    if not HF_TOKEN:
        print("⚠️ HF_TOKEN not configured, using mock chat")
        return response(200, mock_chat_response(message))
    
    try:
        # Build financial context
        financial_data = context.get('financial_data', '')
        
        # Build system prompt with age-based personalization
        system_prompt = build_chat_prompt(user_age, financial_data)
        
        # Call HuggingFace Chat API (OpenAI-compatible)
        payload = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "max_tokens": 500,
            "temperature": 0.7,
            "top_p": 0.95
        }
        
        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }
        
        resp = requests.post(HF_CHAT_URL, headers=headers, json=payload, timeout=60)
        result = resp.json()
        
        # Extract response
        if 'choices' in result and len(result['choices']) > 0:
            reply = result['choices'][0].get('message', {}).get('content', '')
            return response(200, {
                'reply': reply.strip(),
                'timestamp': datetime.now().isoformat(),
                'suggestions': [
                    'Lihat detail pengeluaran',
                    'Tips menghemat',
                    'Bandingkan dengan bulan lalu'
                ]
            })
        
        return response(200, mock_chat_response(message))
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return response(200, mock_chat_response(message))


def build_chat_prompt(user_age, financial_data):
    """Build system prompt with age-based personalization - synced with huggingface.go"""
    
    age_style = ""
    if user_age < 25:
        age_style = "Gunakan bahasa gaul yang relate (misal: 'gas!', 'mantap!', 'auto cuan', 'goks!')"
    elif user_age <= 40:
        age_style = "Bicara profesional tapi tetap friendly dan santai"
    else:
        age_style = "Bicara sopan, hormat, dan mudah dipahami"
    
    return f'''Kamu adalah "Finny", asisten keuangan AI yang SUPER FRIENDLY dan INTERAKTIF dari FinLapor! 🎉

KEPRIBADIAN UTAMA:
- Kamu adalah TEMAN CURHAT soal keuangan, bukan robot atau konsultan kaku
- Punya sense of humor - sesekali bercanda ringan yang relevan dengan topik
- Empati tinggi - pahami perasaan user tentang kondisi keuangannya
- Antusias dan supportive - selalu berikan semangat positif
- {age_style}

GAYA BICARA:
- Gunakan bahasa sehari-hari yang hangat dan personal
- Variasikan respons - jangan pakai template yang sama terus
- Gunakan emoji yang natural dan sesuai konteks (2-4 per respons)
- Sesekali gunakan ekspresi seperti "Wah!", "Hmm menarik nih...", "Oke oke..."
- Boleh pakai singkatan casual: "gak", "nih", "sih", "dong", "yuk"

TEKNIK PERCAKAPAN INTERAKTIF:
- Tanyakan follow-up yang personal: "Btw, pengeluaran makanan ini kebanyakan makan di luar atau masak sendiri?"
- Berikan validasi: "Wajar sih kalau pengeluaran naik di awal bulan..."
- Share fun facts tentang keuangan yang relevan
- Tawarkan challenge kecil: "Gimana kalau minggu ini kita coba kurangi jajan 20%?"

CARA MENJAWAB:
1. Buka dengan respons yang hangat dan personal (bukan "Halo!" yang generik)
2. Jawab pertanyaan dengan jelas + berikan konteks
3. Tambahkan insight menarik atau tips praktis
4. Tutup dengan pertanyaan engaging ATAU ajakan action yang spesifik

RESPONS BERDASARKAN SITUASI:
- Kalau keuangan bagus: Kasih apresiasi dan motivasi untuk maintain
- Kalau overspending: Empati dulu, baru kasih saran tanpa menghakimi
- Kalau ada achievement: Rayakan bersama! "Yay! 🎊"
- Kalau bingung: Bantu breakdown step by step

ANALISIS DATA:
- Jika ditanya total/kategori, HITUNG AKURAT dari data yang ada
- Sebutkan detail transaksi jika relevan
- Format angka: Rupiah dengan separator (Rp 1.500.000)
- Jika tidak ada data, bilang jujur dengan cara sopan

DATA KEUANGAN USER:
{financial_data if financial_data else "Data keuangan belum tersedia."}

INGAT: Jadilah teman yang asyik diajak ngobrol soal uang, bukan chatbot yang kaku! 💬'''


def mock_chat_response(message):
    """Return mock chat response when HF_TOKEN not set"""
    msg = message.lower()
    
    responses = {
        'halo': "Halo! 👋 Saya Finny dari FinLapor. Saya bisa membantu analisis keuangan Anda. Ada yang bisa saya bantu?",
        'pengeluaran': "📊 Berdasarkan data: Total pengeluaran bulan ini Rp 9.250.000.\n\nTop kategori:\n1. Makanan: Rp 2.5 juta (27%)\n2. Belanja: Rp 2 juta (22%)\n3. Transport: Rp 1.5 juta (16%)",
        'pemasukan': "💰 Total pemasukan bulan ini: Rp 25.000.000.\n\nSumber:\n- Gaji: Rp 20 juta\n- Freelance: Rp 3.5 juta\n- Investasi: Rp 1.5 juta",
        'menabung': "💡 Tips Menabung:\n\n1. Aturan 50/30/20\n2. Otomatis tabungan setiap gajian\n3. Lacak pengeluaran kecil\n4. Buat emergency fund 6 bulan gaji",
    }
    
    for key, resp in responses.items():
        if key in msg:
            return {
                'reply': resp,
                'timestamp': datetime.now().isoformat(),
                'suggestions': ['Lihat detail', 'Tips lainnya']
            }
    
    return {
        'reply': "Saya bisa membantu dengan:\n- 📊 Analisis pengeluaran\n- 💰 Tips menabung\n- 🏷️ Kategorisasi transaksi\n- 📋 Laporan keuangan\n\n[Mock AI - Set HF_TOKEN for real AI]",
        'timestamp': datetime.now().isoformat(),
        'suggestions': ['Lihat pengeluaran', 'Tips menabung']
    }


# =============================================================================
# CATEGORIZE HANDLER
# =============================================================================

def handle_categorize(event):
    """
    Auto-categorize transaction using BART zero-shot classification.
    """
    description = event.get('description', '')
    
    if not description:
        return response(400, {'error': 'description is required'})
    
    if not HF_TOKEN:
        category, confidence = mock_categorize(description)
        return response(200, {'category': category, 'confidence': confidence})
    
    try:
        # Use zero-shot classification (same as Go backend)
        api_url = f"{HF_INFERENCE_URL}/facebook/bart-large-mnli"
        
        categories = [
            "makanan dan minuman",
            "transportasi",
            "belanja",
            "tagihan dan utilitas",
            "hiburan",
            "kesehatan",
            "pendidikan",
            "lainnya"
        ]
        
        payload = {
            "inputs": description,
            "parameters": {
                "candidate_labels": categories
            }
        }
        
        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }
        
        resp = requests.post(api_url, headers=headers, json=payload, timeout=30)
        result = resp.json()
        
        if 'labels' in result and 'scores' in result:
            label = result['labels'][0]
            score = result['scores'][0]
            category = map_to_category(label)
            return response(200, {'category': category, 'confidence': score})
        
        category, confidence = mock_categorize(description)
        return response(200, {'category': category, 'confidence': confidence})
        
    except Exception as e:
        print(f"❌ Categorize error: {e}")
        category, confidence = mock_categorize(description)
        return response(200, {'category': category, 'confidence': confidence})


def map_to_category(label):
    """Map HuggingFace label to FinLapor category"""
    mapping = {
        "makanan dan minuman": "Makanan",
        "transportasi": "Transport",
        "belanja": "Belanja",
        "tagihan dan utilitas": "Tagihan",
        "hiburan": "Hiburan",
        "kesehatan": "Kesehatan",
        "pendidikan": "Pendidikan",
        "lainnya": "Lainnya"
    }
    return mapping.get(label, "Lainnya")


def mock_categorize(description):
    """Mock categorization based on keywords"""
    desc = description.lower()
    
    keywords = {
        'Makanan': ['makan', 'resto', 'food', 'kfc', 'mcd', 'kopi', 'coffee', 'nasi', 'ayam'],
        'Transport': ['bensin', 'parkir', 'grab', 'gojek', 'taxi', 'tol', 'ojol'],
        'Belanja': ['indomaret', 'alfamart', 'supermarket', 'toko', 'beli'],
        'Tagihan': ['listrik', 'pln', 'internet', 'pulsa', 'air', 'wifi'],
        'Hiburan': ['netflix', 'spotify', 'bioskop', 'game', 'nonton'],
        'Kesehatan': ['obat', 'dokter', 'apotek', 'rumah sakit'],
    }
    
    for category, kws in keywords.items():
        if any(kw in desc for kw in kws):
            return category, 0.85
    
    return 'Lainnya', 0.5


# =============================================================================
# INSIGHT HANDLER
# =============================================================================

def handle_insight(event):
    """Generate spending insights from transaction data."""
    transactions = event.get('transactions', [])
    
    if not transactions:
        return response(200, {
            'insights': ['Belum ada data transaksi untuk dianalisis.'],
            'summary': {}
        })
    
    # Calculate totals
    total_expense = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'expense')
    total_income = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'income')
    
    # Group by category
    by_category = {}
    for t in transactions:
        if t.get('type') == 'expense':
            cat = t.get('category', 'Lainnya')
            by_category[cat] = by_category.get(cat, 0) + t.get('amount', 0)
    
    # Generate insights
    insights = []
    
    if total_income > 0:
        savings_rate = ((total_income - total_expense) / total_income) * 100
        if savings_rate > 20:
            insights.append(f"👍 Bagus! Anda menabung {savings_rate:.0f}% dari pendapatan.")
        elif savings_rate > 0:
            insights.append(f"💡 Anda menabung {savings_rate:.0f}%. Coba tingkatkan ke 20%!")
        else:
            insights.append("⚠️ Pengeluaran melebihi pendapatan. Perlu review budget.")
    
    if by_category:
        top_cat = max(by_category, key=by_category.get)
        top_amount = by_category[top_cat]
        pct = (top_amount / total_expense * 100) if total_expense > 0 else 0
        insights.append(f"📊 Kategori terbesar: {top_cat} ({pct:.0f}% dari pengeluaran)")
    
    return response(200, {
        'insights': insights,
        'summary': {
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': total_income - total_expense,
            'by_category': by_category
        }
    })


# For local testing
if __name__ == "__main__":
    # Test health
    print(lambda_handler({'action': 'health'}, None))
    
    # Test chat
    print(lambda_handler({
        'action': 'chat',
        'message': 'Halo, berapa total pengeluaran saya?',
        'user_age': 22
    }, None))
    
    # Test categorize
    print(lambda_handler({
        'action': 'categorize',
        'description': 'Makan siang di KFC'
    }, None))
