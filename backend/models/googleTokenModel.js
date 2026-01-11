import mongoose from "mongoose";

const googleTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Google "sub"
      required: true,
      unique: true,
      index: true,
    },

    refreshToken: {
      type: String,
      required: true,
      select: false, // prevent accidental exposure
    },

    accessToken: {
      type: String,
      default: null,
      select: false,
    },

    expiryDate: {
      type: Number, // epoch ms
      required: true,
    }
  },
  { timestamps: true }
);

const GoogleToken = mongoose.model(
  "GoogleToken",
  googleTokenSchema
);
export default GoogleToken;