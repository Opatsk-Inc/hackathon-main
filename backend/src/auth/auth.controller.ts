import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Usr } from '../user/user.decorator';
import { LoginRequest, LoginResponse, SignupRequest } from './models';
import type { AuthUser } from './auth-user';

class HromadaProfileResponse {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() koatuu: string;
  @ApiProperty() region: string;
  @ApiProperty() district: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an account for a hromada and receive a JWT token' })
  @ApiBody({ type: SignupRequest })
  @ApiResponse({ status: 201, type: LoginResponse })
  @ApiResponse({ status: 404, description: 'Hromada not found' })
  @ApiResponse({ status: 409, description: 'Account already exists or email taken' })
  async signup(@Body() signupRequest: SignupRequest): Promise<LoginResponse> {
    return new LoginResponse(await this.authService.signup(signupRequest));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginRequest })
  @ApiResponse({ status: 200, type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    return new LoginResponse(await this.authService.login(loginRequest));
  }

  @Get('inspector/magic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate inspector via magic link token' })
  @ApiQuery({ name: 'token', required: true, description: 'Inspector magic token' })
  @ApiResponse({ status: 200, schema: { example: { accessToken: 'jwt...', inspector: { id: 'uuid', name: 'Іван', phone: '+380...' } } } })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async inspectorMagicLink(@Query('token') token: string) {
    return this.authService.loginWithMagicLink(token);
  }

  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: 'Get current hromada profile' })
  @ApiResponse({ status: 200, type: HromadaProfileResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Usr() user: AuthUser): HromadaProfileResponse {
    if (user.type !== 'hromada') throw new Error('Not a hromada user');
    return {
      id: user.id,
      email: user.email!,
      name: user.name,
      koatuu: user.koatuu,
      region: user.region,
      district: user.district,
    };
  }
}
