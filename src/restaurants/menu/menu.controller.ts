// menu.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RestaurantOwnerGuard } from 'src/auth/restaurant-owner.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateCategoryDto } from 'src/restaurants/dto/create-category.dto';
import { UserRoles } from 'src/users/schemas/user.schema';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('category')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: decodedRequest,
  ) {
    return this.menuService.createCategory(createCategoryDto, req);
  }

  @Get('categories')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  async getCategories(@Req() req: decodedRequest) {
    return this.menuService.getCategories(req);
  }

  @Put('category/:id')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    return this.menuService.updateCategory(categoryId, updateCategoryDto);
  }

  @Delete('category/:id')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  async deleteCategory(@Param('id') categoryId: string) {
    return this.menuService.deleteCategory(categoryId);
  }
}
