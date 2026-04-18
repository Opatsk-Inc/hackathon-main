import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Usr } from '../user/user.decorator';
import { LoginRequest, LoginResponse, SignupRequest } from './models';
import { UserResponse } from '../user/models';
import type { AuthUser } from './auth-user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and receive a JWT token' })
  @ApiBody({ type: SignupRequest })
  @ApiResponse({ status: 201, description: 'User created, JWT token returned', type: LoginResponse })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async signup(@Body() signupRequest: SignupRequest): Promise<LoginResponse> {
    return new LoginResponse(await this.authService.signup(signupRequest));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginRequest })
  @ApiResponse({ status: 200, description: 'JWT token returned', type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    return new LoginResponse(await this.authService.login(loginRequest));
  }

  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned', type: UserResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  async getMe(@Usr() user: AuthUser): Promise<UserResponse> {
    return UserResponse.fromUserEntity(user);
  }
}
