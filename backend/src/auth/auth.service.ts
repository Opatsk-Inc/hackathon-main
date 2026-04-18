import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload';
import { LoginRequest, SignupRequest } from './models';
import type { AuthUser, HromadaUser, InspectorUser } from './auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupRequest: SignupRequest): Promise<string> {
    const hromada = await this.prisma.hromada.findUnique({
      where: { id: signupRequest.hromadaId },
    });

    if (!hromada) throw new NotFoundException('Hromada not found');
    if (hromada.email) throw new ConflictException('This hromada already has an account');

    const emailTaken = await this.prisma.hromada.findUnique({
      where: { email: signupRequest.email.toLowerCase() },
    });
    if (emailTaken) throw new ConflictException('Email already in use');

    const updated = await this.prisma.hromada.update({
      where: { id: signupRequest.hromadaId },
      data: {
        email: signupRequest.email.toLowerCase(),
        passwordHash: await bcrypt.hash(signupRequest.password, 10),
      },
    });

    const payload: JwtPayload = { id: updated.id, email: updated.email!, type: 'hromada' };
    return this.jwtService.signAsync(payload);
  }

  async login(loginRequest: LoginRequest): Promise<string> {
    const hromada = await this.prisma.hromada.findUnique({
      where: { email: loginRequest.email.toLowerCase() },
    });

    if (!hromada?.passwordHash || !bcrypt.compareSync(loginRequest.password, hromada.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { id: hromada.id, email: hromada.email!, type: 'hromada' };
    return this.jwtService.signAsync(payload);
  }

  async loginWithMagicLink(token: string): Promise<{ accessToken: string; inspector: { id: string; name: string; phone: string } }> {
    const inspector = await this.prisma.inspector.findUnique({
      where: { magicToken: token },
    });
    if (!inspector) throw new UnauthorizedException('Невірне або прострочене посилання');

    const payload: JwtPayload = { id: inspector.id, type: 'inspector' };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, inspector: { id: inspector.id, name: inspector.name, phone: inspector.phone } };
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type === 'inspector') {
      const inspector = await this.prisma.inspector.findUnique({ where: { id: payload.id } });
      if (!inspector) throw new UnauthorizedException();
      return { ...inspector, type: 'inspector' } as InspectorUser;
    }

    const hromada = await this.prisma.hromada.findUnique({ where: { id: payload.id } });
    if (hromada?.email === payload.email) return { ...hromada, type: 'hromada' } as HromadaUser;
    throw new UnauthorizedException();
  }
}
