import { Body, Controller, Post } from '@nestjs/common';
import { SessionService } from 'src/service/session.service';

@Controller('session')
export default class SessionsController {
  constructor(private sessionService: SessionService) {}

  @Post()
  create(@Body() body: any) {
    if (body.username) {
      return this.sessionService.createAdminSession(
        body.username,
        body.password,
      );
    } else {
      return this.sessionService.createUserSession(body);
    }
  }
}
