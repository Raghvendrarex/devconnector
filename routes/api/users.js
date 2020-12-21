const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const {check,validationResult} = require("express-validator");
const { findOne } = require("../../models/User");

const User  = require("../../models/User");

router.post('/',[
    check("name","Name is required").not().isEmpty(),
    check("email","Enter A Valid Email").isEmail(),
    check("password","Enter A Password with minimum length of 6").isLength({min:6})
],async (req,res) =>{ 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    const {name,email,password} = req.body;
    try {
        //see if user exists
            let user = await User.findOne({email});

            if(user){
                return res.status(400).json({errors : [ { msg : "User Already exists" } ] });
            }
        //get user gravatar
        const avatar = gravatar.url(email,{
            s : "200",
            r : "pg",
            d :  "robohash"
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        //encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password,salt);
        await user.save();

        //return json web token
        const payload = {
            user:{
                id:user.id,
                name:user.name,
                email:user.email
            }
        };

        jwt.sign(payload, config.get("jwtSecret"),{expiresIn:3600000},(err,token)=>{
            if(err){
                throw err;
            }
            res.json({token});
        });

        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
    
});

module.exports = router;