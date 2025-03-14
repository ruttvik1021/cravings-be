import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  Restaurant,
  RestaurantSchema,
} from 'src/restaurants/schemas/restaurant.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, JwtStrategy, RolesGuard],
})
export class RestaurantsModule {}
