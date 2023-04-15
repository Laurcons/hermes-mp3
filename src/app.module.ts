import { Module } from '@nestjs/common';
import UserGateway from './ws/user.gateway';
import SessionsController from './route/sessions/sessions.controller';
import { SessionService } from './service/session.service';
import ChatService from './service/chat.service';
import LocationService from './service/location.service';
import AdminGateway from './ws/admin.gateway';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { config } from './lib/config';
import { Session, SessionSchema } from './models/session';
import { ChatMessage, ChatMessageSchema } from './models/chatMessage';
import { LocationEvent, LocationEventSchema } from './models/locationEvent';
import { HttpModule } from '@nestjs/axios';
import RecaptchaService from './service/recaptcha.service';

const models: ModelDefinition[] = [
  { name: Session.name, schema: SessionSchema, collection: 'session' },
  // prettier-ignore
  { name: ChatMessage.name, schema: ChatMessageSchema, collection: 'chatMessage' },
  // prettier-ignore
  { name: LocationEvent.name, schema: LocationEventSchema, collection: 'locationEvent' },
];

@Module({
  imports: [
    MongooseModule.forRoot(config.mongoUrl),
    MongooseModule.forFeature(models),
    HttpModule.register({}),
  ],
  controllers: [SessionsController],
  providers: [
    UserGateway,
    AdminGateway,
    SessionService,
    ChatService,
    LocationService,
    RecaptchaService,
  ],
})
export class AppModule {}
