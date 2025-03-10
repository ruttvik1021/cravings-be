import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Patch,
  Param,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdateApprovalDto } from 'src/users/dto/update-approval.dto';
import { RestaurantsService } from './restaurants.service';
import { UserRoles } from 'src/users/schemas/user.schema';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}
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
}
