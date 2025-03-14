import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Restaurant } from './restaurant.schema';

// Schema for menu categories
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
export class MenuCategory {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  })
  restaurant: Restaurant;
}

export type MenuCategoryDocument = MenuCategory & Document;
export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);
export const MENU_CATEGORY_MODEL = MenuCategory.name;

MenuCategorySchema.index({ name: 1, restaurant: 1 }, { unique: true });
