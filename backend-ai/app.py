from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from flask_cors import CORS
import os, json

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
Bạn là AI bán hàng.

BẮT BUỘC:
- Chỉ trả JSON
- KHÔNG được tự tạo productId
- LUÔN chọn 1 sản phẩm từ danh sách
- Nếu không hiểu → chọn sản phẩm đầu tiên

FORMAT:
{
  "reply": "...",
  "productId": "slug",
  "discount": 5-20,
  "reason": "..."
}
"""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
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

        print("FINAL AI:", result)

        return jsonify(result)

    except Exception as e:
        print("CHAT ERROR:", e)

        return jsonify({
            "reply": "Server AI lỗi",
            "productId": None,
            "discount": 0,
            "reason": "exception"
        })


# RUN 
if __name__ == "__main__":
    app.run(port=5001, debug=True)