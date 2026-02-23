import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Create a new user. Hashes password before saving.
   * Throws ConflictException if email already exists.
   */
  async create(name: string, email: string, password: string): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = new this.userModel({ name, email, password: hashed });
    return user.save();
  }

  /**
   * Find user by email, explicitly selecting the password field
   * (it's excluded by default in the schema with `select: false`).
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}