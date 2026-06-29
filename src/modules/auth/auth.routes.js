const router = require("express").Router();
const controller = require("./auth.controller");
const auth = require("../../middleware/auth");

router.get("/me", auth, (req, res) => {
    res.json(req.user);
});
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);

module.exports = router;
