const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 4096 * 4096 }, // 16 MB
});
const productController = require("../controllers/product.controller");
const verifyJWT = require("../middlewares/verifyJWT");

// categories
router.get("/categories", verifyJWT(), productController.getCategories);
router.post("/categories", verifyJWT(), productController.addCategory);
router.put(
  "/categories/:categoryId",
  verifyJWT(),
  productController.updateCategory
);
router.delete(
  "/categories/:categoryId",
  verifyJWT(),
  productController.deleteCategory
);

// products
router.get("/", productController.getProducts);
router.get("/:productId", productController.getProduct);
router.post(
  "/",
  verifyJWT(),
  upload.array("images", 5),
  productController.createProduct
);
router.put(
  "/:productId",
  verifyJWT(),
  upload.array("images", 5),
  productController.updateProduct
);
router.delete(
  "/:productId/image",
  verifyJWT(),
  productController.deleteSingleProductImage
);
router.delete("/:productId", verifyJWT(), productController.deleteProduct);

module.exports = router;
