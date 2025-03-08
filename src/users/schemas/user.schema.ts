import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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
    enum: ['user', 'restaurant_owner', 'delivery_agent', 'admin'],
    default: 'user',
  })
  role: string;

  @Prop()
  profilePhoto: string;

  @Prop()
  idPhoto: string;

  @Prop({ default: false })
  isApproved: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
