const express = require('express');
const upload = require('./uploads')

const parseFormData = (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
};


const uploadFile = (req, res, next) => {
    console.log(req.body)
    upload.single('product_img')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };

module.exports = {parseFormData, uploadFile}