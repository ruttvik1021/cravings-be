import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateRestaurantDto } from 'src/restaurants/dto/create-restaurant.dto';
import { UserRoles } from 'src/users/schemas/user.schema';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  // @UseGuards(JwtAuthGuard)
  async restaurantList() {
    return this.restaurantsService.getAllRestaurants();
  }

  @Get('setup/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.RESTAURANT_OWNER)
  async getSetupDetials(@Req() req: decodedRequest) {
    return this.restaurantsService.getRestaurantDetails(req);
  }

  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  async restaurantDetials(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantByIdForUser(id);
  }

  @Post('setup/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseInterceptors(AnyFilesInterceptor())
  async createRestaurant(
    @UploadedFiles() files: Express.Multer.File[], // Catch all files
    @Body() createRestaurantDto: CreateRestaurantDto,
    @Req() req: decodedRequest,
  ) {
    const logo = files.find((file) => file.fieldname === 'logo'); // Extract logo
    const images = files.filter((file) => file.fieldname === 'images'); // Extract images
    return this.restaurantsService.createRestaurant(
      createRestaurantDto,
      logo,
      images,
      req,
    );
  }

  @Put('setup/details/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async updateRestaurant(
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    }, // Catch all files
    @Body() createRestaurantDto: CreateRestaurantDto,
    @Param('id') id: string,
    @Req() req: decodedRequest,
  ) {
    const logo = files.logo ? files.logo[0] : null; // Extract logo
    const images = files.images ? files.images : null; // Extract images
    return this.restaurantsService.updateRestaurant(
      createRestaurantDto,
      logo,
      images,
      id,
      req,
    );
  }

  // **Admin Approval for Users**
  @Patch(':id/approve')
  @Roles(UserRoles.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateApproval(@Param('id') id: string) {
    return this.restaurantsService.updateApprovalStatus(id);
  }

  @Patch(':id/reject')
  @Roles(UserRoles.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async rejectRequest(@Param('id') id: string) {
    return this.restaurantsService.rejectRestaurant(id);
  }

  @Get('restaurant_owners')
  @Roles(UserRoles.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async restaurantOwners(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.restaurantsService.getRestaurantOwners(page, limit);
  }

  @Get('restaurant_owners/requests')
  @Roles(UserRoles.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async restaurantOwnersRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.restaurantsService.getRestaurantOwnersRequests(page, limit);
  }

  @Get('admin/profile')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard)
  async getRestaurantOwnerProfile(@Req() req: decodedRequest) {
    return this.restaurantsService.getOwnerProfile(req);
  }
}
