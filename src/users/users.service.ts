// users/users.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; accessToken: string }> {
    const jwtSecret = this.configService.get('JWT_SECRET')!;
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN')!;

    if (['restaurant_owner', 'delivery_agent'].includes(createUserDto.role)) {
      if (!createUserDto.profilePhoto || !createUserDto.idPhoto) {
        throw new BadRequestException(
          'Profile photo and ID photo are required for this role',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isApproved: createUserDto.role === 'user' ? true : false,
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
      ['restaurant_owner', 'delivery_agent'].includes(user.role) &&
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

  async updateApprovalStatus(id: string, isApproved: boolean): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, { isApproved }, { new: true });
  }
}
