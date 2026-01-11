import mongoose from 'mongoose';

const GoogleOAuthTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,           // Google sub (unique user id)
      required: true,
      index: true,
      unique: true,
    },

    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
      select: false,          // hide by default for security
    },

    idToken: {
      type: String,
    },

    scope: {
      type: String,
    },

    tokenType: {
      type: String,
      default: 'Bearer',
    },

    expiryDate: {
      type: Number,           // milliseconds timestamp
      required: true,
    },

    refreshTokenExpiresIn: {
      type: Number,           // seconds (optional, Google specific)
    },
  },
  {
    timestamps: true,         // createdAt, updatedAt
  }
);

const GoogleOAuthToken = mongoose.model('GoogleOAuthToken', GoogleOAuthTokenSchema);
export default GoogleOAuthToken;