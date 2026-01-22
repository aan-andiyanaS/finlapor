import json
import os
import requests

HF_TOKEN = os.environ.get('HF_TOKEN', '')
OCR_MODEL = "naver-clova-ix/donut-base-finetuned-cord-v2"
LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

def lambda_handler(event, context):
    """
    Main Lambda handler for AI service.
    Routes requests to appropriate handlers based on action.
    """
    action = event.get('action', '')
    
    if action == 'health':
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'ok', 'service': 'finlapor-ai'})
        }
    
    if action == 'ocr':
        return handle_ocr(event)
    
    if action == 'categorize':
        return handle_categorize(event)
    
    if action == 'chat':
        return handle_chat(event)
    
    if action == 'insight':
        return handle_insight(event)
    
    return {
        'statusCode': 400,
        'body': json.dumps({'error': 'Unknown action'})
    }


def handle_ocr(event):
    """
    Handle OCR request using Hugging Face Donut model.
    Extracts data from receipt images.
    """
    image_url = event.get('image_url', '')
    
    if not image_url:
        return {'statusCode': 400, 'body': json.dumps({'error': 'image_url is required'})}
    
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"https://api-inference.huggingface.co/models/{OCR_MODEL}"
    
    try:
        # Download image
        image_response = requests.get(image_url)
        image_data = image_response.content
        
        # Send to Hugging Face
        response = requests.post(api_url, headers=headers, data=image_data)
        result = response.json()
        
        # Parse OCR result
        parsed = parse_ocr_result(result)
        
        return {
            'statusCode': 200,
            'body': json.dumps(parsed)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def parse_ocr_result(result):
    """
    Parse OCR result from Donut model.
    Extract vendor, date, total, items.
    """
    # The Donut model returns structured output
    # This is a simplified parser
    parsed = {
        'vendor': '',
        'date': '',
        'total': 0,
        'items': [],
        'raw': result,
        'confidence': 0.9
    }
    
    if isinstance(result, list) and len(result) > 0:
        text = result[0].get('generated_text', '')
        
        # Parse the structured output
        # Format from CORD model: <s_menu><s_nm>item</s_nm>...</s_menu><s_total>...</s_total>
        import re
        
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


def handle_categorize(event):
    """
    Auto-categorize transaction based on description.
    Uses LLM to determine category.
    """
    description = event.get('description', '')
    
    if not description:
        return {'statusCode': 400, 'body': json.dumps({'error': 'description is required'})}
    
    categories = [
        'Makan & Minum',
        'Transportasi',
        'Belanja',
        'Tagihan',
        'Hiburan',
        'Kesehatan',
        'Pendidikan',
        'Gaji',
        'Bisnis',
        'Investasi',
        'Lainnya'
    ]
    
    prompt = f"""<s>[INST] You are a financial categorization assistant. 
Given a transaction description, categorize it into one of these categories: {', '.join(categories)}.
Only respond with the category name, nothing else.

Transaction: {description} [/INST]"""

    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"https://api-inference.huggingface.co/models/{LLM_MODEL}"
    
    try:
        response = requests.post(api_url, headers=headers, json={"inputs": prompt})
        result = response.json()
        
        category = result[0].get('generated_text', 'Lainnya').strip()
        
        # Validate category
        if category not in categories:
            category = 'Lainnya'
        
        return {
            'statusCode': 200,
            'body': json.dumps({'category': category})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e), 'category': 'Lainnya'})
        }


def handle_chat(event):
    """
    Financial assistant chatbot.
    Answers questions about user's finances.
    """
    message = event.get('message', '')
    context = event.get('context', {})
    
    if not message:
        return {'statusCode': 400, 'body': json.dumps({'error': 'message is required'})}
    
    # Build context from user's financial data
    context_str = ""
    if context:
        if 'total_income' in context:
            context_str += f"Total pemasukan bulan ini: Rp {context['total_income']:,.0f}. "
        if 'total_expense' in context:
            context_str += f"Total pengeluaran bulan ini: Rp {context['total_expense']:,.0f}. "
        if 'balance' in context:
            context_str += f"Saldo saat ini: Rp {context['balance']:,.0f}. "
        if 'top_categories' in context:
            cats = ', '.join([f"{c['name']} (Rp {c['amount']:,.0f})" for c in context['top_categories'][:3]])
            context_str += f"Kategori pengeluaran terbesar: {cats}. "
    
    prompt = f"""<s>[INST] You are FinLapor, a friendly Indonesian financial assistant. 
Help users understand their finances and give practical advice.
Always respond in Bahasa Indonesia. Be concise but helpful.

User's financial context: {context_str if context_str else 'Data keuangan belum tersedia.'}

User: {message} [/INST]"""

    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    api_url = f"https://api-inference.huggingface.co/models/{LLM_MODEL}"
    
    try:
        response = requests.post(api_url, headers=headers, json={
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.7
            }
        })
        result = response.json()
        
        reply = result[0].get('generated_text', '').strip()
        
        # Extract only the assistant's response
        if '[/INST]' in reply:
            reply = reply.split('[/INST]')[-1].strip()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'reply': reply,
                'suggestions': [
                    'Lihat detail pengeluaran',
                    'Tips menghemat',
                    'Bandingkan dengan bulan lalu'
                ]
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'reply': 'Maaf, terjadi kesalahan. Silakan coba lagi.'
            })
        }


def handle_insight(event):
    """
    Generate spending insights from transaction data.
    """
    transactions = event.get('transactions', [])
    
    if not transactions:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'insights': ['Belum ada data transaksi untuk dianalisis.']
            })
        }
    
    # Calculate simple insights
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
            insights.append(f"⚠️ Pengeluaran melebihi pendapatan. Perlu review budget.")
    
    if by_category:
        top_cat = max(by_category, key=by_category.get)
        top_amount = by_category[top_cat]
        pct = (top_amount / total_expense * 100) if total_expense > 0 else 0
        insights.append(f"📊 Kategori terbesar: {top_cat} ({pct:.0f}% dari pengeluaran)")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'insights': insights,
            'summary': {
                'total_income': total_income,
                'total_expense': total_expense,
                'balance': total_income - total_expense,
                'by_category': by_category
            }
        })
    }
