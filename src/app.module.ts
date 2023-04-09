import { Module } from '@nestjs/common';
import UserGateway from './ws/user.gateway';
import SessionsController from './route/sessions/sessions.controller';
import { SessionService } from './service/session.service';
import ChatService from './service/chat.service';
import LocationService from './service/location.service';
import AdminGateway from './ws/admin.gateway';

@Module({
  imports: [],
  controllers: [SessionsController],
  providers: [
    UserGateway,
    AdminGateway,
    SessionService,
    ChatService,
    LocationService,
  ],
})
export class AppModule {}
