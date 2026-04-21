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
  return res.setHeader(
    "Set-Cookie",
    `userToken=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
  );
}

function setUserCookieWithDuration(res, token, maxAgeSeconds) {
  return res.setHeader(
    "Set-Cookie",
    `userToken=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=Lax`
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

exports.renderForgotPassword = (req, res) => {
  return res.render("auth/forgotPassword", {
    error: null,
    success: null,
    formData: {}
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
  const { email = "", password = "", nextPath = "/", rememberMe } = req.body;
  const safeNextPath = normalizeNextPath(nextPath);
  const rememberUser = rememberMe === "true" || rememberMe === "on";
  const formData = { email, nextPath: safeNextPath, rememberMe: rememberUser };

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
      expiresIn: rememberUser ? "30d" : "1d"
    });

    setUserCookieWithDuration(res, token, rememberUser ? 30 * 24 * 60 * 60 : 24 * 60 * 60);
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

exports.forgotPassword = async (req, res) => {
  const email = req.body.email?.trim() || "";

  try {
    if (!email) {
      return res.status(400).render("auth/forgotPassword", {
        error: "Please enter the email address linked to your account.",
        success: null,
        formData: { email }
      });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).render("auth/forgotPassword", {
        error: "We couldn't find an account with that email.",
        success: null,
        formData: { email }
      });
    }

    return res.render("auth/forgotPassword", {
      error: null,
      success: "Account found. Email reset is not configured yet, so please contact support or the site owner for a password update.",
      formData: { email }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).render("auth/forgotPassword", {
      error: "We could not process your request right now. Please try again.",
      success: null,
      formData: { email }
    });
  }
};

exports.logout = (req, res) => {
  res.setHeader("Set-Cookie", "userToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
  return res.redirect("/");
};
