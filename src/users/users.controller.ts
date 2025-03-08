// users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
  Param,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.getUserById(req.user.userId);
  }

  @Patch(':id/approve')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateApproval(
    @Param('id') id: string,
    @Body() updateApprovalDto: UpdateApprovalDto,
  ) {
    return this.usersService.updateApprovalStatus(
      id,
      updateApprovalDto.isApproved,
    );
  }
}
