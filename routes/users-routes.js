const express = require("express");

const usersController = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const userRouter = express.Router();

userRouter.get("/", usersController.getUsers);
userRouter.post("/signup", fileUpload.single("image"), usersController.signup); //name in expecting bodyF
userRouter.post("/login", usersController.login);

// userRouter.get("/:uid", (req, res, next) => {
//   const userId = req.params.uid;
//   var user = DUMMY_USERS.find((x) => {
//     return x.id == userId;
//   });
//   if(user){
//   res.json(user);
//   } else {
//     res.json({message:'user not found'})
//   }
// });

module.exports = userRouter;
