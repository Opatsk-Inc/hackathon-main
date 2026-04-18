import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { JwtPayload } from './jwt-payload';
import { LoginRequest, SignupRequest } from './models';
import type { AuthUser } from './auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupRequest: SignupRequest): Promise<string> {
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: signupRequest.email.toLowerCase(),
          passwordHash: await bcrypt.hash(signupRequest.password, 10),
          firstName: signupRequest.firstName ?? '',
          lastName: signupRequest.lastName ?? '',
          role: signupRequest.role,
          warehouseId: signupRequest.warehouseId ?? null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          warehouseId: true,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Email already in use');
        } else throw e;
      } else throw e;
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
    };

    return this.jwtService.signAsync(payload);
  }

  async login(loginRequest: LoginRequest): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginRequest.email.toLowerCase(),
      },
      select: {
        id: true,
        passwordHash: true,
        email: true,
        role: true,
        warehouseId: true,
      },
    });

    if (
      user === null ||
      !bcrypt.compareSync(loginRequest.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
    };

    return this.jwtService.signAsync(payload);
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (user !== null && user.email === payload.email) {
      return user;
    }
    throw new UnauthorizedException();
  }
}
