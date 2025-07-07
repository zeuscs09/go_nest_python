# .NET API

.NET 8 Web API สำหรับ Performance Testing และ Multi-Language Comparison

## เทคโนโลยีที่ใช้

- .NET 8 LTS
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Docker

## Endpoints

### User Management
- `GET /api/v1/user` - รับรายการผู้ใช้ทั้งหมด (พร้อม pagination)
- `GET /api/v1/user/{id}` - รับข้อมูลผู้ใช้ตาม ID
- `POST /api/v1/user` - สร้างผู้ใช้ใหม่
- `PUT /api/v1/user/{id}` - อัปเดตข้อมูลผู้ใช้
- `DELETE /api/v1/user/{id}` - ลบผู้ใช้

### Analytics
- `GET /api/v1/orders-with-users` - รับข้อมูล orders พร้อมข้อมูลผู้ใช้
- `GET /api/v1/user-order-summary` - รับสรุปข้อมูล orders ของผู้ใช้
- `GET /api/v1/analytics` - รับข้อมูลวิเคราะห์แบบซับซ้อน

### Health Check
- `GET /health` - ตรวจสอบสถานะของ API
- `GET /api/v1/health` - ตรวจสอบสถานะของ API (รูปแบบ JSON)

## การรันในระบบ

### ด้วย Docker (แนะนำ)
```bash
# รันทั้งระบบ
docker-compose up -d

# รันเฉพาะ .NET API
docker-compose up dotnet-api
```

### ด้วย .NET CLI
```bash
cd dotnet-api
dotnet restore
dotnet run
```

## การทดสอบ

API จะทำงานบนพอร์ต 5000:
- Local: http://localhost:5000
- Docker: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

## ตัวอย่างการใช้งาน

### สร้างผู้ใช้ใหม่
```bash
curl -X POST http://localhost:5000/api/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "city": "Bangkok"
  }'
```

### รับรายการผู้ใช้
```bash
curl http://localhost:5000/api/v1/user?limit=10&offset=0
```

### ตรวจสอบสถานะ
```bash
curl http://localhost:5000/health
```

## Database Schema

API นี้ใช้ PostgreSQL database เดียวกันกับ API อื่น ๆ ในโปรเจค:
- `users` - ข้อมูลผู้ใช้
- `products` - ข้อมูลสินค้า
- `orders` - ข้อมูลออเดอร์
- `order_items` - รายการสินค้าในออเดอร์

## Performance Testing

.NET API นี้ถูกสร้างขึ้นเพื่อเปรียบเทียบประสิทธิภาพกับ:
- Golang API (พอร์ต 8081)
- NestJS API (พอร์ต 3000)
- Python API (พอร์ต 8000)

ทดสอบได้ด้วย k6 load testing tools ที่อยู่ในโปรเจค 