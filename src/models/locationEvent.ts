import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Location } from '../types/location';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class LocationEvent implements Location {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'session',
  })
  session: string;

  @Prop({ type: SchemaTypes.Date })
  timestamp: Date;
  @Prop({
    required: true,
  })
  lat: number;
  @Prop({
    required: true,
  })
  lon: number;
  @Prop()
  acc?: number;
}

export type LocationEventDocument = LocationEvent & Document;
export const LocationEventSchema = SchemaFactory.createForClass(LocationEvent);
