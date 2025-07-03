import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../models/order.entity';
import { Product } from '../models/product.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getOrdersWithUsers(limit: number = 10, offset: number = 0) {
    return this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.user', 'u')
      .leftJoin('o.orderItems', 'oi')
      .select('o.id', 'order_id')
      .addSelect('o.user_id', 'user_id')
      .addSelect('u.name', 'user_name')
      .addSelect('u.email', 'user_email')
      .addSelect('u.city', 'user_city')
      .addSelect('o.total_amount', 'total_amount')
      .addSelect('o.status', 'status')
      .addSelect('o.order_date', 'order_date')
      .addSelect('COUNT(oi.id)', 'item_count')
      .groupBy('o.id')
      .addGroupBy('o.user_id')
      .addGroupBy('u.name')
      .addGroupBy('u.email')
      .addGroupBy('u.city')
      .addGroupBy('o.total_amount')
      .addGroupBy('o.status')
      .addGroupBy('o.order_date')
      .orderBy('o.id', 'ASC')
      .limit(limit)
      .offset(offset)
      .getRawMany();
  }

  async getUserOrderSummary(limit: number = 10, offset: number = 0) {
    return this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.user', 'u')
      .select('u.id', 'user_id')
      .addSelect('u.name', 'user_name')
      .addSelect('u.email', 'user_email')
      .addSelect('COUNT(o.id)', 'total_orders')
      .addSelect('COALESCE(SUM(o.total_amount), 0)', 'total_amount')
      .addSelect('COALESCE(AVG(o.total_amount), 0)', 'average_order')
      .addSelect('COALESCE(MAX(o.order_date), \'1970-01-01\')', 'last_order')
      .groupBy('u.id')
      .addGroupBy('u.name')
      .addGroupBy('u.email')
      .orderBy('total_amount', 'DESC')
      .limit(limit)
      .offset(offset)
      .getRawMany();
  }

  async getComplexAnalytics() {
    return this.productRepository.createQueryBuilder('p')
      .leftJoin('p.orderItems', 'oi')
      .leftJoin('oi.order', 'o')
      .leftJoin('o.user', 'u')
      .select('p.category', 'category')
      .addSelect('COUNT(DISTINCT o.id)', 'total_orders')
      .addSelect('SUM(oi.quantity)', 'total_quantity')
      .addSelect('SUM(oi.price * oi.quantity)', 'total_revenue')
      .addSelect('AVG(oi.price)', 'avg_price')
      .addSelect('COUNT(DISTINCT u.id)', 'unique_customers')
      .addSelect('AVG(u.age)', 'avg_customer_age')
      .where('o.status = :status', { status: 'completed' })
      .groupBy('p.category')
      .orderBy('total_revenue', 'DESC')
      .getRawMany();
  }
} 