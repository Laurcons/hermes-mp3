import { Body, Controller, Ip, Post } from '@nestjs/common';
import { SessionService } from 'src/service/session.service';

@Controller('session')
export default class SessionsController {
  constructor(private sessionService: SessionService) {}

  @Post()
  create(@Body() body: any, @Ip() ip: string) {
    if (body.username) {
      return this.sessionService.createAdminOrVolunteerSession({
        ...body,
        ip,
      });
    } else {
      return this.sessionService.createUserSession({
        ...body,
        ip,
      });
    }
  }
}
