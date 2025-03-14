import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  User,
  USER_MODEL,
  UserDocument,
  UserRoles,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    @InjectModel(USER_MODEL) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    // Cache configuration values
    this.jwtSecret = this.configService.get('JWT_SECRET');
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN');
  }

  async isUserPresent(email: string): Promise<void> {
    const isUserPresent = await this.userModel.findOne({ email }).lean().exec();
    if (isUserPresent) {
      throw new BadRequestException('User already registered');
    }
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; accessToken: string }> {
    await this.isUserPresent(createUserDto.email);

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isApproved: true,
    });

    await newUser.save();

    const payload = {
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    return {
      user: newUser,
      accessToken,
    };
  }

  async createRestaurantOwner(
    createUserDto: CreateUserDto,
    profilePhoto: Express.Multer.File,
    idCard: Express.Multer.File,
  ): Promise<{ user: User; accessToken: string }> {
    await this.isUserPresent(createUserDto.email);

    if (!profilePhoto || !idCard) {
      throw new BadRequestException('Profile photo and ID card are required.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user first to get userId
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: UserRoles.RESTAURANT_OWNER,
      isApproved: false, // Needs admin approval
    });

    await newUser.save();
    const userId = newUser._id.toString(); // Convert ObjectId to string

    // Upload images in parallel
    const [profilePhotoUrl, idCardUrl] = await Promise.all([
      this.cloudinaryService.uploadProfileImage(profilePhoto, userId),
      this.cloudinaryService.uploadIdCardImage(idCard, userId),
    ]);

    // Update user with image URLs
    newUser.profilePhoto = profilePhotoUrl;
    newUser.idPhoto = idCardUrl;
    await newUser.save();

    const payload = {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    return {
      user: newUser,
      accessToken,
    };
  }

  async createDeliveryAgent(
    createUserDto: CreateUserDto,
    profilePhoto: Express.Multer.File,
    idCard: Express.Multer.File,
  ): Promise<{ user: User; accessToken: string }> {
    await this.isUserPresent(createUserDto.email);

    if (!profilePhoto || !idCard) {
      throw new BadRequestException('Profile photo and ID card are required.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user first to get userId
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: UserRoles.DELIVERY_AGENT,
      isApproved: false, // Needs admin approval
    });

    await newUser.save();
    const userId = newUser._id.toString(); // Convert ObjectId to string

    // Upload images in parallel
    const [profilePhotoUrl, idCardUrl] = await Promise.all([
      this.cloudinaryService.uploadProfileImage(profilePhoto, userId),
      this.cloudinaryService.uploadIdCardImage(idCard, userId),
    ]);

    // Update user with image URLs
    newUser.profilePhoto = profilePhotoUrl;
    newUser.idPhoto = idCardUrl;
    await newUser.save();

    const payload = {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    return {
      user: newUser,
      accessToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<UserDocument>; accessToken: string }> {
    const userWithRestaurant = await this.userModel
      .aggregate([
        {
          $match: { email: loginDto.email }, // Find user by email
        },
        {
          $lookup: {
            from: 'restaurants',
            let: { userId: '$_id' }, // Keep `_id` as ObjectId
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [{ $toObjectId: '$owner' }, '$$userId'] }, // Convert `owner` to ObjectId
                },
              },
            ],
            as: 'restaurant',
          },
        },
        {
          $unwind: {
            path: '$restaurant',
            preserveNullAndEmptyArrays: true, // Keep users even if they have no restaurant
          },
        },
        {
          $limit: 1, // Limit to just the first result
        },
      ])
      .exec();

    const user = userWithRestaurant[0]; // Extract the first result

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user._id, email: user.email, role: user.role };
    const restaurant = user.restaurant || null; // Assign the restaurant if exists

    const accessToken = await this.jwtService.signAsync(
      {
        ...payload,
        restaurantId: restaurant?._id,
      },
      { secret: this.jwtSecret, expiresIn: this.jwtExpiresIn },
    );

    return {
      user,
      accessToken,
    };
  }

  async getUserById(id: string): Promise<User> {
    return this.userModel.findById(id).select('-password').lean().exec();
  }

  async getDeliveryAgents() {
    return this.userModel
      .find({
        role: UserRoles.RESTAURANT_OWNER,
        isApproved: true,
      })
      .lean()
      .exec();
  }

  async getDeliveryAgentsRequests() {
    return this.userModel
      .find({
        role: UserRoles.RESTAURANT_OWNER,
        isApproved: false,
      })
      .lean()
      .exec();
  }
}
