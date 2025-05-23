import { User } from "../model/user.model.js";
import bcrypt from "bcryptjs";
import config from "../config.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(401).json({ errors: "User already exist" });
    }
    // bcrypt code
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });
    await newUser.save();
    return res.status(201).json({ message: "User signup succeeded" });
  } catch (error) {
    console.log("error in signup", error);
    return res.status(500).json({ errors: "Error in signup" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(403).json({ errors: "invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ errors: "invalid credentials" });
    }
    //jwt code
    const token = jwt.sign({ id: user._id }, config.JWT_USER_PASSWORD, {
      expiresIn: "1d",
    });
    const coookieOption = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };
    res.cookie("jwt", token, coookieOption);
    return res
      .status(200)
      .json({ message: "User loggedin successfully", user, token });
  } catch (error) {
    console.log("error in login:", error);
    res.status(500).json({ error: "login error" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({ message: "loggout success" });
  } catch (error) {
    console.log("error in logout:", error);
    return res.status(500).json({ error: "Error in logout" });
  }
};
