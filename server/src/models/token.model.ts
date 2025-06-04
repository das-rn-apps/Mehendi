import mongoose, { Schema, Document, Model } from "mongoose";

export enum TokenType {
  REFRESH = "refresh",
  RESET_PASSWORD = "resetPassword",
  VERIFY_EMAIL = "verifyEmail",
  VERIFY_PHONE_OTP = "verifyPhoneOtp",
}

export interface IToken {
  token: string;
  user: mongoose.Types.ObjectId; // Ref to User model
  type: TokenType;
  expires: Date;
  blacklisted?: boolean; // For refresh tokens
}

export interface ITokenDocument extends IToken, Document {}
export interface ITokenModel extends Model<ITokenDocument> {}

const tokenSchema = new Schema<ITokenDocument, ITokenModel>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TokenType),
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      // Useful for refresh tokens if you want to blacklist them upon logout
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Token = mongoose.model<ITokenDocument, ITokenModel>("Token", tokenSchema);

export default Token;
