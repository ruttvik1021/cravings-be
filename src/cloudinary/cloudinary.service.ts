import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  private imageBase64(mimetype: string, buffer: Buffer) {
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }

  /**
   * Uploads an image with specified parameters
   */
  private async uploadImageWithParams(
    file: Express.Multer.File,
    options: {
      publicId: string;
      folder: string;
      overwrite?: boolean;
    },
  ): Promise<string> {
    if (!file) {
      throw new Error('File is required');
    }

    const image = this.imageBase64(file.mimetype, file.buffer);

    const result = await cloudinary.uploader.upload(image, {
      public_id: options.publicId,
      folder: options.folder,
      overwrite: options.overwrite ?? true,
    });

    return result.secure_url;
  }

  /**
   * Uploads a profile image
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const folderName = this.configService.get('CRAVINGS_PROFILE_PIC_FOLDER');
    const timestamp = Date.now();
    const publicId = `${userId}/profilePhoto/${timestamp}`;

    return this.uploadImageWithParams(file, {
      publicId,
      folder: folderName,
    });
  }

  /**
   * Uploads an ID card image
   */
  async uploadIdCardImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const folderName = this.configService.get('CRAVINGS_IDCARD_FOLDER');
    const timestamp = Date.now();
    const publicId = `${userId}/idCard/${timestamp}`;

    return this.uploadImageWithParams(file, {
      publicId,
      folder: folderName,
    });
  }

  /**
   * Uploads an image to a specified folder using stream
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    if (!file) {
      throw new Error('File is required');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes an image by its public ID
   */
  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }
}
