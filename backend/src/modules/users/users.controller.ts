import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Identity')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get profile of current authenticated user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.usersService.getMe(userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update profile and preferences of current user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('internal/auth0/user-created')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Internal webhook for Auth0 Post-User-Registration Action (ADR-003 Option C)' })
  @ApiHeader({ name: 'x-auth0-webhook-secret', required: true, description: 'Internal shared webhook secret' })
  async handleAuth0UserCreated(
    @Headers('x-auth0-webhook-secret') secret: string,
    @Body() payload: { sub: string; email?: string; name?: string; picture?: string },
  ) {
    const expectedSecret = this.configService.get<string>('AUTH0_WEBHOOK_SECRET');
    if (!secret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing Auth0 webhook secret');
    }

    const user = await this.usersService.resolveFromAuth0({
      iss: this.configService.get<string>('AUTH0_ISSUER', ''),
      sub: payload.sub,
      aud: this.configService.get<string>('AUTH0_AUDIENCE', ''),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });

    return {
      success: true,
      message: 'User provisioned successfully',
      userId: user.id,
    };
  }
}
