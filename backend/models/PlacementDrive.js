import mongoose from 'mongoose';

const placementDriveSchema = new mongoose.Schema({
  title: String,
  date: Date,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
});

export default mongoose.model('PlacementDrive', placementDriveSchema);
