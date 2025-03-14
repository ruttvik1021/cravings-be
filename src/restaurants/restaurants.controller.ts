import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateRestaurantDto } from 'src/restaurants/dto/create-restaurant.dto';
import { UserRoles } from 'src/users/schemas/user.schema';
import { RestaurantsService } from './restaurants.service';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post('setup')
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

  @Get('setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.RESTAURANT_OWNER)
  async getSetupDetials(@Req() req: decodedRequest) {
    return this.restaurantsService.getRestaurantDetails(req);
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
  async restaurantOwners() {
    return this.restaurantsService.getRestaurantOwners();
  }

  @Get('restaurant_owners/requests')
  @Roles(UserRoles.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async restaurantOwnersRequests() {
    return this.restaurantsService.getRestaurantOwnersRequests();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async restaurantDetials(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantById(id);
  }
}
