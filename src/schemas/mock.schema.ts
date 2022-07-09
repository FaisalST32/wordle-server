import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Mock {
  @Prop()
  key: string;
  @Prop({ type: Object })
  data: any;
}

export type MockDocument = Mock & Document;

export const MockSchema = SchemaFactory.createForClass(Mock);
