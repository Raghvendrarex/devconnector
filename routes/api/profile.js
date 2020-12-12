const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//get api/profile/me
//get current user profile with private access

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'there is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

//post api/profile
//create or update user profile with private access
router.post(
  '/',
  [
    auth,
    [
      check('status', 'status is required').not().isEmpty(),
      check('skills', 'skills are required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      res.status(400).json({errors:errors.array()});
    }

    const {company,website,location,bio,status,githubusername,skills,youtube,facebook,twitter,instagram,linkedin} = req.body;
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
      profileFields.skills = skills.split(",").map(skill=> skill.trim());
    }

    //build social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;
    
    try{
      let profile = await Profile.findOne({user:req.user.id});

      if(profile){
        //update profile
        profile = await Profile.findOneAndUpdate({user:req.user.id},{$set:profileFields},{new:true});
        return res.json(profile);
      }

      //create
      profile = new Profile(profileFields);
      await profile.save();

      res.json(profile);

    }catch(err){
      console.error(err.message);
      res.status(500).send("Server Error");
    }

  }
);

//route   api/profile
//desc    get all profiles
//access  public

router.get("/", async (req,res)=>{
  try {
    const profiles = await Profile.find().populate("user",["name","avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//route   api/profile/user/:user_id
//desc    get profile by user id
//access  public

router.get("/user/:user_id", async (req,res)=>{
  try {
    const profile = await Profile.findOne({user:req.params.user_id}).populate("user",["name","avatar"]);

    if(!profile){
      return res.status(400).json({msg:"Profile not found"});
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if(err.kind == "ObjectId"){
      return res.status(400).json({msg:"Profile not found"});
    }
    res.status(500).send("Server Error");
  }
});

//route   DELETE profile
//desc    delete profile,user and post 
//access  private

router.delete("/",auth ,async (req,res)=>{
  try {
    //@todo remove users posts


    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await User.findOneAndRemove({ _id: req.user.id });

    if( !profile ){
      return res.status(400).json({ msg: "Profile not found" });
    }

    res.json({ msg: "User Deleted!!!"});
  } catch (err) {
    console.error( err.message );
    res.status(500).send(" Server Error" );
  }
});

module.exports = router;
