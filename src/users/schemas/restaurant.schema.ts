import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RestaurantType {
  FAST_FOOD = 'fast-food',
  CASUAL_DINING = 'casual-dining',
  FINE_DINING = 'fine-dining',
  CAFE = 'cafe',
  FOOD_TRUCK = 'food-truck',
}

export enum FoodCategory {
  AMERICAN = 'american',
  ITALIAN = 'italian',
  CHINESE = 'chinese',
  INDIAN = 'indian',
  MEXICAN = 'mexican',
  JAPANESE = 'japanese',
  THAI = 'thai',
  MEDITERRANEAN = 'mediterranean',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (_, ret) {
      delete ret.createdAt;
      delete ret.updatedAt;
      delete ret.__v;
    },
  },
})
export class Restaurant {
  @Prop({ required: true })
  restaurantName: string;

  @Prop({ required: true, enum: RestaurantType })
  restaurantType: RestaurantType;

  @Prop({ required: true, enum: FoodCategory })
  foodCategory: FoodCategory;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  pincode: string;

  @Prop()
  branchNumber: string;

  @Prop({ required: true })
  logo: string; // URL to the uploaded logo

  @Prop({ type: [String], default: [] })
  images: string[]; // Array of URLs to the uploaded images

  @Prop({ required: true })
  openingTime: string;

  @Prop({ required: true })
  closingTime: string;

  @Prop({ required: true, ref: 'User' }) // Reference to the User who owns the restaurant
  owner: string;

  @Prop({ default: false })
  isApproved: boolean; // Admin approval status
}

export type RestaurantDocument = Restaurant & Document;
export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
export const RESTAURANT_MODEL = Restaurant.name;
