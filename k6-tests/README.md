# 🔥 K6 Stress Testing Suite

ชุดการทดสอบประสิทธิภาพและความสามารถในการรับมือกับ load สูงสำหรับ Multi-Language API Project

## 📋 Overview

ชุดการทดสอบนี้ออกแบบมาเพื่อประเมินความสามารถของ APIs ทั้ง 4 ภาษา:
- **Golang** API (Port 8081)
- **NestJS** API (Port 3000)
- **Python** API (Port 8000)
- **.NET** API (Port 5001)

## 🎯 Test Types

### 1. Quick Stress Test (5 นาที)
- **File**: `quick-stress-test.js`
- **Duration**: 5 นาที
- **Peak Load**: 200 concurrent users
- **Purpose**: ทดสอบเบื้องต้นเพื่อหาปัญหาเฉียบพลัน

### 2. Spike Test (15 นาที)
- **File**: `spike-test.js`
- **Duration**: 15 นาที
- **Peak Load**: 500 concurrent users (sudden spikes)
- **Purpose**: ทดสอบการรับมือกับ traffic ที่เพิ่มขึ้นอย่างกะทันหัน

### 3. Full Stress Test (30 นาที)
- **File**: `stress-test.js`
- **Duration**: 30 นาที
- **Peak Load**: 400 concurrent users
- **Purpose**: ทดสอบความเสถียรภาพในระยะยาว

## 🚀 Quick Start

### Prerequisites
```bash
# ติดตั้ง k6
brew install k6

# หรือ
npm install -g k6
```

### เริ่มต้นการทดสอบ

1. **เริ่ม APIs ทั้งหมด**:
   ```bash
   # จากไดเรกทอรีหลัก
   docker compose up -d
   ```

2. **ตรวจสอบสถานะ APIs**:
   ```bash
   ./run-stress-tests.sh check
   ```

3. **รัน Stress Tests**:
   ```bash
   # Quick test (5 นาที)
   ./run-stress-tests.sh quick
   
   # Spike test (15 นาที)
   ./run-stress-tests.sh spike
   
   # Full stress test (30 นาที)
   ./run-stress-tests.sh full
   
   # รันทั้งหมด (50 นาที)
   ./run-stress-tests.sh all
   ```

## 📊 Test Scenarios

### Health Check Scenario
- ทดสอบ health endpoints ของแต่ละ API
- วัดเวลาตอบสนองและความพร้อมใช้งาน

### User Operations Scenario
- ทดสอบ CRUD operations สำหรับ users
- สร้างผู้ใช้ใหม่, ดึงข้อมูลผู้ใช้
- ทดสอบการจัดการข้อมูลจำนวนมาก

### Complex Analytics Scenario
- ทดสอบ analytics endpoints ที่มีการคำนวณซับซ้อน
- ทดสอบการประมวลผลข้อมูลขนาดใหญ่
- วัดประสิทธิภาพของ database queries

### Mixed Workload Scenario
- จำลองการใช้งานจริงของผู้ใช้
- ผสมผสาน scenarios ต่างๆ
- ทดสอบความเป็นจริงของ load patterns

## 🎯 Success Criteria

### Performance Thresholds
- **Response Time**: P95 < 500ms, P99 < 1000ms
- **Error Rate**: < 5% สำหรับ normal load, < 15% สำหรับ spike load
- **Success Rate**: > 90% สำหรับ full stress, > 80% สำหรับ spike test

### Monitoring Metrics
- HTTP Request Duration
- HTTP Request Success Rate
- Custom Error Rate
- System Resource Usage (CPU, Memory)

## 📈 Results Analysis

### Output Files
Test results จะถูกเก็บใน `stress-test-results/` directory:

```
stress-test-results/
├── quick-stress-YYYYMMDD-HHMMSS.json
├── spike-test-YYYYMMDD-HHMMSS.json
├── full-stress-YYYYMMDD-HHMMSS.json
├── system-monitor-test-name-YYYYMMDD-HHMMSS.csv
└── stress-test-summary-YYYYMMDD-HHMMSS.txt
```

### Key Metrics to Monitor
1. **Request Rate**: requests per second
2. **Response Time Distribution**: avg, p95, p99
3. **Error Rate**: percentage of failed requests
4. **Throughput**: data transferred per second
5. **Resource Usage**: CPU and memory consumption

## 🔧 Configuration

### Customizing Tests
แก้ไขไฟล์ test เพื่อปรับแต่ง:

```javascript
// ใน stress-test.js
export let options = {
  stages: [
    { duration: '2m', target: 50 },  // ปรับเวลาและจำนวน users
    { duration: '5m', target: 200 }, // ตามความต้องการ
    // ...
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // ปรับ threshold
    'http_req_failed': ['rate<0.05'],   // ปรับ error rate
  },
};
```

### API Configuration
แก้ไข ports และ endpoints ใน test files:

```javascript
const APIS = {
  'golang': {
    baseUrl: 'http://localhost:8081',
    healthEndpoint: '/api/v1/health',
  },
  // ...
};
```

## 🛠️ Commands Reference

### Basic Commands
```bash
# แสดงคำสั่งที่ใช้ได้
./run-stress-tests.sh

# ตรวจสอบสถานะ APIs
./run-stress-tests.sh check

# ลบผลการทดสอบเก่า
./run-stress-tests.sh clean
```

### Manual k6 Commands
```bash
# รัน test แบบกำหนดเอง
k6 run --vus 100 --duration 5m quick-stress-test.js

# รัน test พร้อม output หลายรูปแบบ
k6 run --out json=results.json --out csv=results.csv stress-test.js

# รัน test พร้อม environment variables
k6 run -e API_BASE_URL=http://localhost:8081 stress-test.js
```

## 🐛 Troubleshooting

### Common Issues

1. **APIs Not Running**
   ```bash
   # ตรวจสอบ docker containers
   docker ps
   
   # เริ่ม APIs
   docker compose up -d
   ```

2. **High Error Rates**
   - ลดจำนวน concurrent users
   - เพิ่ม timeout values
   - ตรวจสอบ database connections

3. **System Resource Issues**
   - ตรวจสอบ CPU และ memory usage
   - ปิดโปรแกรมอื่นๆ ที่ไม่จำเป็น
   - ปรับแต่ง database connection pools

### Debug Mode
```bash
# รัน test พร้อม debug information
k6 run --http-debug stress-test.js

# รัน test แบบ verbose
k6 run --verbose stress-test.js
```

## 📚 Best Practices

### Before Testing
1. ✅ ตรวจสอบให้แน่ใจว่า APIs ทั้งหมดทำงานปกติ
2. ✅ ปิดโปรแกรมอื่นๆ ที่ใช้ทรัพยากรเครื่อง
3. ✅ ตรวจสอบ database connections
4. ✅ เตรียม disk space สำหรับ test results

### During Testing
1. 📊 ติดตาม system resources
2. 🔍 ดูผลลัพธ์ระหว่างทดสอบ
3. ⚠️ หยุดทดสอบหากเกิดปัญหาร้ายแรง

### After Testing
1. 📋 วิเคราะห์ผลการทดสอบ
2. 🔧 ปรับปรุงจุดอ่อนที่พบ
3. 📈 เปรียบเทียบผลลัพธ์ระหว่าง APIs
4. 🗄️ เก็บผลการทดสอบสำหรับอ้างอิง

## 🤝 Contributing

หากต้องการเพิ่ม test scenarios หรือปรับปรุง:

1. สร้าง test file ใหม่ใน `k6-tests/`
2. เพิ่ม command ใหม่ใน `run-stress-tests.sh`
3. อัปเดต README นี้
4. ทดสอบให้แน่ใจว่าทำงานได้ถูกต้อง

## 📞 Support

หากมีปัญหาหรือคำถาม:
- ตรวจสอบ logs ใน `stress-test-results/`
- ดู troubleshooting section ด้านบน
- ตรวจสอบ API health endpoints 