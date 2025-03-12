import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRoles {
  USER = 'user',
  RESTAURANT_OWNER = 'restaurant_owner',
  DELIVERY_AGENT = 'delivery_agent',
  ADMIN = 'admin',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (_, ret) {
      console.log('ret', ret);
      // Exclude fields when converting the document to JSON
      delete ret.createdAt;
      delete ret.updatedAt;
      delete ret.__v;
      delete ret.password;
    },
  },
})
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

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
export const USER_MODEL = User.name;
