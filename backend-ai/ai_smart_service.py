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
product_data = []

# Cache for query embeddings to speed up repeating searches
@lru_cache(maxsize=1000)
def get_query_embedding(query_text):
    return model.encode(query_text, convert_to_tensor=True)

print("Các model đã sẵn sàng!")

# ==================== HÀM TIỆN ÍCH ====================

def clean_text(text):
    """Làm sạch văn bản, chuẩn hóa tiếng Việt"""
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

# ==================== API 1: TRAIN ====================

@app.route('/api/train', methods=['POST'])
def train_model():
    global product_embeddings, image_embeddings, product_data
    
    data = request.get_json()
    products = data.get('products', [])
    
    if not products:
        return jsonify({"success": False, "error": "Không có sản phẩm để train"}), 400
    
    print(f"📚 Bắt đầu train AI với {len(products)} sản phẩm...")
    
    texts = []
    images = []
    product_data = []
    
    print(f"DEBUG: First product keys: {products[0].keys() if products else 'None'}")
    
    for product in products:
        text = build_product_text(product)
        texts.append(text)
        
        # Thêm URL hình ảnh để xử lý
        images_list = product.get('images', [])
        img_url = product.get('thumbnail')
        if not img_url and images_list and len(images_list) > 0:
            # Handle both string array and object array
            first_img = images_list[0]
            if isinstance(first_img, dict):
                img_url = first_img.get('url')
            else:
                img_url = first_img

        product_data.append({
            'slug': product.get('slug'),
            'name': product.get('name'),
            'price': product.get('price'),
            'brand': product.get('brand'),
            'category': str(product.get('category', '')),
            'sold': product.get('sold', 0),
            'rating': product.get('rating', 0),
            'discount': product.get('discountPercentage', 0),
            'image_url': img_url
        })
        
        if img_url:
            img = download_image(img_url)
            if img:
                images.append(img)
            else:
                print(f"DEBUG: Failed to download {img_url}")
                images.append(None)
        else:
            images.append(None)
    
    # Text Embeddings
    product_embeddings = model.encode(texts, convert_to_tensor=True)
    
    # Image Embeddings (chỉ embed những ảnh tải được)
    img_valid_indices = [i for i, img in enumerate(images) if img is not None]
    img_valid_objects = [images[i] for i in img_valid_indices]
    
    image_embeddings = torch.zeros((len(products), 512)) # CLIP ViT-B-32 has 512 dim
    if img_valid_objects:
        valid_embs = clip_model.encode(img_valid_objects, convert_to_tensor=True)
        for i, idx in enumerate(img_valid_indices):
            image_embeddings[idx] = valid_embs[i]
            
    with open('model_data.pkl', 'wb') as f:
        pickle.dump({
            'embeddings': product_embeddings,
            'image_embeddings': image_embeddings,
            'products': product_data
        }, f)
    
    print(f"Train hoàn tất! Đã tạo {len(products)} vector text và {len(img_valid_objects)} vector hình ảnh")
    
    return jsonify({
        "success": True,
        "message": f"Đã huấn luyện thành công {len(products)} sản phẩm",
        "count": len(products),
        "images_indexed": len(img_valid_objects)
    })

# ==================== API 2: SEARCH ====================

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
    
    # ===== INTENT EXPANSION =====
    # Laptop
    if any(k in original_query for k in ['laptop', 'may tinh xach tay', 'notebook']):
        expanded_query += " laptop may tinh xach tay"
    
    # Điện thoại
    if any(k in original_query for k in ['dien thoai', 'smartphone', 'mobile']):
        expanded_query += " dien thoai dt"
    
    # Tai nghe
    if any(k in original_query for k in ['tai nghe', 'headphone', 'earphone', 'airpod']):
        expanded_query += " tai nghe am thanh khong day bluetooth"
    
    # Đồng hồ
    if any(k in original_query for k in ['dong ho', 'watch', 'smartwatch']):
        expanded_query += " dong ho thong minh deo tay"
    
    # Intent cho Game / Hiệu suất
    if any(k in original_query for k in ['game', 'gaming', 'choi game', 'cay game', 'muot', 'ko lag', 'cuc muot', 'chip manh', 'mat']):
        expanded_query += " gaming cau hinh manh hieu nang cao tan nhiet chip khung snapdragon muot ma"
    
    # Intent cho cấu hình/Pin
    if any(k in original_query for k in ['pin trau', 'pin lau', 'pin tot', 'xai lau', 'sac nhanh', 'pin cuc tot']):
        expanded_query += " pin dung luong lon sac nhanh 5000mah 4000mah"
        
    # Intent Camera / Chụp ảnh
    if any(k in original_query for k in ['livestream', 'quay phim', 'tiktok', 'chup anh', 'selfie', 'camera']):
        expanded_query += " camera ong chong rung quay 4k chup hinh dep sac net"
    
    # Intent cho phụ nữ / sắc đẹp
    if any(k in original_query for k in ['phu nu', 'con gai', 'cho nu', 'nu dung', 'vo']):
        expanded_query += " thiet ke dep thoi trang nho gon mau hong vang sang trong"
        
    # Intent giá rẻ / sinh viên / tầm trung
    if any(k in original_query for k in ['sinh vien', 'hoc sinh', 'gia re', 're', 'vua tien', 'tam trung']):
        expanded_query += " giá rẻ khuyến mãi giảm giá sinh viên bình dân ưu đãi tốt"
        
    # Intent cao cấp / sang trọng
    if any(k in original_query for k in ['cao cap', 'sang trong', 'xin', 'doanh nhan', 'pro', 'max', 'flagship']):
        expanded_query += " cao cấp sang trọng thiết kế tinh tế chất liệu quý đẳng cấp"

    # Intent cho phái nữ (refined)
    if any(k in original_query for k in ['phu nu', 'con gai', 'cho nu', 'nu dung', 'vo', 'tang nu', 'dep cho nu']):
        expanded_query += " mỏng nhẹ màu hồng màu tím màu vàng hồng kiểu dáng thanh lịch thời trang"

    # Intent làm việc / văn phòng
    if any(k in original_query for k in ['lam viec', 'van phong', 'cong viec', 'office', 'hoc tap']):
        expanded_query += " làm việc văn phòng bền bỉ ổn định xử lý văn bản đa nhiệm"
    
    # Search
    query_embedding = get_query_embedding(expanded_query) # Using cached function
    similarities = util.cos_sim(query_embedding, product_embeddings)[0]
    
    top_k = min(50, len(product_data))
    top_results = torch.topk(similarities, k=top_k)
    
    detected_brand = detect_brand_in_query(query)
    target_price = extract_price_from_query(query)
    
    results = []
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
        
        # 🌟 HIGH-FIDELITY MATCH BOOST 🌟
        if original_query in name_clean or original_query in category_clean:
            # Exact substring match in name or category gets massive boost
            priority_bonus += 3.0 
        else:
            # Word-by-word match boost
            query_words = [w for w in original_query.split() if len(w) >= 2]
            match_count = sum(1 for w in query_words if w in name_clean or w in category_clean)
            if match_count > 0:
                # If even 1 word matches, we boost it significantly for sensitivity
                priority_bonus += (0.5 * match_count)

        # 🌟 SENSITIVITY FILTER 🌟
        # If no keywords match, the semantic similarity alone must be very strong
        if score_value < 0.35 and priority_bonus == 0:
            continue
        
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
            "similarity_score": round(score_value, 4),
            "final_score": round(final_score, 4)
        })
        
        if len(results) >= top_n:
            break
    
    results.sort(key=lambda x: x['final_score'], reverse=True)
    
    print(f"🔍 Tìm kiếm: '{query}' -> {len(results)} kết quả")
    
    return jsonify({
        "success": True,
        "query": query,
        "total": len(results),
        "results": results,
        "expanded_query": expanded_query
    })

# ==================== API 3: VISUAL SEARCH (SKELETON) ====================

@app.route('/api/visual-search', methods=['POST'])
def visual_search():
    global image_embeddings, product_data
    
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "Không có hình ảnh"}), 400
        
    image_file = request.files['image']
    top_n = int(request.form.get('top_n', 10))
    
    try:
        # Load model nếu chưa có
        if image_embeddings is None and os.path.exists('model_data.pkl'):
            with open('model_data.pkl', 'rb') as f:
                saved = pickle.load(f)
                image_embeddings = saved.get('image_embeddings')
                product_data = saved['products']
                
        if image_embeddings is None:
             return jsonify({"success": False, "error": "Chưa huấn luyện AI hình ảnh"}), 400
             
        # 1. Xử lý ảnh query
        img = Image.open(image_file.stream).convert("RGB")
        
        # 2. Extract embedding bằng CLIP
        query_embedding = clip_model.encode(img, convert_to_tensor=True)
        
        # 3. So khớp bằng Cosine Similarity
        # Đảm bảo image_embeddings là tensor
        if not isinstance(image_embeddings, torch.Tensor):
            image_embeddings = torch.tensor(image_embeddings)
            
        similarities = util.cos_sim(query_embedding, image_embeddings)[0]
        
        # 4. Lấy Top kết quả
        top_k = min(top_n, len(product_data))
        top_results = torch.topk(similarities, k=top_k)
        
        results = []
        for score, idx in zip(top_results[0], top_results[1]):
            score_value = score.item()
            # print(f"DEBUG: Match {product_data[idx.item()]['slug']} score: {score_value}")
            
            if score_value < 0.05: continue # Lowered from 0.15
            
            product = product_data[idx.item()]
            results.append({
                "slug": product['slug'],
                "name": product['name'],
                "price": product['price'],
                "similarity_score": round(score_value, 4)
            })
            
        print(f"📷 Tìm kiếm hình ảnh hoàn tất: {len(results)} kết quả. Top score: {top_results[0][0].item() if len(top_results[0]) > 0 else 'N/A'}")
        
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

# ==================== API 5: AUTO COMPLETE ====================

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
