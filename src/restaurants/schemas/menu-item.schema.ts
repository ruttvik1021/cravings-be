import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Restaurant } from './restaurant.schema';
import { MenuCategory } from './menu-category.schema';

// Schema for menu categories
// Schema for individual menu items
@Schema({
  timestamps: true,
  toJSON: {
    transform: function (_, ret) {
      // Exclude fields when converting the document to JSON
      delete ret.createdAt;
      delete ret.updatedAt;
      delete ret.__v;
    },
  },
})
export class MenuItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  image: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: true,
  })
  category: MenuCategory;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  })
  restaurant: Restaurant;

  @Prop({ default: false })
  isAvailable: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isVegeterian: boolean;
}

export type MenuItemDocument = MenuItem & Document;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
export const MENU_ITEM_MODEL = MenuItem.name;
