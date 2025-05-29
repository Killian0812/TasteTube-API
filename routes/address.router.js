const router = require("express").Router();
const addressController = require("../controllers/address.controller");

router.get("/", addressController.getAddresses);

router.post("/", addressController.upsertAddress);

router.put("/:addressId", addressController.setDefaultAddress);

router.delete("/:addressId", addressController.deleteAddress);

module.exports = router;
