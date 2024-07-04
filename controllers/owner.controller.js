const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../middlewares/owner/validate-request');
const ownerService = require('../models/owner/owner.service');

function createSchema(req, res, next) {
    const schema = Joi.object({
        company_name: Joi.string().required(),
        store_category: Joi.string().required(),
        company_address: Joi.string().required(),
        city: Joi.string().required(),
        postal_code: Joi.number().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        ein_number: Joi.number().required(),
        email: Joi.string().email().required(),
        mobile_number: Joi.number().required(),
        password: Joi.string().min(6).required(),
    });
    console.log("hello")

    // validateRequest(req, next, schema);
}


function signup(req, res, next) {
    ownerService.create(req.body)
        .then(() => res.json({ message: 'Shop owner registered successfully' }))
        .catch(next);
}


// function signup() {
//     return (req, res, next) => {
//         console.log("hi")
//       ownerService.create(req.body)
//         .then(() => res.status(200).json({ message: 'Shop Owner created' }))
//         .catch((error) => {
//           console.error(error);
//           next(error);
//         });
//     };
//   }

module.exports ={signup, createSchema}

