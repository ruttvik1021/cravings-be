import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/roles.guard';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from './users.service';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // **User Registration (Form Data Only)**
  @Post('register/user')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePhoto', maxCount: 1 }]),
  )
  async registerUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
    },
  ) {
    const profilePhoto = files.profilePhoto ? files.profilePhoto[0] : null;
    return this.usersService.createUser(createUserDto, profilePhoto);
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

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePhoto', maxCount: 1 }]),
  )
  async updateProfilePhoto(
    @Body() body: { name: string },
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File;
    },
    @Request() req: decodedRequest,
  ) {
    return this.usersService.updateUserProfilePhoto(
      body.name,
      req,
      files.profilePhoto?.[0],
    );
  }

  @Get('delivery_agents')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deliveryAgents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.usersService.getDeliveryAgents(page, limit);
  }

  @Get('delivery_agents/requests')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deliveryAgentsRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.usersService.getDeliveryAgentsRequests(page, limit);
  }
}
