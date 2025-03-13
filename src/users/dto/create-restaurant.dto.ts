import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RestaurantType, FoodCategory } from '../schemas/restaurant.schema';

export class CreateRestaurantDto {
  @IsNotEmpty()
  @IsString()
  restaurantName: string;

  @IsNotEmpty()
  @IsEnum(RestaurantType)
  restaurantType: RestaurantType;

  @IsNotEmpty()
  @IsEnum(FoodCategory)
  foodCategory: FoodCategory;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsOptional()
  @IsString()
  branchNumber?: string;

  @IsNotEmpty()
  @IsString()
  openingTime: string;

  @IsNotEmpty()
  @IsString()
  closingTime: string;
}
