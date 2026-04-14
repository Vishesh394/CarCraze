const jwt = require("jsonwebtoken");
const User = require("../models/User");

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = cookie.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

function clearAuthState(req, res) {
  req.currentUser = null;
  res.locals.currentUser = null;
  res.setHeader("Set-Cookie", "userToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
}

exports.attachCurrentUser = async (req, res, next) => {
  res.locals.currentUser = null;
  req.currentUser = null;

  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.userToken;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "user") {
      return next();
    }

    const user = await User.findById(decoded.id).select("fullname email");
    if (!user) {
      clearAuthState(req, res);
      return next();
    }

    req.currentUser = user;
    res.locals.currentUser = user;
    return next();
  } catch (error) {
    clearAuthState(req, res);
    return next();
  }
};

exports.requireUser = (req, res, next) => {
  if (req.currentUser) {
    return next();
  }

  const nextPath = encodeURIComponent(req.originalUrl || "/");
  return res.redirect(`/login?next=${nextPath}`);
};

exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.currentUser) {
    return res.redirect("/");
  }

  return next();
};
