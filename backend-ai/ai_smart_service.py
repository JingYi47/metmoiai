"""
AI SMART SERVICE - Tìm kiếm thông minh bằng ngữ nghĩa
Công nghệ: Sentence-BERT (đa ngôn ngữ)
Port: 5002
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import torch
import pickle
import os
import re
import requests
from io import BytesIO
from PIL import Image
from functools import lru_cache # Added for caching
import io
import threading
import time
import sys

CATEGORY_MAP = {
    "watch": ["watch", "dong ho", "smartwatch"],
    "smartphone": ["dien thoai", "smartphone", "phone"],
    "laptop": ["laptop", "may tinh"],
    "headphone": ["tai nghe", "headphone"],
    "keyboard": ["ban phim", "keyboard"],
    "mouse": ["chuot", "mouse"],
    "speaker": ["loa", "speaker"],
}
# Đảm bảo in được tiếng Việt trên console Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Fallback cho phiên bản Python cũ hơn 3.7
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

app = Flask(__name__)
CORS(app)

# ==================== KHỞI TẠO ====================
print("Khởi động AI Smart Service...")
print("Đang tải model đa ngôn ngữ (lần đầu có thể mất 1-2 phút)...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

print("Đang tải model CLIP cho tìm kiếm hình ảnh...")
clip_model = SentenceTransformer('clip-ViT-B-32')

product_embeddings = None
image_embeddings = None
_clip_text_embeddings = None
product_data = []

# Cache for query embeddings to speed up repeating searches
@lru_cache(maxsize=1000)
def get_query_embedding(query_text):
    return model.encode(query_text, convert_to_tensor=True)

print("Các model đã sẵn sàng!")

# Danh mục để Zero-shot Classification (Phân loại ảnh nhanh)
CATEGORIES_LIST = [
    "smartphone điện thoại",
    "laptop máy tính xách tay",
    "watch đồng hồ",
    "headphone tai nghe",
    "keyboard bàn phím",
    "mouse chuột",
    "speaker loa",
    "tablet máy tính bảng",
    "camera máy ảnh",
    "monitor màn hình"
]

# ==================== HÀM TIỆN ÍCH ====================

def clean_text(text):
    """Làm sạch văn bản, chuẩn hóa tiếng Việt và khoảng trắng"""
    if not text:
        return ""
    text = str(text).lower()
    
    mapping = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd'
    }
    for char, replacement in mapping.items():
        text = text.replace(char, replacement)
    
    # Loại bỏ ký tự đặc biệt và chuẩn hóa khoảng trắng
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def build_product_text(product):
    """Xây dựng văn bản mô tả sản phẩm để AI học"""
    parts = []
    
    # Tên sản phẩm (quan trọng nhất - lặp lại 3 lần)
    name = clean_text(product.get('name', ''))
    parts.extend([name, name, name])
    
    # Thương hiệu
    brand = clean_text(product.get('brand', ''))
    if brand:
        parts.append(brand)
    
    # Danh mục (quan trọng)
    category = clean_text(str(product.get('category', '')))
    if category:
        parts.append(category)
        parts.append(category)
    
    # Thông số kỹ thuật
    specs = product.get('specs', {})
    for key, value in specs.items():
        if value and value != 'Chưa cập nhật':
            parts.append(clean_text(str(value)))
    
    # Mô tả (nếu có)
    description = clean_text(product.get('description', ''))
    if description:
        parts.append(description[:200])
    
    return " ".join(parts)

def extract_price_from_query(query):
    """Trích xuất giá từ câu query"""
    patterns = [
        r'(\d+(?:\.?\d+)?)\s*(triệu|tr|trieu)',
        r'(\d+(?:\.?\d+)?)\s*(k|ngàn|ngan)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, query.lower())
        if match:
            value = float(match.group(1))
            unit = match.group(2).lower()
            if unit in ['triệu', 'tr', 'trieu']:
                return value * 1000000
            elif unit in ['k', 'ngàn', 'ngan']:
                return value * 1000
    return None

def detect_brand_in_query(query):
    """Phát hiện thương hiệu trong câu query"""
    brands = ['apple', 'samsung', 'xiaomi', 'hp', 'dell', 'asus', 'lenovo', 
              'sony', 'lg', 'oppo', 'vivo', 'realme', 'oneplus', 'logitech',
              'razer', 'msi', 'gigabyte', 'huawei']
    
    query_lower = query.lower()
    for brand in brands:
        if brand in query_lower:
            return brand
    return None

def download_image(url):
    """Tải hình ảnh từ URL và trả về đối tượng PIL Image"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        # Bỏ qua các placeholder link demo của Cloudinary nếu không truy cập được
        if 'cloudinary' in url and '/demo/' in url:
            return None
            
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content)).convert("RGB")
        else:
            print(f"DEBUG: Status {response.status_code} for {url}")
    except Exception as e:
        print(f"DEBUG: Lỗi tải ảnh {url}: {e}")
    return None

# API 1: TRAIN 

@app.route('/api/train', methods=['POST'])
def train_model():
    global product_embeddings, image_embeddings, product_data
    
    data = request.get_json()
    products = data.get('products', [])
    
    if not products:
        return jsonify({"success": False, "error": "Không có sản phẩm để train"}), 400
    
    print(f" Bắt đầu train AI với {len(products)} sản phẩm...")
    
    texts = []
    product_data_list = []
    
    for product in products:
        text = build_product_text(product)
        texts.append(text)
        
        images_list = product.get('images', [])
        img_url = product.get('thumbnail')
        if not img_url and images_list and len(images_list) > 0:
            first_img = images_list[0]
            if isinstance(first_img, dict):
                img_url = first_img.get('url')
            else:
                img_url = first_img

        product_data_list.append({
            'slug': product.get('slug'),
            'name': product.get('name'),
            'price': product.get('price'),
            'brand': product.get('brand'),
            'category': str(product.get('category', '')),
            'sold': product.get('sold', 0),
            'rating': product.get('rating', 0),
            'discount': product.get('discountPercentage', 0),
            'image_url': img_url,
            'search_text': text # Lưu lại text đã build để dùng cho việc lọc/boost sau này
        })
    
    # 1. Cập nhật Text Embeddings ngay lập tức (Rất nhanh)
    global product_data, product_embeddings, _clip_text_embeddings # Khai báo global rõ ràng
    product_data = product_data_list
    product_embeddings = model.encode(texts, convert_to_tensor=True)
    
    # 2. Tạo fallback text embeddings cho CLIP (Cũng nhanh)
    clip_texts = [f"A photo of a {p['brand']} {p['name']} {p['category']}" for p in product_data]
    _clip_text_embeddings = clip_model.encode(clip_texts, convert_to_tensor=True)
    
    # Khởi tạo image_embeddings trắng (sẽ được điền bởi thread nền)
    if image_embeddings is None or len(image_embeddings) != len(products):
        image_embeddings = torch.zeros((len(products), 512))
    
    # 🌟 LƯU DỮ LIỆU VĂN BẢN NGAY LẬP TỨC ( Logic Antigravity )
    # Lưu ngay để search_text có tác dụng ngay khi đồng bộ xong
    try:
        model_path = os.path.abspath('model_data.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump({
                'embeddings': product_embeddings,
                'image_embeddings': image_embeddings,
                'clip_text_embeddings': _clip_text_embeddings,
                'products': product_data
            }, f)
        print(f"✅ Đã lưu dữ liệu văn bản vào: {model_path}")
    except Exception as e:
        print(f"❌ Lỗi lưu dữ liệu văn bản: {e}")

    # 3. Chạy thread nền để tải và xử lý hình ảnh (Tốn thời gian)
    def background_image_training(p_data, current_embeddings):
        global image_embeddings
        print(f"🤖 [Background] Bắt đầu xử lý {len(p_data)} hình ảnh...")
        processed_count = 0
        
        # Tạo bản sao embeddings để làm việc tránh xung đột
        new_image_embeddings = torch.zeros((len(p_data), 512))
        
        for i, p in enumerate(p_data):
            url = p.get('image_url')
            if url:
                img = download_image(url)
                if img:
                    emb = clip_model.encode(img, convert_to_tensor=True)
                    new_image_embeddings[i] = emb
                    processed_count += 1
            
            # Cập nhật batch sau mỗi 50 ảnh để user thấy kết quả dần dần
            if i % 50 == 0 and i > 0:
                print(f"🤖 [Background] Đã xử lý {i}/{len(p_data)} ảnh...")
        
        image_embeddings = new_image_embeddings
        
        # Lưu lại bản cập nhật đầy đủ (gồm cả ảnh) sau khi hoàn tất
        try:
            with open('model_data.pkl', 'wb') as f:
                pickle.dump({
                    'embeddings': product_embeddings,
                    'image_embeddings': image_embeddings,
                    'clip_text_embeddings': _clip_text_embeddings,
                    'products': p_data
                }, f)
            print(f"✅ [Background] Đã cập nhật đầy đủ model (kèm vector ảnh).")
        except Exception as e:
            print(f"❌ [Background] Lỗi lưu model: {e}")

    # Chạy thread
    thread = threading.Thread(target=background_image_training, args=(product_data, image_embeddings))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "success": True,
        "message": f"Dữ liệu chữ đã sẵn sàng ({len(products)} sản phẩm). Hình ảnh đang được xử lý ngầm.",
        "count": len(products)
    })

#  API 2: SEARCH 

@app.route('/api/search', methods=['POST'])
def smart_search():
    global product_embeddings, product_data
    
    data = request.get_json()
    query = data.get('query', '').strip()
    top_n = data.get('top_n', 10)
    
    if not query:
        return jsonify({"success": True, "query": query, "total": 0, "results": []})
    
    # Load model nếu chưa có
    if product_embeddings is None and os.path.exists('model_data.pkl'):
        print(" Đang load model từ file...")
        with open('model_data.pkl', 'rb') as f:
            saved = pickle.load(f)
            product_embeddings = saved['embeddings']
            if 'image_embeddings' in saved:
                image_embeddings = saved['image_embeddings']
            product_data = saved['products']
        print(f" Đã load {len(product_data)} sản phẩm")
    
    if product_embeddings is None:
        return jsonify({
            "success": False,
            "query": query,
            "total": 0,
            "results": [],
            "error": "Chưa train model"
        })
    
    # Lưu query gốc
    original_query = clean_text(query)
    expanded_query = original_query
    
    # ===== INTENT EXPANSION (Đại tu bởi Antigravity) =====
    # 1. Nhóm Laptop & Máy tính
    if any(k in original_query for k in ['laptop', 'may tinh', 'notebook', 'pc', 'may xach tay']):
        expanded_query += " laptop may tinh xach tay notebook ultrabook workstation"
    
    # 2. Nhóm Điện thoại
    if any(k in original_query for k in ['dien thoai', 'smartphone', 'mobile', 'ip', 'iphone']):
        expanded_query += " dien thoai dt apple iphone smartphone android pro max"
    
    # 3. Nhóm Đồng hồ
    if any(k in original_query for k in ['dong ho', 'watch', 'smartwatch']):
        expanded_query += " dong ho thong minh deo tay thông số sức khỏe theo dõi"

    # 4. Intent Gaming / Hiệu năng cao (Cả Phone & Laptop)
    if any(k in original_query for k in ['game', 'gaming', 'choi game', 'cay game', 'ko lag', 'fps', 'muot', 'chip manh']):
        expanded_query += " gaming rtx gtx 144hz 165hz 240hz snapdragon 8 gen a17 pro a18 pro hieu nang cao tan nhiet"

    # 5. Intent Đồ họa / Kỹ thuật / Lập trình (Laptop)
    if any(k in original_query for k in ['do hoa', 'thiet ke', 'photoshop', 'render', 'video', 'autocad', 'code', 'lap trinh', 'dev']):
        expanded_query += " đồ họa thiết kế render video photoshop autocad lập trình ram 16gb 32gb màn hình chuẩn màu oled"

    # 6. Intent Văn phòng / Sinh viên / Học tập (Mỏng nhẹ / Pin lâu)
    if any(k in original_query for k in ['van phong', 'hoc tap', 'sinh vien', 'office', 'mong nhe', 'di chuyen']):
        expanded_query += " văn phòng học tập mỏng nhẹ pin lâu pin trâu ultrabook bền bỉ ổn định"

    # 7. Intent Nhiếp ảnh / Livestream / Sống ảo (Phone)
    if any(k in original_query for k in ['chup anh', 'chup hinh', 'camera', 'selfie', 'quay phim', 'tiktok', 'livestream', 'song ao']):
        expanded_query += " camera ống kính leica zeiss chống rung ois 48mp 50mp 200mp chụp hình đẹp sắc nét"

    # 8. Intent Thể thao / Sức khỏe (Watch)
    if any(k in original_query for k in ['the thao', 'chay bo', 'boi loi', 'gym', 'suc khoe', 'nhip tim', 'spo2', 'ngu', 'oxy']):
        expanded_query += " thể thao sức khỏe đo nhịp tim oxy trong máu theo dõi giấc ngủ chống nước gps chạy bộ"

    # 9. Intent Giá rẻ / Linh hoạt / Tiết kiệm
    if any(k in original_query for k in ['gia re', 're', 'sinh vien', 'binh dan', 'tiet kien', 'uu dai', 'sale', 'giam gia']):
        expanded_query += " giá rẻ khuyến mãi giảm giá sinh viên bình dân ưu đãi tốt"

    # 10. Intent Sang trọng / Quý phái / Nữ tính
    if any(k in original_query for k in ['sang trong', 'cao cap', 'xin', 'flagship', 'nu', 'phu nu', 'con gai', 'tang vo']):
        expanded_query += " cao cấp sang trọng thiết kế tinh tế mỏng nhẹ thời trang màu hồng màu vàng kim"

    # Xác định các "Siêu Intent" để boost phần cứng (Hardware Signature)
    is_gaming_intent = any(k in original_query for k in ['game', 'gaming', 'choi game', 'cay game', 'fps'])
    is_work_intent = any(k in original_query for k in ['do hoa', 'thiet ke', 'photoshop', 'render', 'code', 'lap trinh', 'dev'])
    is_office_intent = any(k in original_query for k in ['van phong', 'office', 'hoc tap', 'sinh vien', 'mong nhe'])
    is_photography_intent = any(k in original_query for k in ['chup anh', 'chup hinh', 'camera', 'quay phim', 'selfie', 'tiktok', 'livestream'])
    is_health_sport_intent = any(k in original_query for k in ['suc khoe', 'the thao', 'chay bo', 'nhip tim', 'boi loi', 'gym'])
    is_budget_intent = any(k in original_query for k in ['gia re', 're', 'sinh vien', 'tiet kien', 'giam gia', 'sale'])
    is_lux_intent = any(k in original_query for k in ['sang trong', 'cao cap', 'doanh nhan', 'flagship', 'pro max'])
    # Search
    query_embedding = get_query_embedding(expanded_query) # Using cached function
    similarities = util.cos_sim(query_embedding, product_embeddings)[0]
    
    # Lấy ứng viên rộng hơn để không bỏ lỡ kết quả (tăng từ 50 lên 150)
    top_k = min(150, len(product_data))
    top_results = torch.topk(similarities, k=top_k)
    
    detected_brand = detect_brand_in_query(query)
    target_price = extract_price_from_query(query)
    
    results = []
    print("DEBUG scores:", [round(s.item(), 3) for s in top_results[0][:5]])
    for score, idx in zip(top_results[0], top_results[1]):
        score_value = score.item()
        
        # Lower base threshold but stricter priority filter
        if score_value < 0.05: 
            continue
        
        product = product_data[idx.item()]
        
        raw_category = product.get('category', '')
        raw_name = product.get('name', '')
        brand = product.get('brand', '').lower()
        
        category_clean = clean_text(str(raw_category))
        name_clean = clean_text(str(raw_name))
        
        priority_bonus = 0
        
        is_exact_match = False
        # HIGH-FIDELITY MATCH BOOST 
        if original_query == name_clean:
            is_exact_match = True
            priority_bonus += 50.0  # Điểm tuyệt đối
        elif original_query in name_clean or original_query in category_clean:
            # Exact substring match in name or category gets massive boost
            priority_bonus += 3.0
        else:
            # Word-by-word match boost
            query_words = [w for w in original_query.split() if len(w) >= 2]
            match_count = sum(1 for w in query_words if w in name_clean or w in category_clean)
            if match_count > 0:
                # If even 1 word matches, we boost it significantly for sensitivity
                priority_bonus += (0.5 * match_count)

        # SENSITIVITY FILTER 
        # If no keywords match, the semantic similarity alone must be very strong
        if score_value < 0.35 and priority_bonus == 0:
            continue
        
        # 🚀 SMART SPEC-BASED BOOSTING (Logic mới của Antigravity)
        search_text = product.get('search_text', '').lower()
        
        if is_gaming_intent:
            # Ưu tiên Laptop/Phone Gaming thực thụ
            gaming_hardware = ['rtx', 'gtx', '144hz', '165hz', '240hz', 'snapdragon 8 gen', 'a17 pro', 'a18 pro', 'apple a17', 'dimensity 9300']
            if any(hw in search_text for hw in gaming_hardware):
                priority_bonus += 5.0 
            
            # Phạt máy cấu hình thấp/văn phòng/tablet khi tìm game
            low_end_keywords = ['game nhe', 'co ban', 'gia re', 'van phong', 'chip u', 'snapdragon 4', 'snapdragon 6', 'tab', 'tablet', 'may tinh bang']
            if any(k in search_text for k in low_end_keywords):
                priority_bonus -= 30.0 
                
        if is_work_intent:
            # Ưu tiên máy trạm, đồ họa, lập trình
            work_hardware = ['macbook pro', 'workstation', 'i7', 'i9', 'm2 pro', 'm3 pro', 'm4 pro', 'ram 16gb', 'ram 32gb', 'oled', '6000 nit', 'rtx']
            if any(hw in search_text for hw in work_hardware):
                priority_bonus += 3.0
        
        if is_office_intent:
            # Ưu tiên Laptop mỏng nhẹ, pin trâu, MacBook Air
            office_hardware = ['macbook air', 'ultrabook', 'mong nhe', 'pin lau', 'pin trau', '13 inch', '14 inch', 'i5']
            if any(hw in search_text for hw in office_hardware):
                priority_bonus += 2.0

        if is_photography_intent:
            # Ưu tiên Smartphone Camera chất lượng
            photo_hardware = ['48mp', '50mp', '108mp', '200mp', 'chong rung quang hoc', 'ois', 'leica', 'hassellblad', 'zeiss', 'tele', 'zoom 100x']
            if any(hw in search_text for hw in photo_hardware):
                priority_bonus += 4.0 
            
            # Phạt LAPTOP khi tìm chụp hình
            if 'laptop' in search_text or 'may tinh xach tay' in search_text:
                priority_bonus -= 10.0
        
        if is_health_sport_intent:
            # Ưu tiên Đồng hồ thể thao/sức khỏe
            sport_hardware = ['chong nuoc 5atm', 'chong nuoc 10atm', 'gps', 'nhip tim', 'spo2', 'giac ngu', 'silicon', 'the thao', 'chay bo']
            if any(hw in search_text for hw in sport_hardware):
                priority_bonus += 4.0
            
            # Phạt ĐỦNG HỒ CƠ / DÂY KIM LOẠI khi tìm thể thao
            if 'day da' in search_text or 'dong ho co' in search_text:
                priority_bonus -= 2.0

        if is_budget_intent:
            # Ưu tiên sản phẩm đang GIẢM GIÁ MẠNH (%)
            discount_val = product.get('discount', 0)
            if discount_val >= 20:
                priority_bonus += 2.0 # Giảm cực mạnh
            elif discount_val >= 10:
                priority_bonus += 1.0

        if is_lux_intent:
            # Ưu tiên các dòng cao cấp, Titan, Pro Max, Flagship
            lux_hardware = ['titan', 'pro max', 'ultra', 'flagship', 'gold', 'da that', 'ceramic', 'thep khong gi']
            if any(hw in search_text for hw in lux_hardware):
                priority_bonus += 2.0

        # Bonus theo thương hiệu (Stronger)
        if detected_brand and detected_brand == brand:
            priority_bonus += 0.5
        
        # Bonus theo giá
        if target_price:
            product_price = product.get('price', 0)
            price_diff = abs(product_price - target_price) / target_price
            if price_diff < 0.2:
                priority_bonus += 0.2
        
        # Bonus sản phẩm bán chạy / đánh giá cao
        sold = product.get('sold', 0)
        rating = product.get('rating', 0)
        priority_bonus += (sold / 1000) + (rating / 10)
        
        final_score = score_value + priority_bonus
        
        results.append({
            "slug": product['slug'],
            "name": product['name'],
            "price": product['price'],
            "brand": product['brand'],
            "category": product['category'],
            "base_score": round(score_value, 4),
            "bonus": round(priority_bonus, 4),
            "final_score": round(final_score, 4),
            "exact_match": is_exact_match
        })
    
    # Sắp xếp lại dựa trên điểm cuối cùng (Cực kỳ quan trọng)
    results.sort(key=lambda x: x['final_score'], reverse=True)
    
    # Xem có sản phẩm nào khớp chính xác tên 100% không
    exact_matches = [r for r in results if r.get('exact_match', False)]
    if exact_matches:
        results = exact_matches  # Chỉ lấy đúng sản phẩm khớp tuyệt đối

    # Chỉ lấy top_n sau khi đã sắp xếp điểm cuối cùng
    final_results = results[:top_n]
    
    # Log debug top 5 kết quả đầu tiên để kiểm soát
    print(f"\n--- TOP SEARCH RESULTS FOR: '{query}' ---")
    for r in final_results[:5]:
        print(f"[{r['final_score']}] {r['name']} (Base: {r['base_score']}, Bonus: {r['bonus']})")
    print("---------------------------------------\n")
    
    print(f"🔍 Tìm kiếm: '{query}' -> {len(results)} kết quả")
    
    return jsonify({
        "success": True,
        "query": query,
        "total": len(final_results),
        "results": final_results,
        "expanded_query": expanded_query
    })

# ==================== API 3: VISUAL SEARCH (SKELETON) ====================

@app.route('/api/visual-search', methods=['POST'])
def visual_search():
    global image_embeddings, product_data, _clip_text_embeddings
    
    image_url = None
    image_stream = None
    
    if request.is_json:
        data = request.get_json()
        image_url = data.get('image_url')
        top_n = data.get('top_n', 10)
    else:
        image_url = request.form.get('image_url')
        top_n = int(request.form.get('top_n', 10))
        if 'image' in request.files:
            image_stream = request.files['image'].stream
            
    if not image_stream and not image_url:
        return jsonify({"success": False, "error": "Không có hình ảnh"}), 400
        
    try:
        # Load model nếu chưa có
        if image_embeddings is None and os.path.exists('model_data.pkl'):
            with open('model_data.pkl', 'rb') as f:
                saved = pickle.load(f)
                image_embeddings = saved.get('image_embeddings')
                _clip_text_embeddings = saved.get('clip_text_embeddings')
                product_data = saved['products']
                
        if image_embeddings is None:
             return jsonify({"success": False, "error": "Chưa huấn luyện AI hình ảnh"}), 400
             
        clip_text_embeddings = _clip_text_embeddings
             
        # 1. Xử lý ảnh query
        if image_stream:
            img = Image.open(image_stream).convert("RGB")
        else:
            img = download_image(image_url)
            if not img:
                 return jsonify({"success": False, "error": "Không thể tải ảnh từ URL"}), 400
        
        # 2. Extract embedding bằng CLIP
        query_embedding = clip_model.encode(img, convert_to_tensor=True)

        # 3. Dự đoán Category của ảnh query (Zero-shot Classification)
        category_tokens = clip_model.encode(CATEGORIES_LIST, convert_to_tensor=True)
        category_sim = util.cos_sim(query_embedding, category_tokens)[0]
        best_cat_idx = torch.argmax(category_sim).item()
        predicted_category_raw = CATEGORIES_LIST[best_cat_idx].split()[0] # Lấy từ tiếng Anh đầu tiên làm key
        
        print(f"DEBUG: Dự đoán ảnh thuộc loại: {predicted_category_raw}")

        # 4. So khớp thông minh: ảnh có thật → dùng image vector, ảnh lỗi → dùng text vector
        if not isinstance(image_embeddings, torch.Tensor):
            image_embeddings = torch.tensor(image_embeddings)
            
        sim_image = util.cos_sim(query_embedding, image_embeddings)[0]
        
        # Kết hợp với CLIP Text Embedding (Zero-shot Vision)
        if clip_text_embeddings is not None:
            if not isinstance(clip_text_embeddings, torch.Tensor):
                clip_text_embeddings = torch.tensor(clip_text_embeddings)
            sim_text = util.cos_sim(query_embedding, clip_text_embeddings)[0]
            
            # Smart routing
            has_image = (image_embeddings.sum(dim=1) != 0).float() 
            similarities = sim_image * has_image + sim_text * (1 - has_image)
        else:
            similarities = sim_image
        
        # 5. Lấy Top kết quả và áp dụng Boosting theo Category
        top_k = min(50, len(product_data)) # Lấy candidate rộng hơn để lọc
        top_results = torch.topk(similarities, k=top_k)
        
        results = []
        for score, idx in zip(top_results[0], top_results[1]):
            score_value = score.item()
            product = product_data[idx.item()]
            
            # Ngưỡng cơ bản
            if score_value < 0.10: continue 
            
            # Category Boosting
            final_score = score_value
            prod_cat = str(product.get('category', '')).lower()
            prod_name = str(product.get('name', '')).lower()
            
            # Nếu category dự đoán khớp với category hoặc tên sản phẩm
            # if predicted_category_raw in prod_cat or predicted_category_raw in prod_name:
            #     final_score += 0.15 # Boost mạnh nếu đúng loại
            mapped_keywords = CATEGORY_MAP.get(predicted_category_raw, [predicted_category_raw])

            if any(k in prod_cat or k in prod_name for k in mapped_keywords):
                     final_score += 0.15
            
            results.append({
                "slug": product['slug'],
                "name": product['name'],
                "price": product['price'],
                "image_url": product.get('image_url'),
                "brand": product.get('brand'),
                "category": product.get('category'),
                "similarity_score": round(score_value, 4),
                "final_score": round(final_score, 4),
                "predicted_category": predicted_category_raw
            })
            
        # Sắp xếp lại theo final_score
        results.sort(key=lambda x: x['final_score'], reverse=True)
        results = results[:top_n]
            
        print(f"📷 Tìm kiếm hình ảnh hoàn tất: {len(results)} kết quả. Predicted: {predicted_category_raw}")

        
        return jsonify({
            "success": True,
            "total": len(results),
            "results": results
        })

    except Exception as e:
        print(f"Lỗi Visual Search: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== API 4: HEALTH ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": product_embeddings is not None,
        "products_count": len(product_data) if product_data else 0
    })

# ==================== API 6: SIMILAR PRODUCTS ====================

@app.route('/api/similar-products/<slug>', methods=['GET'])
def get_similar_products(slug):
    global image_embeddings, product_data
    
    top_n = int(request.args.get('top_n', 10))
    
    # Load model nếu chưa có
    if image_embeddings is None and os.path.exists('model_data.pkl'):
        with open('model_data.pkl', 'rb') as f:
            saved = pickle.load(f)
            image_embeddings = saved.get('image_embeddings')
            product_data = saved['products']
            
    if image_embeddings is None or not any(p['slug'] == slug for p in product_data):
        return jsonify({"success": False, "error": "Sản phẩm không tồn tại hoặc AI chưa sẵn sàng"}), 404
        
    # 1. Tìm index của sản phẩm mục tiêu
    target_idx = -1
    for i, p in enumerate(product_data):
        if p['slug'] == slug:
            target_idx = i
            break
            
    target_embedding = image_embeddings[target_idx].unsqueeze(0)
    
    # 2. Tính độ tương đồng với tất cả sản phẩm khác
    if not isinstance(image_embeddings, torch.Tensor):
        image_embeddings = torch.tensor(image_embeddings)
        
    similarities = util.cos_sim(target_embedding, image_embeddings)[0]
    
    # 3. Lấy Top kết quả (loại bỏ chính nó)
    top_k = min(top_n + 1, len(product_data))
    top_results = torch.topk(similarities, k=top_k)
    
    results = []
    for score, idx in zip(top_results[0], top_results[1]):
        if idx.item() == target_idx: continue
        
        product = product_data[idx.item()]
        results.append({
            "slug": product['slug'],
            "name": product['name'],
            "price": product['price'],
            "image_url": product.get('image_url'),
            "similarity_score": round(score.item(), 4)
        })
        
        if len(results) >= top_n:
            break
            
    return jsonify({
        "success": True,
        "results": results
    })

# API 5: AUTO COMPLETE

@app.route('/api/autocomplete', methods=['GET'])
def autocomplete():
    prefix = request.args.get('q', '').strip().lower()
    
    if not prefix or len(prefix) < 2:
        return jsonify({"suggestions": []})
    
    suggestions = set()
    
    for product in product_data:
        name = product.get('name', '').lower()
        if prefix in name:
            suggestions.add(name[:60])
    
    common_suggestions = [
        "laptop gaming", "laptop sinh viên", "laptop văn phòng", "laptop mỏng nhẹ",
        "điện thoại chụp ảnh đẹp", "điện thoại pin trâu", "điện thoại livestream",
        "tai nghe chống ồn", "tai nghe bluetooth", "tai nghe không dây",
        "đồng hồ thông minh", "đồng hồ thể thao", "đồng hồ chống nước",
        "chuột không dây", "bàn phím cơ", "loa bluetooth", "pin dự phòng"
    ]
    
    for sug in common_suggestions:
        if prefix in sug:
            suggestions.add(sug)
    
    return jsonify({
        "success": True,
        "prefix": prefix,
        "suggestions": list(suggestions)[:10]
    })

# ==================== RUN ====================

if __name__ == "__main__":
    print("\n" + "="*50)
    print(" AI SMART SERVICE ĐÃ SẴN SÀNG")
    print("="*50)
    print(f"Model: paraphrase-multilingual-MiniLM-L12-v2")
    print(f"Port: 5002")
    print(f"API Endpoints:")
    print(f"   POST /api/train          - Huấn luyện AI")
    print(f"   POST /api/search         - Tìm kiếm thông minh")
    print(f"   POST /api/visual-search  - Tìm kiếm hình ảnh (Skeleton)")
    print(f"   GET  /api/health         - Kiểm tra trạng thái")
    print(f"   GET  /api/autocomplete   - Gợi ý từ khóa")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5002, debug=False)



