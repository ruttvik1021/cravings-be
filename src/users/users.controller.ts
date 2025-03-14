import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from './users.service';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // **User Registration (Form Data Only)**
  @Post('register/user')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // **Restaurant Owner Registration (With Profile Photo & ID Card)**
  @Post('register/restaurant')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePhoto', maxCount: 1 },
      { name: 'idCard', maxCount: 1 },
    ]),
  )
  async registerRestaurantOwner(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      idCard?: Express.Multer.File[];
    },
  ) {
    const profilePhoto = files.profilePhoto ? files.profilePhoto[0] : null;
    const idCard = files.idCard ? files.idCard[0] : null;
    return this.usersService.createRestaurantOwner(
      createUserDto,
      profilePhoto,
      idCard,
    );
  }

  // **Delivery Agent Registration (With ID Card)**
  @Post('register/delivery')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'idCard', maxCount: 1 }]))
  async registerDeliveryAgent(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      idCard?: Express.Multer.File[];
    },
  ) {
    const profilePhoto = files.profilePhoto ? files.profilePhoto[0] : null;
    const idCard = files.idCard ? files.idCard[0] : null;
    return this.usersService.createDeliveryAgent(
      createUserDto,
      profilePhoto,
      idCard,
    );
  }

  // **Login Route (Common for All)**
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  // **Profile Route**
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: decodedRequest) {
    return this.usersService.getUserById(req.user._id);
  }

  @Get('delivery_agents')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deliveryAgents() {
    return this.usersService.getDeliveryAgents();
  }

  @Get('delivery_agents/requests')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deliveryAgentsRequests() {
    return this.usersService.getDeliveryAgentsRequests();
  }
}
