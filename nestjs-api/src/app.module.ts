import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { UserService } from './services/user.service';
import { AnalyticsService } from './services/analytics.service';
import { User } from './models/user.entity';
import { Product } from './models/product.entity';
import { Order } from './models/order.entity';
import { OrderItem } from './models/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'performance_test',
      entities: [User, Product, Order, OrderItem],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([User, Product, Order, OrderItem]),
  ],
  controllers: [UserController, AnalyticsController],
  providers: [UserService, AnalyticsService],
})
export class AppModule {} 