import { Module } from '@nestjs/common';
import UserGateway from './ws/user.gateway';
import SessionsController from './route/sessions/sessions.controller';
import { SessionService } from './service/session.service';
import ChatService from './service/chat.service';
import LocationService from './service/location.service';
import AdminGateway from './ws/admin.gateway';
import { HttpModule } from '@nestjs/axios';
import RecaptchaService from './service/recaptcha.service';
import PrismaService from './service/prisma.service';

@Module({
  imports: [HttpModule.register({})],
  controllers: [SessionsController],
  providers: [
    PrismaService,
    UserGateway,
    AdminGateway,
    SessionService,
    ChatService,
    LocationService,
    RecaptchaService,
  ],
})
export class AppModule {}
