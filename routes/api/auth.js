const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const {check,validationResult} = require("express-validator");


router.get('/',auth, async (req,res) => {
    try{
        
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post('/',[
    check("email","Enter A Valid Email").isEmail(),
    check("password","Password is required").exists()
],async (req,res) =>{ 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const {email,password} = req.body;
    try {
        //see if user exists
            let user = await User.findOne({email});

            if(!user){
                return res.status(400).json({errors : [ { msg : "Invalid Credentials" } ] });
            }
        //get user gravatar
        const avatar = gravatar.url(email,{
            s : "200",
            r : "pg",
            d :  "robohash"
        })

        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(400).json({errors : [ { msg : "Invalid Credentials" } ] });
        }

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