// menu.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { CreateCategoryDto } from 'src/restaurants/dto/create-category.dto';
import {
  MenuCategory,
  MenuCategoryDocument,
} from '../schemas/menu-category.schema';
import { MenuItem } from '../schemas/menu-item.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(MenuCategory.name)
    private categoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItem>,
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

    return this.categoryModel
      .find({ restaurant: restaurantId })
      .populate('restaurant');
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
}
