import mongoose, { Schema, Document, Model } from "mongoose"

export interface IMessage extends Document {
  sessionId: mongoose.Types.ObjectId
  role: "user" | "assistant"
  content: string
  isRecyclable?: boolean
  confidence?: number
  imageUrl?: string
  timestamp: Date
}

const MessageSchema: Schema<IMessage> = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },

  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },

  isRecyclable: { type: Boolean, default: null },
  confidence: { type: Number, default: null },
  imageUrl: String,

  timestamp: { type: Date, default: Date.now },
})

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)