const express = require('express');
const router = express.Router();
const Hall = require('../../models/Hall');
const authVendor = require('../../middleware/authVendor');
const { sendNotification } = require('../../utils/notification');

/**
 * @swagger
 * /vendor/hall/create:
 *   post:
 *     summary: Create a new hall
 *     tags: [Halls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - name
 *               - type
 *               - price
 *             properties:
 *               vendorId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               price_per_person:
 *                 type: number
 *               rating:
 *                 type: number
 *               reviews:
 *                 type: number
 *               capacity:
 *                 type: number
 *               timing:
 *                 type: string
 *               image:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               video:
 *                 type: string
 *               hasParking:
 *                 type: boolean
 *               indoor:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Hall created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/create',authVendor, async (req, res) => {
    try {
        const {title,description,location,price,capacity,images,menus} = req.body;        
        const vendorId = req.vendor.id // Get vendorId from auth token

        // Validate required fields
        if (!title || !description || !location || !price || !capacity || !images) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const hall = await Hall.create({
           title,
           description,
           location,
           price,
           capacity,
           images,
           vendorId,
           menus
        });
        await sendNotification(vendorId, "Vendor", "New Hall Added", "A new hall has been added to your account", "service_added");

        res.status(201).json({
            id: hall._id,
            title: hall.title,
            description: hall.description,
            price: hall.price,
            imageUris: hall.images || [hall.image],
            additionalFields: {
                Location: hall.location,
                Capacity: hall.capacity,
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /vendor/hall/:
 *   get:
 *     summary: Get all halls
 *     tags: [Halls]
 *     responses:
 *       200:
 *         description: List of all halls
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const halls = await Hall.find();
        res.status(200).json(halls);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}); 

/**
 * @swagger
 * /vendor/hall/vendor/{vendorId}:
 *   get:
 *     summary: Get all halls by vendor ID
 *     tags: [Halls]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vendor
 *     responses:
 *       200:
 *         description: List of halls by vendor
 *       500:
 *         description: Server error
 */
router.get('/vendor',authVendor, async (req, res) => {
    try {
      const vendorId = req.vendor.id
        const halls = await Hall.find({ vendorId });
        
        // Transform the data to match ServiceCard format
        const formattedHalls = halls.map(hall => ({
            id: hall._id,
            title: hall.title,
            description: hall.description,
            price: hall.price,
            imageUris: hall.images || [hall.image],
            menus: hall.menus,
            additionalFields: {
                Location: hall.location,
                Capacity: hall.capacity,
            }
        }));

        res.status(200).json(formattedHalls);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /vendor/hall/{id}:
 *   get:
 *     summary: Get a hall by ID
 *     tags: [Halls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the hall
 *     responses:
 *       200:
 *         description: Hall found
 *       404:
 *         description: Hall not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hall = await Hall.findById(id);
        if (!hall) {
            return res.status(404).json({ message: 'Hall not found' });
        }
        res.status(200).json(hall);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /vendor/hall/{id}:
 *   put:
 *     summary: Update a hall by ID
 *     tags: [Halls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the hall to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update in the hall
 *     responses:
 *       200:
 *         description: Hall updated successfully
 *       404:
 *         description: Hall not found
 *       500:
 *         description: Server error
 */
router.put('/:id',authVendor, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body)
       const vendorId = req.vendor.id
        const {title,description,location,price,capacity,images,menus} = req.body;
        const existingHall = await Hall.findById(id)
        if (!existingHall) {
            return res.status(404).json({ message: 'Hall not found' })
        }

        // Check if the car belongs to the vendor
        if (existingHall.vendorId.toString() !== vendorId) {
            return res.status(403).json({ message: 'Not authorized to update this hall' })
        }

        const hall = await Hall.findByIdAndUpdate(id, {title,description,location,price,capacity,images,menus}, { new: true });

        res.status(200).json({
            id: hall._id,
            title: hall.title,
            description: hall.description,
            price: hall.price,
            imageUris: hall.images || [hall.image],
            menus: hall.menus,
            additionalFields: {
                Location: hall.location,
                Capacity: hall.capacity,
            }
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

/**
 * @swagger
 * /vendor/hall/{id}:
 *   delete:
 *     summary: Delete a hall by ID
 *     tags: [Halls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the hall to delete
 *     responses:
 *       200:
 *         description: Hall deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/:id',authVendor, async (req, res) => {
    try {
        const vendorId = req.vendor.id
        const { id } = req.params;
        const existingHall = await Hall.findById(id)
        if (!existingHall) {
            return res.status(404).json({ message: 'Hall not found' })
        }
        if (existingHall.vendorId.toString() !== vendorId) {
            return res.status(403).json({ message: 'Not authorized to delete this hall' })
        }
        await Hall.findByIdAndDelete(id);
        res.status(200).json({ message: 'Hall deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
