const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comments");
const User = require("../models/User");

let userLiked = [];

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      console.log(posts);
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts, user: req.user });
      console.log(req.user);
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({ post: req.params.id })
        .sort({ createdAt: "desc" })
        .lean()
        .populate({ path: "commenter", select: ["userName"] });

      res.render("post.ejs", {
        post: post,
        user: req.user,
        comments: comments,
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

      console.log(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        userLiked: userLiked,
        likes: 0,
        user: req.user.id,
      });
      console.log("Result: " + JSON.stringify(result));
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userLikeStatus = post.userLiked.some((elem) => req.user.id == elem);
    try {
      console.log(req.user.id);
      if (userLikeStatus === true) {
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $pull: { userLiked: req.user.id },
          }
        );
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: -1 },
          }
        );
      } else if (userLikeStatus === false) {
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $addToSet: { userLiked: req.user.id },
          }
        );
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: 1 },
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
