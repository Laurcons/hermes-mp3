import { Module } from '@nestjs/common';
import UserGateway from './ws/user.gateway';
import SessionsController from './route/sessions.controller';
import { SessionService } from './service/session.service';
import ChatService from './service/chat.service';
import LocationService from './service/location.service';
import AdminGateway from './ws/admin.gateway';
import { HttpModule } from '@nestjs/axios';
import RecaptchaService from './service/recaptcha.service';
import PrismaService from './service/prisma.service';
import StatusService from './service/status.service';
import VolunteerGateway from './ws/volunteer-gateway';
import { ModerationService } from './service/moderation.service';

@Module({
  imports: [HttpModule.register({})],
  controllers: [SessionsController],
  providers: [
    PrismaService,
    UserGateway,
    AdminGateway,
    VolunteerGateway,
    SessionService,
    ChatService,
    LocationService,
    RecaptchaService,
    StatusService,
    ModerationService,
  ],
})
export class AppModule {}
