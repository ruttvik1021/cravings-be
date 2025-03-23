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
import { getPaginationLimits } from 'src/utils';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateApprovalStatus(id: string): Promise<User> {
    return this.userModel
      .findOneAndUpdate(
        { _id: id, isApproved: false },
        { isApproved: true },
        { new: true },
      )
      .lean()
      .exec();
  }

  async rejectRestaurant(id: string): Promise<UserDocument> {
    return this.userModel
      .findOneAndDelete({ _id: id, isApproved: false })
      .lean()
      .exec();
  }

  async getRestaurantOwners(page: string, limit: string) {
    const { skip, limit: limitCount } = getPaginationLimits(page, limit);
    return this.userModel
      .find({
        role: UserRoles.RESTAURANT_OWNER,
        isApproved: true,
      })
      .limit(limitCount)
      .skip(skip)
      .lean()
      .exec();
  }

  async getRestaurantOwnersRequests(page: string, limit: string) {
    const { skip, limit: limitCount } = getPaginationLimits(page, limit);
    return this.userModel
      .find({
        role: UserRoles.RESTAURANT_OWNER,
        isApproved: false,
      })
      .limit(limitCount)
      .skip(skip)
      .lean()
      .exec();
  }

  async getOwnerProfile(req: decodedRequest) {
    const ownerId = req.user._id;
    return this.userModel
      .findById(ownerId)
      .select('-updatedAt, -createdAt, -_v')
      .lean()
      .exec();
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

    // Check if owner already has a restaurant - using lean for memory efficiency
    const existingRestaurant = await this.restaurantModel
      .findOne({
        owner: new mongoose.Types.ObjectId(ownerId),
      })
      .lean()
      .exec();

    if (existingRestaurant) {
      throw new BadRequestException('You already own a restaurant.');
    }

    // Upload logo and images in parallel
    const [logoUrl, imageUrls] = await Promise.all([
      this.cloudinaryService.uploadImage(logo, `restaurants/${ownerId}/logo`),

      // Process images in smaller batches to prevent memory issues
      this.processImagesInBatches(images, ownerId, 3),
    ]);

    // Create the restaurant
    const restaurant = new this.restaurantModel({
      ...createRestaurantDto,
      logo: logoUrl,
      images: imageUrls,
      owner: ownerId,
    });

    return restaurant.save();
  }

  // Helper method to process images in batches
  private async processImagesInBatches(
    images: Express.Multer.File[],
    ownerId: string,
    batchSize: number,
  ): Promise<string[]> {
    const imageUrls: string[] = [];

    // Process images in batches
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchUrls = await Promise.all(
        batch.map((image, index) =>
          this.cloudinaryService.uploadImage(
            image,
            `restaurants/${ownerId}/images/${i + index}`,
          ),
        ),
      );
      imageUrls.push(...batchUrls);
    }

    return imageUrls;
  }

  async updateRestaurant(
    updateRestaurantDto: CreateRestaurantDto,
    logo: Express.Multer.File | undefined,
    images: Express.Multer.File[] | undefined,
    restaurantId: string,
    req: decodedRequest,
  ): Promise<Restaurant> {
    const ownerId = req.user?._id;
    if (!ownerId) {
      throw new BadRequestException('UserId not found.');
    }

    // Use lean() for memory efficiency when just checking data
    const existingRestaurant = await this.restaurantModel
      .findById(restaurantId)
      .lean()
      .exec();
    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant not found.');
    }

    if (existingRestaurant.owner.toString() !== ownerId.toString()) {
      throw new ForbiddenException('You can only update your own restaurant.');
    }

    // Prepare update operations
    const updateData: any = { ...updateRestaurantDto };

    // Process media uploads only if provided
    if (logo || (images && images.length > 0)) {
      const uploadPromises = [];

      // Initialize with existing values
      let logoUrl = existingRestaurant.logo;
      let imageUrls = existingRestaurant.images;

      // Only upload new logo if provided
      if (logo) {
        uploadPromises.push(
          this.cloudinaryService
            .uploadImage(logo, `restaurants/${ownerId}/logo`)
            .then((url) => {
              logoUrl = url;
            }),
        );
      }

      // Only upload new images if provided
      if (images && images.length > 0) {
        uploadPromises.push(
          this.processImagesInBatches(images, ownerId, 3).then((urls) => {
            imageUrls = urls;
          }),
        );
      }

      // Wait for all uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // Set the media URLs in the update data
      updateData.logo = logoUrl;
      updateData.images = imageUrls;
    }

    // Update restaurant with all changes at once
    return this.restaurantModel
      .findByIdAndUpdate(restaurantId, updateData, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();
  }

  async getAllRestaurants() {
    return await this.restaurantModel
      .find()
      // .select('-__v, -createdAt, -updatedAt')
      .lean()
      .exec();
  }

  async getRestaurantDetails(req: decodedRequest) {
    const restaurantId = req.user?.restaurantId;
    return this.getRestaurantById(restaurantId);
  }

  async getRestaurantByIdForUser(id: string) {
    const restaurant = await this.restaurantModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }, // Match the restaurant by ID
      },

      // Lookup categories related to this restaurant
      {
        $lookup: {
          from: 'menucategories',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'categories',
        },
      },

      // Lookup menu items related to this restaurant
      {
        $lookup: {
          from: 'menuitems',
          let: { restaurantId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$restaurant', '$$restaurantId'] },
                isAvailable: true,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                description: 1,
                price: 1,
                image: 1,
                category: 1,
              },
            },
          ],
          as: 'menuItems',
        },
      },

      // Attach menu items to their respective categories
      {
        $addFields: {
          categories: {
            $map: {
              input: '$categories',
              as: 'category',
              in: {
                _id: '$$category._id',
                categoryName: '$$category.name',
                categoryDescription: '$$category.description',
                menuItems: {
                  $filter: {
                    input: '$menuItems',
                    as: 'menuItem',
                    cond: { $eq: ['$$menuItem.category', '$$category._id'] },
                  },
                },
              },
            },
          },
        },
      },

      // Optionally remove menuItems from the top level
      {
        $project: {
          menuItems: 0, // Remove separate menuItems array if not needed
        },
      },
    ]);

    if (!restaurant.length) {
      throw new BadRequestException('Restaurant not found.');
    }
    return restaurant[0];
  }

  // Get a restaurant by ID
  async getRestaurantById(id: string) {
    const restaurant = await this.restaurantModel.findById(id);
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found.');
    }
    return restaurant;
  }

  // Get restaurants by owner ID
  async getRestaurantsByOwner(ownerId: string): Promise<RestaurantDocument> {
    return this.restaurantModel
      .findOne({
        owner: new mongoose.Types.ObjectId(ownerId),
      })
      .lean()
      .exec();
  }

  // Delete a restaurant
  async deleteRestaurant(id: string): Promise<void> {
    const result = await this.restaurantModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException('Restaurant not found.');
    }
  }
}
