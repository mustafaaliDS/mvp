const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comments");
const User = require("../models/User");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const user = await User.find({ _id: req.params.id });
      const posts =
        (await Post.find({ user: req.params.id }).populate({
          path: "user",
          select: ["userName", "email"],
        })) == false
          ? user
          : await Post.find({ user: req.params.id }).populate({
              path: "user",
              select: ["userName", "email"],
            });

      res.json({ posts: posts, user: req.user.id });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find()
        .sort({ createdAt: "desc" })
        .lean()
        .populate({ path: "user", select: ["userName"] });
      res.json({ posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate({
        path: "user",
        select: ["userName"],
      });
      const user = await User.find({ _id: post.user });
      const comments = await Comment.find({ post: req.params.id })
        .sort({ createdAt: "desc" })
        .lean()
        .populate({ path: "commenter", select: ["userName"] });

      const postUser = await Post.find({ user: user[0]._id }).populate({
        path: "user",
        select: ["userName"],
      });

      res.json({
        post: post,
        user: req.user,
        comments: comments,
        postUser: postUser,
      });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload song to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        chunk_size: 6000000,
      });

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        userLiked: [],
        likes: 0,
        user: req.user.id,
      });
      console.log("Result: " + JSON.stringify(result));
      console.log("Post has been added!");
      res.redirect(`/profile/${req.user._id}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      let post = await Post.findById(req.params.id);
      let user = await User.findById(req.user._id);
      let userLikeStatus = user.postsLiked.includes(post._id);

      if (userLikeStatus == false) {
        await User.findOneAndUpdate(
          { _id: user._id },
          {
            $addToSet: { postsLiked: post._id },
          }
        );
        await Post.findOneAndUpdate(
          { _id: post._id },
          {
            $inc: { likes: 1 },
          }
        );
      } else if (userLikeStatus == true) {
        await User.findOneAndUpdate(
          { _id: user._id },
          {
            $pull: { postsLiked: post._id },
          }
        );
        await Post.findOneAndUpdate(
          { _id: post._id },
          {
            $inc: { likes: -1 },
          }
        );
      }
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
