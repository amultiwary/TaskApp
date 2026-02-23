import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user and return an access token immediately
   * so the frontend doesn't need a separate login step.
   */
  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto.name, dto.email, dto.password);
    return this.buildTokenResponse(user);
  }

  /**
   * Validate credentials and return a JWT access token.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildTokenResponse(user);
  }

  /**
   * Signs a JWT and returns the token alongside user info.
   */
  private buildTokenResponse(user: any) {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }
}