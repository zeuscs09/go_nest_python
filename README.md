# 🚀 Multi-Language API Performance Comparison

โปรเจคเปรียบเทียบ performance ของ API ที่สร้างด้วย **4 ภาษา/framework** ที่แตกต่างกัน พร้อมระบบ stress testing ที่ครบครัน

## 🎯 ภาษาและ Framework ที่เปรียบเทียบ

| 🌟 | ภาษา | Framework | Port | สี |
|----|------|-----------|------|-----|
| 🟢 | **Golang** | Gin | 8081 | เขียว |
| 🔴 | **NestJS** | TypeScript + NestJS | 3000 | แดง |
| 🟡 | **Python** | FastAPI | 8000 | เหลือง |
| 🔵 | **.NET** | ASP.NET Core | 5001 | น้ำเงิน |

## 🏆 ผลการเปรียบเทียบล่าสุด

```
🥇 #1 GOLANG:  2.48ms avg response time
🥈 #2 .NET:    2.65ms avg response time  
🥉 #3 NESTJS:  4.17ms avg response time
🏅 #4 PYTHON:  5.53ms avg response time
```

## 🎯 วัตถุประสงค์

เพื่อวัดและเปรียบเทียบ performance ในด้าน:
- **Response Time** - ความเร็วในการตอบสนอง
- **Throughput** - จำนวน requests ที่จัดการได้ต่อวินาที
- **Scalability** - ความสามารถในการรับมือกับ load สูง
- **Reliability** - ความเสถียรภายใต้ pressure
- **Resource Usage** - การใช้งาน CPU และ Memory

## 🏗️ Architecture

```
📁 go_nest_python/
├── 🟢 golang-api/           # Golang API (Gin framework)
├── 🔴 nestjs-api/           # NestJS API (TypeScript)
├── 🟡 python-api/           # Python API (FastAPI)
├── 🔵 dotnet-api/           # .NET API (ASP.NET Core)
├── 🗄️  database/            # PostgreSQL setup & migrations
├── 🧪 k6-tests/             # Comprehensive stress testing suite
├── 🐳 docker-compose.yml    # Docker orchestration
└── 📖 README.md            # This documentation
```

## 📊 Database Schema

ฐานข้อมูล PostgreSQL ที่ครอบคลุม:
```sql
users        - ข้อมูลผู้ใช้งาน
products     - ข้อมูลสินค้า  
orders       - ข้อมูลคำสั่งซื้อ
order_items  - รายการสินค้าในคำสั่งซื้อ
```

## 🚀 Quick Start

### 1. เตรียมสภาพแวดล้อม

```bash
# Clone repository
git clone <repository-url>
cd go_nest_python
```

### 2. Start All Services

```bash
# Start PostgreSQL และ APIs ทั้งหมด
docker compose up -d

# ตรวจสอบสถานะ services
docker compose ps
```

### 3. Verify APIs Health

```bash
# 🟢 Golang API (Port 8081)
curl http://localhost:8081/api/v1/health

# 🔴 NestJS API (Port 3000)
curl http://localhost:3000/api/v1/health

# 🟡 Python API (Port 8000)  
curl http://localhost:8000/

# 🔵 .NET API (Port 5001)
curl http://localhost:5001/health
```

### 4. Run Performance Comparison

```bash
cd k6-tests

# 🏆 เปรียบเทียบ performance (แนะนำ!)
./run-stress-tests.sh compare

# ⚡ ทดสอบเร็ว (5 นาที)
./run-stress-tests.sh quick

# 🌊 ทดสอบ spike handling (15 นาที)  
./run-stress-tests.sh spike

# 🔥 ทดสอบเต็มรูปแบบ (30 นาที)
./run-stress-tests.sh full

# 🔍 วิเคราะห์ผลการทดสอบ
./run-stress-tests.sh analyze
```

## 📡 API Endpoints

### CRUD Operations
```
GET    /api/v1/users              - ดึงรายการผู้ใช้ (with pagination)
GET    /api/v1/users/{id}         - ดึงผู้ใช้ตาม ID
POST   /api/v1/users              - สร้างผู้ใช้ใหม่
PUT    /api/v1/users/{id}         - อัปเดตผู้ใช้
DELETE /api/v1/users/{id}         - ลบผู้ใช้
```

### Complex Analytics
```
GET    /api/v1/analytics          - Complex aggregation queries
GET    /api/v1/orders-with-users  - JOIN operations
GET    /api/v1/user-order-summary - User summary analytics
```

### Health Monitoring
```
GET    /api/v1/health     - Golang, NestJS, Python
GET    /health            - .NET
```

## 🧪 Stress Testing Suite

### 📋 Test Types Available

| Test Type | Duration | Max Users | Purpose |
|-----------|----------|-----------|---------|
| **Compare** | 5 min | 50 | Fair API comparison |
| **Quick** | 5 min | 200 | Quick health check |
| **Spike** | 15 min | 500 | Sudden traffic handling |
| **Full** | 30 min | 400 | Endurance testing |

### 🎯 Test Scenarios

1. **Health Checks** (30%) - Basic response testing
2. **User Operations** (40%) - CRUD operations  
3. **User Creation** (20%) - Write-heavy testing
4. **Analytics** (10%) - Complex query testing

### 📊 Performance Metrics

- **Response Time**: Average, P95, P99
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **System Resources**: CPU, Memory usage

## 🔍 Analysis & Reporting

### 📈 Automatic Analysis
```bash
# วิเคราะห์ผลล่าสุด
python3 k6-tests/analyze-results.py

# วิเคราะห์ผลทั้งหมด
python3 k6-tests/analyze-results.py --all
```

### 📊 Report Types
- **📄 Text Reports** - Detailed comparison analysis
- **📈 Charts** - Visual performance comparison (with matplotlib)
- **📋 JSON Data** - Raw metrics for custom analysis
- **💻 System Monitoring** - Resource usage tracking

### 🏆 Ranking System
APIs are automatically ranked by:
1. **Response Time** (lower is better)
2. **Error Rate** (lower is better)  
3. **Throughput** (higher is better)

## 🔧 Local Development

### Development Setup

```bash
# 🟢 Golang API
cd golang-api
go mod tidy
go run main.go  # Port 8081

# 🔴 NestJS API  
cd nestjs-api
npm install
npm run start:dev  # Port 3000

# 🟡 Python API
cd python-api
pip install -r requirements.txt
uvicorn main:app --reload  # Port 8000

# 🔵 .NET API
cd dotnet-api
dotnet restore
dotnet run  # Port 5001
```

### Database Setup

```bash
# Start PostgreSQL
docker compose up -d postgres

# Check database connection
./check-database.sh

# Manual connection
docker exec -it postgres_db psql -U postgres -d performance_test
```

## 🛠️ Technology Stack

| Component | 🟢 Golang | 🔴 NestJS | 🟡 Python | 🔵 .NET |
|-----------|-----------|-----------|-----------|---------|
| **Framework** | Gin | NestJS | FastAPI | ASP.NET Core |
| **ORM** | Database/SQL | TypeORM | SQLAlchemy | Entity Framework |
| **Validation** | Manual | class-validator | Pydantic | DataAnnotations |
| **Language** | Go 1.21+ | TypeScript | Python 3.11+ | C# .NET 8 |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 📋 Prerequisites

### Required Software
- **Docker & Docker Compose** - Container orchestration
- **k6** - Load testing tool
  ```bash
  # macOS
  brew install k6
  
  # Windows  
  choco install k6
  
  # Linux
  # See: https://k6.io/docs/getting-started/installation/
  ```

### Optional for Local Development
- **Go 1.21+** (Golang development)
- **Node.js 18+** (NestJS development)
- **Python 3.11+** (Python development)
- **.NET 8 SDK** (.NET development)

## 📊 Recent Performance Results

### Benchmark Comparison (Equal Load - 50 Concurrent Users)

```
🏆 PERFORMANCE RANKING:

🥇 #1 🟢 GOLANG
   • Requests: 2,220
   • Avg Response: 2.48ms
   • P95 Response: 4.20ms
   • Error Rate: 0.0%

🥈 #2 🔵 .NET
   • Requests: 1,961  
   • Avg Response: 2.65ms
   • P95 Response: 4.50ms
   • Error Rate: 0.0%

🥉 #3 🔴 NESTJS
   • Requests: 2,145
   • Avg Response: 4.17ms
   • P95 Response: 7.80ms
   • Error Rate: 0.0%

🏅 #4 🟡 PYTHON
   • Requests: 2,018
   • Avg Response: 5.53ms
   • P95 Response: 10.20ms
   • Error Rate: 0.0%
```

### 📈 Key Insights
- **Golang leads** in pure performance (fastest response time)
- **.NET excels** in stability and enterprise features
- **NestJS provides** best developer experience with TypeScript
- **Python offers** rich ecosystem for data/AI applications

## 🎯 Use Case Recommendations

| Scenario | Recommended API | Reason |
|----------|----------------|---------|
| **High Performance** | 🟢 Golang | Fastest response time |
| **Enterprise** | 🔵 .NET | Robust, scalable, Microsoft ecosystem |
| **Full-stack TypeScript** | 🔴 NestJS | Type safety, modern features |
| **Data Science/AI** | 🟡 Python | Rich libraries, flexibility |

## 🚦 Testing Workflow

### Recommended Testing Sequence

1. **Health Check** 
   ```bash
   ./run-stress-tests.sh check
   ```

2. **API Comparison**
   ```bash  
   ./run-stress-tests.sh compare
   ```

3. **Spike Testing**
   ```bash
   ./run-stress-tests.sh spike
   ```

4. **Analysis**
   ```bash
   ./run-stress-tests.sh analyze
   ```

### Continuous Integration
```bash
# Full test suite with analysis
./run-stress-tests.sh all
```

## 📝 Results & Reports

Test results are saved in `k6-tests/stress-test-results/`:
- **JSON files** - Raw k6 metrics
- **CSV files** - System monitoring data  
- **Text reports** - Analysis summaries
- **Charts** - Visual comparisons (if matplotlib available)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

## 📚 Documentation

- **[K6 Testing Guide](k6-tests/README.md)** - Detailed testing documentation
- **API Documentation** - Available at each API's swagger endpoint
- **Database Schema** - See `database/init.sql`

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **k6** - Modern load testing tool
- **Docker** - Containerization platform  
- **PostgreSQL** - Robust database system
- All the amazing **open-source communities** behind the frameworks

---

## 📞 Support

If you encounter issues or have questions:

1. Check the [k6-tests README](k6-tests/README.md) for detailed testing guide
2. Verify all services are running: `docker compose ps`
3. Check logs: `docker compose logs [service-name]`
4. Open an issue on GitHub

**Happy Performance Testing! 🚀** 