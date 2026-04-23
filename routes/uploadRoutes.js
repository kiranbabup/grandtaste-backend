import express from 'express';
import { upload } from '../utils/cloudinary.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Using protect and admin middleware to secure the upload route
router.post('/', protect, admin, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        const urls = req.files.map((file) => file.path);
        res.status(200).json({
            message: 'Images uploaded successfully',
            urls: urls,
        });
    } catch (error) {
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

export default router;
