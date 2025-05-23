const express = require("express");
const CateringService = require("../../models/Catering"); // Ensure path is correct
const authVendor = require("../../middleware/authVendor");
const { sendNotification } = require("../../utils/notification");

const router = express.Router();

/**
 * @swagger
 * /vendor/catering/create:
 *   post:
 *     summary: Create a new catering service
 *     tags: [Catering]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - name
 *               - area
 *               - timing
 *               - price
 *               - cuisine
 *             properties:
 *               vendorId:
 *                 type: string
 *               name:
 *                 type: string
 *               area:
 *                 type: string
 *               timing:
 *                 type: string
 *               price:
 *                 type: number
 *               cuisine:
 *                 type: string
 *               image:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               rating:
 *                 type: number
 *               reviews:
 *                 type: number
 *     responses:
 *       201:
 *         description: Catering service created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/create", authVendor,async (req, res) => {
  try {
    const { title, description, area, timing, price, dishes, image, images } =
      req.body;

    const vendorId = req.vendor.id

    // Validate required fields
    if (!title || !description || !area || !timing || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const catering = await CateringService.create({
      vendorId,
      title,
      description,
      area,
      timing,
      price,
      dishes,
      image,
      images: images || [],
    });

    await sendNotification(vendorId, "Vendor", "New Catering Service Added", "A new catering service has been added to your account", "service_added");

    res.status(201).json({
      id: catering._id,
      title: catering.title,
      description: catering.description,
      price: catering.price,
      imageUris: catering.images || [catering.image],
      dishes: catering.dishes,
      additionalFields: {
        Area: catering.area,
        Timing: catering.timing,
      },
    });
  } catch (e) {
    console.log("ERROR", e);
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /vendor/catering/:
 *   get:
 *     summary: Get all catering services
 *     tags: [Catering]
 *     responses:
 *       200:
 *         description: List of all catering services
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const caterings = await CateringService.find();
    res.status(200).json(caterings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /vendor/catering/vendor/{vendorId}:
 *   get:
 *     summary: Get catering services by vendor ID
 *     tags: [Catering]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: List of catering services by vendor
 *       500:
 *         description: Server error
 */
router.get("/vendor",authVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id
    const caterings = await CateringService.find({ vendorId });

    // Transform the data to match ServiceCard format
    const formattedCaterings = caterings.map((catering) => ({
      id: catering._id,
      title: catering.title,
      description: catering.description,
      price: catering.price,
      imageUris: catering.images || [catering.image],
      dishes: catering.dishes,
      additionalFields: {
        Area: catering.area,
        Timing: catering.timing,
      },
    }));

    res.status(200).json(formattedCaterings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /vendor/catering/{id}:
 *   get:
 *     summary: Get a catering service by ID
 *     tags: [Catering]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Catering service ID
 *     responses:
 *       200:
 *         description: Catering service found
 *       404:
 *         description: Catering service not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const catering = await CateringService.findById(id);

    if (!catering) {
      return res.status(404).json({ message: "Catering service not found" });
    }

    res.status(200).json(catering);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /vendor/catering/{id}:
 *   put:
 *     summary: Update a catering service by ID
 *     tags: [Catering]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the catering service to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update
 *     responses:
 *       200:
 *         description: Catering service updated successfully
 *       404:
 *         description: Catering service not found
 *       500:
 *         description: Server error
 */
router.put("/:id",authVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id
    const updatedData = req.body;
    // Check ownership
    const existingCatering = await CateringService.findById(id);
    if (!existingCatering) {
      return res.status(404).json({ message: "Catering service not found" });
    }
    if (existingCatering.vendorId.toString() !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this catering service" });
    }

    const catering = await CateringService.findByIdAndUpdate(
      id,
      {
        ...updatedData,
      },
      { new: true }
    );

    res.status(200).json({
      id: catering._id,
      title: catering.title,
      description: catering.description,
      price: catering.price,
      imageUris: catering.images || [catering.image],
      dishes: catering.dishes,
      additionalFields: {
        Area: catering.area,
        Timing: catering.timing,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /vendor/catering/{id}:
 *   delete:
 *     summary: Delete a catering service by ID
 *     tags: [Catering]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the catering service to delete
 *     responses:
 *       200:
 *         description: Catering service deleted successfully
 *       404:
 *         description: Catering service not found
 *       500:
 *         description: Server error
 */
router.delete("/:id",authVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor.id

    // Check ownership
    const existingCatering = await CateringService.findById(id);
    if (!existingCatering) {
      return res.status(404).json({ message: "Catering service not found" });
    }
    if (existingCatering.vendorId.toString() !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this catering service" });
    }

    await CateringService.findByIdAndDelete(id);
    res.status(200).json({ message: "Catering service deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
