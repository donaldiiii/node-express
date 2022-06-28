const { validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const place = require("../models/place");
const User = require("../models/user");
const { create } = require("../models/place");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    return next(new HttpError("fetching user failed", 500));
  }
  res.json({ users: users.map((x) => x.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("signing up failed, try laterr exist user", 500);
    return next(error);
  }
  if (existingUser) {
    const err = new HttpError("user exist already, login please", 422);
    return next(err);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new HttpError("Could not create user", 500);
    return next(err);
  }

  const createdUser = new User({
    id: uuid(),
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  try {
    await createdUser.save();
  } catch (error) {
    const err = new HttpError("signing up failed, try laterr", 500);
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    const err = new HttpError("signing up failed, try later jwt", 500);
    return next(err);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: create.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("signing up failed, try laterr", 500);
    return next(err);
  }

  if (!existingUser) {
    const error = new HttpError("Could not identify user", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError("Could not log you in, please check creds", 500);
    return next(err);
  }
  if (!isValidPassword) {
    const error = new HttpError("Invalid creds, could not log u in", 401);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {userId: existingUser.id, email: existingUser.email},
      process.env.JWT_KEY,
      {expiresIn: "24h"}
    );
  } catch (error) {
    const err = new HttpError("Loging in failed, try laterr", 500);
    return next(err);
  }
  res
    .status(201)
    .json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
