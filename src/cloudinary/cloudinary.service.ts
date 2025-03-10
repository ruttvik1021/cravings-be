import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as cloudinary,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  private imageBase64(mimetype: string, buffer: Buffer) {
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    if (!file) {
      throw new Error('File is required');
    }

    const folderName = this.configService.get('CRAVINGS_PROFILE_PIC_FOLDER');
    const timestamp = Date.now(); // Used for versioning

    const publicId = `${userId}/profilePhoto/${timestamp}`;
    const image = this.imageBase64(file.mimetype, file.buffer);

    const result = await cloudinary.uploader.upload(image, {
      public_id: publicId,
      folder: folderName,
      overwrite: true, // Ensures the latest image is saved
    });

    return result.secure_url; // Return Cloudinary URL
  }

  async uploadIdCardImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    if (!file) {
      throw new Error('File is required');
    }

    const folderName = this.configService.get('CRAVINGS_IDCARD_FOLDER');
    const timestamp = Date.now(); // Used for versioning

    const publicId = `${userId}/idCard/${timestamp}`;
    const image = this.imageBase64(file.mimetype, file.buffer);

    const result = await cloudinary.uploader.upload(image, {
      public_id: publicId,
      folder: folderName,
      overwrite: true,
    });

    return result.secure_url;
  }
}
