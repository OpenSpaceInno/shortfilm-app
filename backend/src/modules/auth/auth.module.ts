import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ResourceOwnershipGuard } from './guards/resource-ownership.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    ResourceOwnershipGuard,
  ],
  exports: [
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    ResourceOwnershipGuard,
  ],
})
export class AuthModule {}
