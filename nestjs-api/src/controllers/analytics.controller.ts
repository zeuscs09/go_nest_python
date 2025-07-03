import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';

@Controller('api/v1')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('orders-with-users')
  async getOrdersWithUsers(@Query('limit') limit: string = '10', @Query('offset') offset: string = '0') {
    return this.analyticsService.getOrdersWithUsers(parseInt(limit), parseInt(offset));
  }

  @Get('user-order-summary')
  async getUserOrderSummary(@Query('limit') limit: string = '10', @Query('offset') offset: string = '0') {
    return this.analyticsService.getUserOrderSummary(parseInt(limit), parseInt(offset));
  }

  @Get('analytics')
  async getComplexAnalytics() {
    return this.analyticsService.getComplexAnalytics();
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      service: 'nestjs-api',
    };
  }
} 