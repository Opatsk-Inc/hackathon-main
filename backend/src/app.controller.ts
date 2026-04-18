import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { RealtimeService } from './common/realtime.service';


@Controller('')
export class AppController {
  constructor(private readonly realtimeService: RealtimeService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck(): void { }

}
