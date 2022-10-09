const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commenter: {
    // User that the comment is tied to
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  post: {
    // Post that the comment is tied to
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  likes: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Comments", CommentSchema);
