const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function normalizeNextPath(nextPath) {
  if (!nextPath || typeof nextPath !== "string" || !nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

function setUserCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `userToken=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
  );
}

exports.renderSignup = (req, res) => {
  return res.render("auth/signup", {
    error: null,
    formData: {},
    nextPath: normalizeNextPath(req.query.next)
  });
};

exports.renderLogin = (req, res) => {
  return res.render("auth/login", {
    error: null,
    formData: {},
    nextPath: normalizeNextPath(req.query.next)
  });
};

exports.signup = async (req, res) => {
  const { fullname = "", email = "", password = "", nextPath = "/" } = req.body;
  const safeNextPath = normalizeNextPath(nextPath);
  const formData = { fullname, email, nextPath: safeNextPath };

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).render("auth/signup", {
        error: "An account with this email already exists. Please sign in instead.",
        formData,
        nextPath: safeNextPath
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullname: fullname.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = jwt.sign({ id: user._id, type: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    setUserCookie(res, token);
    return res.redirect(safeNextPath);
  } catch (error) {
    console.log(error);
    return res.status(500).render("auth/signup", {
      error: "We could not create your account right now. Please try again.",
      formData,
      nextPath: safeNextPath
    });
  }
};

exports.login = async (req, res) => {
  const { email = "", password = "", nextPath = "/" } = req.body;
  const safeNextPath = normalizeNextPath(nextPath);
  const formData = { email, nextPath: safeNextPath };

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).render("auth/login", {
        error: "Invalid email or password. Please try again.",
        formData,
        nextPath: safeNextPath
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render("auth/login", {
        error: "Invalid email or password. Please try again.",
        formData,
        nextPath: safeNextPath
      });
    }

    const token = jwt.sign({ id: user._id, type: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    setUserCookie(res, token);
    return res.redirect(safeNextPath);
  } catch (error) {
    console.log(error);
    return res.status(500).render("auth/login", {
      error: "We could not sign you in right now. Please try again.",
      formData,
      nextPath: safeNextPath
    });
  }
};

exports.logout = (req, res) => {
  res.setHeader("Set-Cookie", "userToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
  return res.redirect("/");
};
