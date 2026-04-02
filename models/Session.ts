import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  createdAt: Date
}

const SessionSchema: Schema<ISession> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  createdAt: { type: Date, default: Date.now },
})

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema)