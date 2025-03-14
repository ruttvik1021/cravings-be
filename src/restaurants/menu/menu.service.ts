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

    const existingCategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
      restaurant: restaurantId,
    });

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

    return this.categoryModel.find(
      {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
      },
      { name: 1, _id: 1, description: 1 },
    );
  }

  async updateCategory(
    categoryId: string,
    updateCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for duplicate name
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: { $regex: new RegExp(`^${updateCategoryDto.name}$`, 'i') },
        restaurant: category.restaurant,
        _id: { $ne: categoryId },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.categoryModel.findByIdAndUpdate(categoryId, updateCategoryDto, {
      new: true,
      runValidators: true,
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for existing items
    const itemsCount = await this.menuItemModel.countDocuments({
      category: categoryId,
    });

    if (itemsCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing menu items',
      );
    }

    return this.categoryModel.findByIdAndDelete(categoryId);
  }

  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
    file: Express.Multer.File,
    req: decodedRequest,
  ) {
    const ownerId = req.user._id;
    const restaurantId = req.user.restaurantId;

    // Check for duplicate item name in category
    const existingItem = await this.menuItemModel.findOne({
      name: createMenuItemDto.name,
      category: createMenuItemDto.category,
      restaurant: restaurantId,
    });

    if (existingItem) {
      throw new ConflictException(
        'Item with this name already exists in the category',
      );
    }

    // Upload image to Cloudinary
    let imageUrl = '';
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        `restaurants/${ownerId}/images/menu/${createMenuItemDto.name}`,
      );
      imageUrl = uploadResult;
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
    return this.menuItemModel.find({ restaurant: restaurantId }).sort('name');
  }

  async getMenuItemById(id: string, req: decodedRequest) {
    const restaurantId = req.user.restaurantId;
    const item = await this.menuItemModel.findOne({
      _id: id,
      restaurant: restaurantId,
    });

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

    // Validate existing item
    const existingItem = await this.menuItemModel
      .findOne({
        _id: id,
        restaurant: restaurantId,
      })
      .exec();

    if (!existingItem) {
      throw new NotFoundException('Menu item not found');
    }

    // Check for name conflict
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
        .exec();

      if (duplicateItem) {
        throw new ConflictException(
          'Item name already exists in this category',
        );
      }
    }

    // Handle image update
    let imageUrl = existingItem.image;
    if (file) {
      // Delete old image if exists
      if (imageUrl) {
        await this.cloudinaryService.deleteImage(imageUrl);
      }

      // Upload new image
      imageUrl = await this.cloudinaryService.uploadImage(
        file,
        `restaurants/${ownerId}/menu/${updateMenuItemDto.name}`,
      );
    }

    // Create update payload
    const updatedItem = {
      ...updateMenuItemDto,
      image: imageUrl,
      updatedAt: new Date(),
    };

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
    const item = await this.menuItemModel.findOneAndDelete({
      _id: id,
      restaurant: restaurantId,
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Delete image from Cloudinary
    if (item.image) {
      await this.cloudinaryService.deleteImage(item.image);
    }

    return item;
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    const item = await this.menuItemModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        isAvailable,
      },
      { new: true },
    );
    return item;
  }
}
