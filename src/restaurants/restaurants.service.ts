import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRoles } from 'src/users/schemas/user.schema';

@Injectable()
export class RestaurantsService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async updateApprovalStatus(id: string): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { _id: id, isApproved: false },
      { isApproved: true },
      { new: true },
    );
  }

  async rejectRestaurant(id: string): Promise<User> {
    return this.userModel.findOneAndDelete({ _id: id, isApproved: false });
  }

  async getRestaurantOwners() {
    return this.userModel.find({
      role: UserRoles.RESTAURANT_OWNER,
      isApproved: true,
    });
  }

  async getRestaurantOwnersRequests() {
    return this.userModel.find({
      role: UserRoles.RESTAURANT_OWNER,
      isApproved: false,
    });
  }
}
