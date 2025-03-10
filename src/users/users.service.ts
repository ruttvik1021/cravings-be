// users/users.service.ts
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
import { User, UserRoles } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async isUserPresent(email: string) {
    const isUserPresent = await this.userModel.findOne({ email });
    if (isUserPresent) {
      throw new BadRequestException('User already registered');
    }
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; accessToken: string }> {
    this.isUserPresent(createUserDto.email);
    const jwtSecret = this.configService.get('JWT_SECRET')!;
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN')!;

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isApproved: true,
    });

    await newUser.save();

    const payload = {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...payload },
      { secret: jwtSecret, expiresIn: jwtExpiresIn },
    );

    return {
      user: newUser.toObject(),
      accessToken,
    };
  }

  async createRestaurantOwner(
    createUserDto: CreateUserDto,
    profilePhoto: Express.Multer.File,
    idCard: Express.Multer.File,
  ): Promise<{ user: User; accessToken: string }> {
    this.isUserPresent(createUserDto.email);
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

    const profilePhotoUrl = await this.cloudinaryService.uploadProfileImage(
      profilePhoto,
      userId,
    );

    const idCardUrl = await this.cloudinaryService.uploadIdCardImage(
      idCard,
      userId,
    );

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
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    return {
      user: newUser.toObject(),
      accessToken,
    };
  }

  async createDeliveryAgent(
    createUserDto: CreateUserDto,
    profilePhoto: Express.Multer.File,
    idCard: Express.Multer.File,
  ): Promise<{ user: User; accessToken: string }> {
    this.isUserPresent(createUserDto.email);
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

    // Upload ID card to Cloudinary
    const profilePhotoUrl = await this.cloudinaryService.uploadProfileImage(
      profilePhoto,
      userId,
    );

    const idCardUrl = await this.cloudinaryService.uploadIdCardImage(
      idCard,
      userId,
    );

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
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    return {
      user: newUser.toObject(),
      accessToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: User; accessToken: string }> {
    const jwtSecret = this.configService.get('JWT_SECRET')!;
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN')!;

    const user = await this.userModel.findOne({ email: loginDto.email });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check approval for restaurant owners/delivery agents
    if (
      [UserRoles.RESTAURANT_OWNER, UserRoles.DELIVERY_AGENT].includes(
        user.role as UserRoles,
      ) &&
      !user.isApproved
    ) {
      throw new UnauthorizedException('Account pending approval');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(
      { ...payload },
      { secret: jwtSecret, expiresIn: jwtExpiresIn },
    );

    return {
      user: user.toObject(), // Convert Mongoose document to plain object
      accessToken,
    };
  }

  async getUserById(id: string): Promise<User> {
    return this.userModel.findById(id).select('-password');
  }

  async getDeliveryAgents() {
    return this.userModel.find({
      role: UserRoles.RESTAURANT_OWNER,
      isApproved: true,
    });
  }

  async getDeliveryAgentsRequests() {
    return this.userModel.find({
      role: UserRoles.RESTAURANT_OWNER,
      isApproved: false,
    });
  }
}
