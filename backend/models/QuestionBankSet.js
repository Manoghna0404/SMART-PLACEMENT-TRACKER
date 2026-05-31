import mongoose from 'mongoose';

const questionBankSetSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['set1', 'set2', 'set3'],
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    topicName: {
      type: String,
      default: '',
      trim: true,
    },
    topicId: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('QuestionBankSet', questionBankSetSchema);
