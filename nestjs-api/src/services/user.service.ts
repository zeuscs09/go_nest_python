import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto, UpdateUserDto } from '../models/dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    return this.userRepository.find({
      take: limit,
      skip: offset,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  // Complex queries
  async getUserOrderSummary(limit: number = 10, offset: number = 0) {
    return this.userRepository.createQueryBuilder('u')
      .leftJoin('u.orders', 'o')
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
} 