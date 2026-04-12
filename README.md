# Pandora Pro - AI E-Commerce Platform

Chào mừng bạn đến với **Pandora Pro**, một nền tảng thương mại điện tử hiện đại, tích hợp các tính năng AI tiên tiến như Tìm kiếm thông minh bằng ngữ nghĩa và Tìm kiếm bằng hình ảnh (Visual Search).

## 🚀 Tính Năng Nổi Bật

- **AI Visual Search**: Tìm kiếm sản phẩm tương tự bằng cách tải lên hình ảnh (Sử dụng công nghệ OpenAI CLIP).
- **Smart Semantic Search**: Tìm kiếm theo ý nghĩa và ngữ cảnh thay vì chỉ dựa trên từ khóa chính xác (Sử dụng Sentence-BERT).
- **E-Commerce Core**: Đầy đủ tính năng mua sắm, giỏ hàng, thanh toán và quản lý đơn hàng.
- **Admin Dashboard**: Giao diện quản lý sản phẩm, danh mục và người dùng chuyên nghiệp.

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React.js, Tailwind CSS, Lucide Icons.
- **Backend (Web)**: Node.js, Express.js, MongoDB (Mongoose).
- **Backend (AI)**: Python, Flask, Sentence-Transformers (PyTorch), CLIP.

## 📦 Hướng Dẫn Cài Đặt và Chạy

### 1. Web Backend (Node.js)
```bash
cd backend
npm install
npm start
```
*Lưu ý: Bạn cần cấu hình file `.env` với URI MongoDB của mình.*

### 2. AI Service (Python)
Dịch vụ AI chạy trên cổng 5002.
```bash
cd backend-ai
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python ai_smart_service.py
```

### 3. Frontend (React)
```bash
cd frontend/user
npm install
npm start
```

## 📷 Cách Sử Dụng Visual Search
1. Truy cập trang chủ Pandora Pro.
2. Nhấn vào biểu tượng **Camera** ở thanh tìm kiếm.
3. Tải lên một hình ảnh sản phẩm (ví dụ: iPhone, Apple Watch).
4. AI sẽ phân tích "chữ ký hình ảnh" và liệt kê các sản phẩm tương tự có trong cửa hàng.

## 📝 Lưu ý quan trọng cho AI
Để tính năng tìm kiếm bằng hình ảnh hoạt động tốt nhất, hãy đảm bảo các sản phẩm trong Database có link ảnh (URL) thật và còn hoạt động. AI sẽ tự động đồng bộ hóa các vector hình ảnh qua endpoint `/api/v1/ai/sync` của backend.

---
Dự án được thực hiện bởi **Nghĩa Trần** (nghiatran112333).
