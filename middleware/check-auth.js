const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    if(req.method === 'OPTIONS'){
        return next();
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Failed");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY); //if this does not fail then the token must be valid
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authentication failed", 401);
    return next(error);
  }
};
