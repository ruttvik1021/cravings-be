import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateRestaurantDto } from 'src/restaurants/dto/create-restaurant.dto';
import {
  Restaurant,
  RestaurantDocument,
} from 'src/restaurants/schemas/restaurant.schema';
import { User, UserDocument, UserRoles } from 'src/users/schemas/user.schema';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateApprovalStatus(id: string): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { _id: id, isApproved: false },
      { isApproved: true },
      { new: true },
    );
  }

  async rejectRestaurant(id: string): Promise<UserDocument> {
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
  // Create a new restaurant
  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
    logo: Express.Multer.File,
    images: Express.Multer.File[],
    req: decodedRequest,
  ): Promise<Restaurant> {
    const ownerId = req.user?._id;

    if (!ownerId) {
      throw new BadRequestException('UserId not found.');
    }
    const existingRestaurant = await this.getRestaurantsByOwner(ownerId);
    if (existingRestaurant) {
      throw new BadRequestException('You already own a restaurant.');
    }
    const logoUrl = await this.cloudinaryService.uploadImage(
      logo,
      `restaurants/${ownerId}/logo`,
    );

    const imageUrls = await Promise.all(
      images.map((image, index) =>
        this.cloudinaryService.uploadImage(
          image,
          `restaurants/${ownerId}/images/${index}`,
        ),
      ),
    );

    // Create the restaurant
    const restaurant = new this.restaurantModel({
      ...createRestaurantDto,
      logo: logoUrl,
      images: imageUrls,
      owner: ownerId,
    });

    return restaurant.save();
  }

  async updateRestaurant(
    updateRestaurantDto: CreateRestaurantDto, // Can be a separate DTO if needed
    logo: Express.Multer.File | undefined, // Optional logo
    images: Express.Multer.File[] | undefined, // Optional images
    restaurantId: string,
    req: decodedRequest, // Get the user ID from request
  ): Promise<Restaurant> {
    const ownerId = req.user?._id;
    if (!ownerId) {
      throw new BadRequestException('UserId not found.');
    }

    const existingRestaurant =
      await this.restaurantModel.findById(restaurantId);
    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found.');
    }

    if (existingRestaurant.owner.toString() !== ownerId.toString()) {
      throw new ForbiddenException('You can only update your own restaurant.');
    }

    // Upload new logo if provided
    let logoUrl = existingRestaurant.logo;
    if (logo) {
      logoUrl = await this.cloudinaryService.uploadImage(
        logo,
        `restaurants/${ownerId}/logo`,
      );
    }

    // Upload new images if provided, otherwise retain existing ones
    let imageUrls = existingRestaurant.images;
    if (images && images.length > 0) {
      imageUrls = await Promise.all(
        images.map((image, index) =>
          this.cloudinaryService.uploadImage(
            image,
            `restaurants/${ownerId}/images/${index}`,
          ),
        ),
      );
    }

    // Update restaurant details
    const updatedRestaurant = await this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      {
        ...updateRestaurantDto,
        logo: logoUrl,
        images: imageUrls,
      },
      { new: true, runValidators: true },
    );

    return updatedRestaurant;
  }

  async getRestaurantDetails(req: decodedRequest) {
    const restaurantId = req.user?.restaurantId;
    return await this.getRestaurantById(restaurantId);
  }

  // Get a restaurant by ID
  async getRestaurantById(id: string): Promise<RestaurantDocument> {
    const restaurant = await this.restaurantModel.findById(id);
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found.');
    }
    return restaurant;
  }

  // Get restaurants by owner ID
  async getRestaurantsByOwner(ownerId: string): Promise<RestaurantDocument> {
    const resto = await this.restaurantModel.findOne({
      owner: new mongoose.Types.ObjectId(ownerId),
    });
    return resto;
  }

  // Delete a restaurant
  async deleteRestaurant(id: string): Promise<void> {
    const restaurant = await this.restaurantModel.findByIdAndDelete(id);
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found.');
    }
  }
}
