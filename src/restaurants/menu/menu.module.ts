import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { RolesGuard } from 'src/auth/roles.guard';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { MenuController } from './menu.controller';
import { RestaurantsModule } from '../restaurants.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MenuCategory,
  MenuCategorySchema,
} from '../schemas/menu-category.schema';
import { MenuItem, MenuItemSchema } from '../schemas/menu-item.schema';
import { RestaurantsService } from '../restaurants.service';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Restaurant, RestaurantSchema } from '../schemas/restaurant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuCategory.name, schema: MenuCategorySchema },
    ]),
    MongooseModule.forFeature([
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [MenuController],
  providers: [MenuService, RestaurantsService, JwtStrategy, RolesGuard],
})
export class MenuModule {}
