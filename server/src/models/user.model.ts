import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "../enums/userRoles.enum";
import { IUserDocument, IUserModel } from "../interfaces/user.interface";

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address."],
    },
    password: {
      type: String,
      // required: [true, 'Password is required'], // May not be required if using OAuth
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Do not send password by default
    },
    phone: {
      type: String,
      trim: true,
      // match: [/^\+[1-9]\d{1,14}$/, 'Please use a valid phone number with country code.'], // E.164 format
    },
    avatar: {
      public_id: { type: String },
      url: { type: String, default: "https://via.placeholder.com/150" }, // Default avatar
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true, // User is active by default upon registration
    },
    lastLogin: {
      type: Date,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    // Artist specific fields (can be in a separate Artist model linked to User if more complex)
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    portfolio: [
      {
        type: Schema.Types.ObjectId,
        ref: "Design",
      },
    ], // Array of Design IDs
    availability: [
      {
        day: String, // e.g., 'Monday'
        startTime: String, // e.g., '09:00'
        endTime: String, // e.g., '17:00'
        isAvailable: { type: Boolean, default: true },
      },
    ],
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    specializations: [String],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        // required: function(this: IUserDocument) { return this.role === UserRole.ARTIST; } // Only required for artists
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere", // For geospatial queries
        // required: function(this: IUserDocument) { return this.role === UserRole.ARTIST; }
      },
      address: String,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // Ensure password is not sent even if selected
        delete ret.otp;
        delete ret.otpExpires;
        delete ret.refreshToken;
        // delete ret.__v; // Optionally remove version key
        // delete ret._id; // Optionally transform _id to id
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpires;
        delete ret.refreshToken;
      },
    },
  }
);

// Index for email for faster queries if not unique (unique implies index)
// userSchema.index({ email: 1 });
userSchema.index({ "location.coordinates": "2dsphere" }); // For artists

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// Static method to check if email is taken
userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: mongoose.Types.ObjectId
): Promise<boolean> {
  const query = { email };
  if (excludeUserId) {
    // @ts-ignore
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !!user;
};

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;
