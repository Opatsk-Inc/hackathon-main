import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('recommendations')
@Controller('api/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get(':anomalyId')
  @ApiOperation({ summary: 'Отримати AI рекомендації для аномалії' })
  async getRecommendation(@Param('anomalyId') anomalyId: string) {
    const content = await this.recommendationsService.generateRecommendation(anomalyId);
    return { anomalyId, content };
  }
}
