import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRoles {
  USER = 'user',
  RESTAURANT_OWNER = 'restaurant_owner',
  DELIVERY_AGENT = 'delivery_agent',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    required: true,
    enum: UserRoles,
    default: UserRoles.USER,
  })
  role: UserRoles;

  @Prop()
  profilePhoto: string;

  @Prop()
  idPhoto: string;

  @Prop({ default: false })
  isApproved: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
