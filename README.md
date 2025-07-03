# API Performance Comparison: Golang vs NestJS vs Python

โปรเจคนี้เป็นการเปรียบเทียบ performance ของ API ที่สร้างด้วย 3 ภาษา/framework ที่แตกต่างกัน:

- **Golang** (Gin framework)
- **NestJS** (TypeScript)
- **Python** (FastAPI)

## 🎯 วัตถุประสงค์

เพื่อวัดและเปรียบเทียบ performance ของ API ในการจัดการกับ:
- CRUD operations
- Complex database queries
- High concurrent load

## 🏗️ Architecture

```
├── golang-api/          # Golang API with Gin
├── nestjs-api/          # NestJS API with TypeORM
├── python-api/          # Python API with FastAPI
├── database/            # PostgreSQL setup
├── load-test/           # K6 load testing scripts
└── docker-compose.yml   # Docker orchestration
```

## 📊 Database Schema

ฐานข้อมูล PostgreSQL ประกอบด้วย:
- **users** - ข้อมูลผู้ใช้
- **products** - ข้อมูลสินค้า  
- **orders** - ข้อมูลคำสั่งซื้อ
- **order_items** - รายการสินค้าในคำสั่งซื้อ

## 🚀 วิธีการใช้งาน

### 1. เตรียมสภาพแวดล้อม

```bash
# Clone project
git clone <repository-url>
cd go_nest_python
```

### 2. Start All Services

```bash
# Start PostgreSQL and all APIs
docker-compose up -d

# Check services status
docker-compose ps
```

### 3. Verify APIs

```bash
# Golang API
curl http://localhost:8080/api/v1/health

# NestJS API  
curl http://localhost:3000/api/v1/health

# Python API
curl http://localhost:8000/api/v1/health
```

### 4. Run Performance Tests

```bash
# Install k6 (if not installed)
# macOS: brew install k6
# Windows: choco install k6
# Linux: https://k6.io/docs/getting-started/installation/

# Run all tests
./load-test/run-tests.sh
```

## 📡 API Endpoints

### CRUD Operations
- `GET /api/v1/users` - ดึงรายการผู้ใช้
- `GET /api/v1/users/{id}` - ดึงผู้ใช้ตาม ID
- `POST /api/v1/users` - สร้างผู้ใช้ใหม่
- `PUT /api/v1/users/{id}` - อัพเดทผู้ใช้
- `DELETE /api/v1/users/{id}` - ลบผู้ใช้

### Complex Queries
- `GET /api/v1/orders-with-users` - JOIN query ระหว่าง orders และ users
- `GET /api/v1/user-order-summary` - สรุปยอดสั่งซื้อของผู้ใช้
- `GET /api/v1/analytics` - Analytics query ที่ซับซ้อน

### Health Check
- `GET /api/v1/health` - ตรวจสอบสถานะ API

## 🧪 Load Test Scenarios

### Test Configuration
- **Ramp-up**: 0 → 50 → 100 users ใน 3 นาที
- **Steady**: 100 concurrent users เป็นเวลา 2 นาที  
- **Ramp-down**: 100 → 0 users ใน 30 วินาที

### Test Cases
1. **Health checks** - ทดสอบ basic response
2. **Simple queries** - GET users with pagination
3. **Complex queries** - JOIN และ aggregation
4. **CRUD operations** - Create, Read, Update, Delete
5. **Mixed workload** - รวมทุก operation

## 📈 Performance Metrics

### Key Metrics ที่วัด:
- **Response Time** (p50, p95, p99)
- **Throughput** (requests/second)
- **Error Rate** (%)
- **Resource Usage** (CPU, Memory)

### Expected Results:
- **Golang**: High throughput, low latency
- **NestJS**: Balanced performance, good developer experience
- **Python**: Lower throughput but good for complex logic

## 🔧 Development

### Local Development

```bash
# Golang API
cd golang-api
go mod tidy
go run main.go

# NestJS API
cd nestjs-api
npm install
npm run start:dev

# Python API
cd python-api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database Migration

```bash
# Connect to PostgreSQL
docker exec -it postgres_db psql -U postgres -d performance_test

# Run initial schema
\i /docker-entrypoint-initdb.d/init.sql
```

## 📋 Prerequisites

- Docker & Docker Compose
- K6 (for load testing)
- Go 1.21+ (for local development)
- Node.js 18+ (for local development)  
- Python 3.11+ (for local development)

## 🛠️ Technology Stack

| Component | Golang | NestJS | Python |
|-----------|--------|--------|--------|
| Framework | Gin | NestJS | FastAPI |
| ORM | sql/database | TypeORM | SQLAlchemy |
| Validation | Manual | class-validator | Pydantic |
| Language | Go 1.21 | TypeScript | Python 3.11 |

## 📝 Test Results

หลังจากรัน load test เสร็จแล้ว ผลลัพธ์จะถูกบันทึกเป็นไฟล์ JSON:
- `results-golang-*.json`
- `results-nestjs-*.json`  
- `results-python-*.json`
- `results-combined-*.json`

## 🤝 Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**หมายเหตุ**: โปรเจคนี้สร้างขึ้นเพื่อการศึกษาและเปรียบเทียบ performance เท่านั้น ไม่ได้มีจุดประสงค์เพื่อการใช้งานจริงใน production 