import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Session {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop()
  wsId?: string;
  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  token: string;
  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: false })
  isTrackingLocation?: boolean;

  @Prop()
  nickname?: string;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);
