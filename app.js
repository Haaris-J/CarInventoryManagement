// Team 1

const express = require('express'); 
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt'); 
const session = require('express-session'); 
const cookieParser = require('cookie-parser'); 
const helmet = require('helmet'); 
const https = require('https'); 
const fs = require('fs'); 

const app = express();

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/carInventory', {
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

const UserSchema = new mongoose.Schema({
    username: String, 
    password: String, 
    role: { type: String, enum: ['admin', 'client'], default: 'user' } 
  });
const User = mongoose.model('User', UserSchema);

app.use(express.static('public')); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); 
app.use(session({
  secret: 'bingo', 
  resave: true,
  saveUninitialized: true, 
  cookie: {
    secure: true,
    maxAge: 3600000,
    httpOnly: true
  }
}));