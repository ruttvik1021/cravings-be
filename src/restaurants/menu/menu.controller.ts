// menu.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RestaurantOwnerGuard } from 'src/auth/restaurant-owner.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateCategoryDto } from 'src/restaurants/dto/create-category.dto';
import { UserRoles } from 'src/users/schemas/user.schema';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('item')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  createMenuItem(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: decodedRequest,
  ) {
    return this.menuService.createMenuItem(createMenuItemDto, file, req);
  }

  @Get('items')
  getMenuItems(@Req() req: decodedRequest) {
    return this.menuService.getMenuItems(req);
  }

  @Get('/item/:id')
  getMenuItem(@Param('id') id: string, @Req() req: decodedRequest) {
    return this.menuService.getMenuItemById(id, req);
  }

  @Put('/item/:id')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  updateMenuItem(
    @Param('id') id: string,
    @Body() updateMenuItemDto: CreateMenuItemDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: decodedRequest,
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto, file, req);
  }

  @Delete('/item/:id')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  deleteMenuItem(@Param('id') id: string, @Req() req: decodedRequest) {
    return this.menuService.deleteMenuItem(id, req);
  }

  @Put('/item/available/:id')
  @Roles(UserRoles.RESTAURANT_OWNER)
  @UseGuards(JwtAuthGuard, RolesGuard, RestaurantOwnerGuard)
  async toggleAvailability(
    @Param('id') id: string,
    @Body() body: { isAvailable: boolean },
  ) {
    return this.menuService.toggleAvailability(id, body.isAvailable);
  }
}
