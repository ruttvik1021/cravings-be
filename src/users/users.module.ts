// users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import {
  Restaurant,
  RestaurantSchema,
} from 'src/restaurants/schemas/restaurant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    CloudinaryModule,
    RestaurantsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, RestaurantsService, JwtStrategy, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
