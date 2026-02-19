require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect(
  "mongodb+srv://bansal0001:P1r2a3t4h5a6m7@cluster0.gxcpfi0.mongodb.net/alumniDB"
)
.then(() => {
  console.log("MongoDB Atlas connected");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});


app.get("/", (req, res) => {
    res.send("Server running");
});

// login
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, password, role });

    if (user) {
      res.json({ message: "Login successful" });
    } else {
      res.json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.json({ error: "Login failed" });
  }
});




app.listen(12000, () => {
    console.log("Server running on port 12000");
});
// SIGN UP
app.post("/signup", async (req, res) => {
  const { email, password, role, fullName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.json({ error: "User already exists" });
    }

    const newUser = new User({
      email,
      password,
      role,
      fullName
    });

    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    res.json({ error: "Signup failed" });
  }
});


