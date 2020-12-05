const express = require("express");
const router = express.Router();

router.post('/',(req,res) => res.send("profile routes"));

module.exports = router;