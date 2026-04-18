import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { Usr } from './user.decorator';
import { UpdateUserRequest, UserResponse } from './models';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile (own profile only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({ type: UpdateUserRequest })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponse })
  @ApiResponse({ status: 401, description: 'Cannot update another user\'s profile' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequest: UpdateUserRequest,
    @Usr() user: AuthUser,
  ): Promise<UserResponse> {
    if (id !== user.id) {
      throw new UnauthorizedException();
    }
    return this.userService.updateUser(id, updateRequest);
  }
}
