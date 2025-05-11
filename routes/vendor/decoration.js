const express = require("express");
const router = express.Router();
const DecorationService = require("../../models/Decoration");
const authVendor = require("../../middleware/authVendor");
const Car = require("../../models/Car");
const CateringService = require("../../models/Catering");
const { sendNotification } = require("../../utils/notification");

/**
 * @swagger
 * /vendor/decoration/create:
 *   post:
 *     summary: Create a new decoration service
 *     tags: [Decoration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - description
 *               - location
 *               - pricePerUnit
 *             properties:
 *               vendorId:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               rating:
 *                 type: number
 *               numberOfReviews:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               serviceType:
 *                 type: string
 *               theme:
 *                 type: string
 *               availability:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Decoration service created successfully
 *       500:
 *         description: Server error
 */
router.post("/create",authVendor, async (req, res) => {
  try {
    const {title, description, location, price, images, theme } = req.body;
    console.log("DECORATION", req.body);
    const vendorId = req.vendor.id
    const decoration = await DecorationService.create({
      title,
      vendorId,
      description,
      location,
      price,
      images,
      theme,
    });
    await sendNotification(vendorId, "Vendor", "New Decoration Service Added", "A new decoration service has been added to your account", "service_added");
    res.status(201).json({
        id: decoration._id,
        title: decoration.title,
        description: decoration.description,
        price: decoration.price,
        imageUris: decoration.images,
        additionalFields: {
        Location: decoration.location,
        Theme: decoration.theme,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating decoration", error: error.message });
  }
});

/**
 * @swagger
 * /vendor/decoration/:
 *   get:
 *     summary: Get all decoration services
 *     tags: [Decoration]
 *     responses:
 *       200:
 *         description: List of all decoration services
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const decorations = await DecorationService.find();
    res.status(200).json(decorations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching decorations", error: error.message });
  }
});

/**
 * @swagger
 * /vendor/decoration/vendor/{vendorId}:
 *   get:
 *     summary: Get decoration services by vendor ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: List of decoration services by vendor
 *       500:
 *         description: Server error
 */
router.get("/vendor",authVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id
    const decorations = await DecorationService.find({ vendorId: vendorId });

    // Transform the data to match ServiceCard format
    const formattedDecorations = decorations.map((decoration) => ({
      id: decoration._id,
      title: decoration.title,
      description: decoration.description,
      price: decoration.price,
      imageUris: decoration.images,
      additionalFields: {
        Location: decoration.location,
        Theme: decoration.theme,
      },
    }));

    res.status(200).json(formattedDecorations);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching vendor decorations",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   get:
 *     summary: Get a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service
 *     responses:
 *       200:
 *         description: Decoration service found
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const decoration = await DecorationService.findById(req.params.id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }
    res.status(200).json(decoration);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching decoration", error: error.message });
  }
});

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   put:
 *     summary: Update a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update in the decoration service
 *     responses:
 *       200:
 *         description: Decoration service updated successfully
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
router.put("/:id",authVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id
    const decoration = await DecorationService.findById(req.params.id);
    console.log("DECORATION", req.body);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }
    if (decoration.vendorId.toString() !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this decoration" });
    }
    const updatedDecoration = await DecorationService.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({
        id: updatedDecoration._id,
        title: updatedDecoration.title,
        description: updatedDecoration.description,
        price: updatedDecoration.price,
        imageUris: updatedDecoration.images,
        additionalFields: {
        Location: updatedDecoration.location,
        Theme: updatedDecoration.theme,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating decoration", error: error.message });
  }
});

/**
 * @swagger
 * /vendor/decoration/{id}:
 *   delete:
 *     summary: Delete a decoration service by ID
 *     tags: [Decoration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the decoration service to delete
 *     responses:
 *       200:
 *         description: Decoration service deleted successfully
 *       404:
 *         description: Decoration service not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authVendor,async (req, res) => {
  try {
    const vendorId = req.vendor.id
    const decoration = await DecorationService.findById(req.params.id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }
    if (decoration.vendorId.toString() !== vendorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this decoration" });
    }
    await DecorationService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Decoration deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting decoration", error: error.message });
  }
});

module.exports = router;
