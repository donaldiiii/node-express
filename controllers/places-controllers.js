const HttpError = require("../models/http-error");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const fs = require("fs");

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("invalid data", 422));
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    console.log(error);
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    console.log(error);
    const err = new HttpError("creating place failed", 500);
    return next(err);
  }
  if (!user) {
    return next(new HttpError("could not find user", 404));
  }

  try {
    //transactions in express loooooooooooool and sessions
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });
    user.places.push(createdPlace); //push of mongoose
    await user.save();
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    const err = new HttpError("failed creation of place", 500);
    return next(err);
  }
  res.status(201);
  res.json({ place: createdPlace });
};

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Error, Could not find a place " + err, 500);
    return next(error);
  }
  if (!userWithPlaces | (userWithPlaces === 0)) {
    const error = new HttpError(
      "could not find a place for the provided creator id",
      404
    );
    return next(error);
  }
  res.json({
    userWithPlaces: userWithPlaces.places.map((x) =>
      x.toObject({ getters: true })
    ),
  });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId); //does not return a promise // add .exec if u want a promise();
  } catch (err) {
    const error = new HttpError("Error, Could not find a place", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "could not find a place for the provided id",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("invalid data", 422));
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;
  let foundPlace;
  try {
    foundPlace = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(" smth went wrong", 500);
    return next(error);
  }

  if(foundPlace.creator.toString() !== req.userData.userId){
    const error = new HttpError("Not allowed", 401);
    return next(error);
  }
  foundPlace.title = title;
  foundPlace.description = description;
  try {
    await foundPlace.save();
  } catch (err) {
    const error = new HttpError(" smth went wrong", 500);
    return next(error);
  }
  res.status(200).json({ place: foundPlace.toObject() });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    const err = new HttpError(" smth went wrong, when  get place by id", 500);
    return next(err);
  }
  if (!place) {
    const err = new HttpError(" could not found place", 404);
    return next(err);
  }

  if(place.creator.id !== req.userData.userId){
    const error = new HttpError("Not allowed", 401);
    return next(error);
  }
  const imagePath = place.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    const err = new HttpError(" smth went wrong, not deleted place", 500);
    return next(err);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "Deleted successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
