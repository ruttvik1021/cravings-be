// menu.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateCategoryDto } from 'src/restaurants/dto/create-category.dto';
import {
  MenuCategory,
  MenuCategoryDocument,
} from '../schemas/menu-category.schema';
import { MenuItem } from '../schemas/menu-item.schema';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MenuCategory.name)
    private categoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItem>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    req: decodedRequest,
  ) {
    const restaurantId = req.user?.restaurantId;

    const existingCategory = await this.categoryModel
      .findOne({
        name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
        restaurant: restaurantId,
      })
      .lean()
      .exec();

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      restaurant: restaurantId,
    });

    return category.save();
  }

  async getCategories(req: decodedRequest) {
    const restaurantId = req.user?.restaurantId;

    return this.categoryModel
      .find(
        {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
        },
        { name: 1, _id: 1, description: 1 },
      )
      .lean()
      .exec();
  }

  async updateCategory(
    categoryId: string,
    updateCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.categoryModel
      .findById(categoryId)
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for duplicate name
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryModel
        .findOne({
          name: { $regex: new RegExp(`^${updateCategoryDto.name}$`, 'i') },
          restaurant: category.restaurant,
          _id: { $ne: categoryId },
        })
        .lean()
        .exec();

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.categoryModel
      .findByIdAndUpdate(categoryId, updateCategoryDto, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryModel
      .findById(categoryId)
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for existing items - use countDocuments instead of find for better performance
    const itemsCount = await this.menuItemModel
      .countDocuments({
        category: categoryId,
      })
      .exec();

    if (itemsCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing menu items',
      );
    }

    return this.categoryModel.findByIdAndDelete(categoryId).exec();
  }

  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
    file: Express.Multer.File,
    req: decodedRequest,
  ) {
    const ownerId = req.user._id;
    const restaurantId = req.user.restaurantId;

    // Check for duplicate item name in category
    const existingItem = await this.menuItemModel
      .findOne({
        name: createMenuItemDto.name,
        category: createMenuItemDto.category,
        restaurant: restaurantId,
      })
      .lean()
      .exec();

    if (existingItem) {
      throw new ConflictException(
        'Item with this name already exists in the category',
      );
    }

    // Upload image to Cloudinary
    let imageUrl = '';
    if (file) {
      imageUrl = await this.cloudinaryService.uploadImage(
        file,
        `restaurants/${ownerId}/images/menu/${createMenuItemDto.name}`,
      );
    }

    const newItem = new this.menuItemModel({
      ...createMenuItemDto,
      restaurant: restaurantId,
      image: imageUrl,
    });

    return newItem.save();
  }

  async getMenuItems(req: decodedRequest) {
    const restaurantId = req.user.restaurantId;
    return this.menuItemModel
      .find({ restaurant: restaurantId })
      .select('name price description category image isAvailable')
      .sort('name')
      .lean()
      .exec();
  }

  async getMenuItemById(id: string, req: decodedRequest) {
    const restaurantId = req.user.restaurantId;
    const item = await this.menuItemModel
      .findOne({
        _id: id,
        restaurant: restaurantId,
      })
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async updateMenuItem(
    id: string,
    updateMenuItemDto: CreateMenuItemDto,
    file: Express.Multer.File,
    req: decodedRequest,
  ): Promise<MenuItem> {
    const { _id: ownerId, restaurantId } = req.user;

    // Validate existing item - get only needed fields
    const existingItem = await this.menuItemModel
      .findOne({
        _id: id,
        restaurant: restaurantId,
      })
      .select('name category image')
      .lean()
      .exec();

    if (!existingItem) {
      throw new NotFoundException('Menu item not found');
    }

    // Check for name conflict - only if name is changing
    if (
      updateMenuItemDto.name &&
      updateMenuItemDto.name !== existingItem.name
    ) {
      const duplicateItem = await this.menuItemModel
        .findOne({
          name: updateMenuItemDto.name,
          category: existingItem.category,
          restaurant: restaurantId,
          _id: { $ne: id },
        })
        .lean()
        .exec();

      if (duplicateItem) {
        throw new ConflictException(
          'Item name already exists in this category',
        );
      }
    }

    // Create update payload
    const updatedItem: any = {
      ...updateMenuItemDto,
      updatedAt: new Date(),
    };

    // Handle image update only if a new file is provided
    if (file) {
      // Process image deletion and upload in parallel if possible
      const imagePromises = [];

      // Delete old image if exists
      if (existingItem.image) {
        imagePromises.push(
          this.cloudinaryService.deleteImage(existingItem.image),
        );
      }

      // Upload new image
      const uploadPromise = this.cloudinaryService.uploadImage(
        file,
        `restaurants/${ownerId}/menu/${updateMenuItemDto.name || existingItem.name}`,
      );
      imagePromises.push(uploadPromise);

      // Wait for image processing to complete
      const results = await Promise.all(imagePromises);

      // The last result is the new image URL
      updatedItem.image = results[imagePromises.length - 1];
    }

    // Perform update
    const result = await this.menuItemModel
      .findByIdAndUpdate(id, updatedItem, { new: true, runValidators: true })
      .exec();

    if (!result) {
      throw new NotFoundException('Menu item not found after update attempt');
    }

    return result;
  }

  async deleteMenuItem(id: string, req: decodedRequest) {
    const restaurantId = req.user?.restaurantId;

    // Get the item first to access its image URL
    const item = await this.menuItemModel
      .findOne({
        _id: id,
        restaurant: restaurantId,
      })
      .select('image')
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Perform deletion and image cleanup in parallel
    const deletePromises = [this.menuItemModel.findByIdAndDelete(id).exec()];

    // Delete image from Cloudinary if it exists
    if (item.image) {
      deletePromises.push(this.cloudinaryService.deleteImage(item.image));
    }

    // Wait for all operations to complete
    const [deletedItem] = await Promise.all(deletePromises);

    return deletedItem;
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    const item = await this.menuItemModel
      .findOneAndUpdate(
        {
          _id: id,
        },
        {
          isAvailable,
        },
        { new: true },
      )
      .exec();

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }
}
