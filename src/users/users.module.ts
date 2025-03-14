// users/users.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import {
  Restaurant,
  RestaurantSchema,
} from 'src/restaurants/schemas/restaurant.schema';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
  providers: [UsersService, JwtStrategy, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
