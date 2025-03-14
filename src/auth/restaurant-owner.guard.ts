// restaurant-owner.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { RestaurantsService } from 'src/restaurants/restaurants.service';

@Injectable()
export class RestaurantOwnerGuard implements CanActivate {
  constructor(private readonly restaurantService: RestaurantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<decodedRequest>();
    const restaurantId =
      request.params.restaurantId || request.user?.restaurantId;
    const userId = request.user?._id;

    const restaurant =
      await this.restaurantService.getRestaurantById(restaurantId);
    return restaurant.owner.toString() === userId;
  }
}
