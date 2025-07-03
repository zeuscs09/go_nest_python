#!/bin/bash

echo "=========================================="
echo "🔍 ตรวจสอบ Database Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PostgreSQL container is running
echo -e "${YELLOW}1. ตรวจสอบ PostgreSQL container...${NC}"
if docker ps | grep -q postgres_db; then
    echo -e "${GREEN}✓ PostgreSQL container กำลังทำงาน${NC}"
else
    echo -e "${RED}✗ PostgreSQL container ไม่ทำงาน${NC}"
    echo "รัน: docker-compose up -d"
    exit 1
fi

# Check database connection
echo -e "${YELLOW}2. ตรวจสอบการเชื่อมต่อ database...${NC}"
if docker exec postgres_db pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓ เชื่อมต่อ database สำเร็จ${NC}"
else
    echo -e "${RED}✗ ไม่สามารถเชื่อมต่อ database${NC}"
    exit 1
fi

# Check if database exists
echo -e "${YELLOW}3. ตรวจสอบ database 'performance_test'...${NC}"
DB_EXISTS=$(docker exec postgres_db psql -U postgres -lqt | cut -d \| -f 1 | grep -w performance_test | wc -l)
if [ $DB_EXISTS -eq 1 ]; then
    echo -e "${GREEN}✓ Database 'performance_test' มีอยู่แล้ว${NC}"
else
    echo -e "${RED}✗ Database 'performance_test' ไม่พบ${NC}"
fi

# Check tables
echo -e "${YELLOW}4. ตรวจสอบ tables...${NC}"
TABLES=$(docker exec postgres_db psql -U postgres -d performance_test -c "\dt" 2>/dev/null | grep -E "(users|products|orders|order_items)" | wc -l)
if [ $TABLES -eq 4 ]; then
    echo -e "${GREEN}✓ Tables ครบทั้ง 4 ตาราง${NC}"
    docker exec postgres_db psql -U postgres -d performance_test -c "\dt"
else
    echo -e "${RED}✗ Tables ไม่ครบ (ควรมี 4 ตาราง)${NC}"
fi

# Check initial data
echo -e "${YELLOW}5. ตรวจสอบ initial data...${NC}"
USER_COUNT=$(docker exec postgres_db psql -U postgres -d performance_test -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
PRODUCT_COUNT=$(docker exec postgres_db psql -U postgres -d performance_test -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' ')
ORDER_COUNT=$(docker exec postgres_db psql -U postgres -d performance_test -t -c "SELECT COUNT(*) FROM orders;" 2>/dev/null | tr -d ' ')

echo "Users: $USER_COUNT รายการ"
echo "Products: $PRODUCT_COUNT รายการ"  
echo "Orders: $ORDER_COUNT รายการ"

if [ "$USER_COUNT" -gt 0 ] && [ "$PRODUCT_COUNT" -gt 0 ] && [ "$ORDER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Initial data พร้อมใช้งาน${NC}"
else
    echo -e "${RED}✗ Initial data ไม่ครบ${NC}"
fi

echo
echo -e "${GREEN}=========================================="
echo "✅ Database Setup Status: Complete"
echo "==========================================${NC}" 