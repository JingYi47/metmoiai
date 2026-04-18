import os, json, sys, io
import traceback

# Ép buộc Python dùng UTF-8 để không bị lỗi tiếng Việt trên console Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# FORMAT PRODUCTS 
def format_products(products):
    result = []

    for p in products:        
        result.append({
            "name": p.get("name"),
            "slug": p.get("slug"),
            "price": p.get("price"),
            "category": str(p.get("category")),
            "brand": p.get("brand"),
            "specs": p.get("specs", {}),
            "description": p.get("description", "")
        })

    return result


#  AI
def ask_ai(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
Bạn là Chuyên viên tư vấn bán hàng cao cấp tại hệ thống Pandora.
Nhiệm vụ của bạn là hỗ trợ khách hàng tìm kiếm và hiểu rõ về các sản phẩm công nghệ (Laptop, iPhone, Phụ kiện...).

PHONG CÁCH:
- Nhiệt tình, lịch sự, chuyên nghiệp như nhân viên tại Apple Store hoặc TikTok Shop top đầu.
- Trả lời súc tích, đi thẳng vào vấn đề nhưng vẫn đầy đủ thông tin.

QUY TẮC TƯ VẤN THÔNG SỐ (SPECS):
- Khi khách hỏi về cấu hình, thông số hoặc chi tiết, hãy đọc kỹ trường 'specs' và 'description' của sản phẩm đó.
- LIỆT KÊ các thông số quan trọng dưới dạng danh sách gạch đầu dòng để khách dễ đọc.
- Nếu thông số từ dữ liệu bị thiếu hoặc ghi 'Chưa cập nhật', hãy khéo léo báo khách là thông tin đang được cập nhật thêm, tránh bịa ra thông số không có thực.

BẮT BUỘC:
- Chỉ trả về định dạng JSON duy nhất.
- KHÔNG được tự tạo productId/slug mới.
- CHỈ chọn sản phẩm từ danh sách nếu nó THỰC SỰ liên quan đến nhu cầu của khách hàng.
- NẾU không tìm thấy sản phẩm nào phù hợp (ví dụ khách hỏi 'máy tính' mà danh sách chỉ có 'đồng hồ'), hãy đặt "productId": null và trong phần "reply", hãy lịch sự thông báo shop hiện chưa có mẫu đó và gợi ý khách xem các sản phẩm khác.

FORMAT TRẢ VỀ:
{
  "reply": "Câu trả lời thân thiện cho khách...",
  "productId": "slug của sản phẩm hoặc null",
  "discount": 5-20,
  "reason": "Giải thích tại sao chọn (hoặc tại sao không chọn) sản phẩm nào"
}
"""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )

        content = response.choices[0].message.content.strip()

        #markdown
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)

        return data

    except Exception as e:
        print("AI ERROR:", e)

        return {
            "reply": "Shop đang bận",
            "productId": None,
            "discount": 10,
            "reason": "AI lỗi"
        }


#CHAT
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)

        print("RAW BODY:", data)

        message = data.get("message")
        products = data.get("products", [])
        recommended = data.get("recommendedProducts", [])

        # DEBUG CỰC MẠNH
        print("PRODUCTS FROM NODE COUNT:", len(products))
        print("SAMPLE PRODUCT:", products[0] if products else "EMPTY")

        products_clean = format_products(products)

        print("CLEAN COUNT:", len(products_clean))
        print("SLUG LIST:", [p["slug"] for p in products_clean])

        
        if not products_clean:
            print("NODE KHÔNG GỬI PRODUCT")

            return jsonify({
                "reply": "Backend chưa gửi sản phẩm",
                "productId": None,
                "discount": 0,
                "reason": "products empty từ Node"
            })

        # PROMPT
        prompt = f"""
User hỏi: "{message}"

Danh sách sản phẩm:
{json.dumps(products_clean, ensure_ascii=False)}

====================
LUẬT:
- CHỈ chọn productId từ danh sách trên
- KHÔNG được tự tạo slug
- LUÔN chọn 1 sản phẩm
- NẾU user hỏi về CẤU HÌNH, TƯ VẤN, hoặc CHI TIẾT của sản phẩm, HÃY DỰA VÀO "specs" và "description" để trả lời thật chính xác, không bịa thông tin.

====================
TRẢ JSON:
{{
  "reply": "chat tự nhiên",
  "productId": "slug",
  "discount": 5-20,
  "reason": "..."
}}
"""

        result = ask_ai(prompt)

        #VALIDATE
        valid_slugs = [p["slug"] for p in products_clean]

        if not result.get("productId") or result["productId"] not in valid_slugs:
            print("AI sai slug:", result.get("productId"))

            
            result["productId"] = products_clean[0]["slug"]

        # print("FINAL AI:", result) # Gây lỗi Unicode trên Windows console

        return jsonify(result)

    except Exception as e:
        import traceback
        print("CHAT ERROR:", e)
        traceback.print_exc()

        return jsonify({
            "reply": "Rất tiếc, hệ thống AI đang gặp sự cố nhỏ. Bạn vui lòng thử lại sau giây lát!",
            "productId": None,
            "discount": 0,
            "reason": str(e)
        })


# RUN 
if __name__ == "__main__":
    app.run(port=5001, debug=True)