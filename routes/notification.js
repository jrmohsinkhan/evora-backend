const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')

router.get('/', async (req, res) => {
    try{
        const notifications = await Notification.find()
        res.status(200).json(notifications)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/:id', async (req, res) => {
    try{
        const notification = await Notification.findById(req.params.id)
        res.status(200).json(notification)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/customer/:customerId', async (req, res) => {
    try{
        const notifications = await Notification.find({ recipient: req.params.customerId })
        res.status(200).json(notifications)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.get('/vendor/:vendorId', async (req, res) => {
    try{
        const notifications = await Notification.find({ recipient: req.params.vendorId })
        res.status(200).json(notifications)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.put('/:id', async (req, res) => {
    try{
        const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json(notification)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

router.delete('/:id', async (req, res) => {
    try{
        const notification = await Notification.findByIdAndDelete(req.params.id)
        res.status(200).json(notification)
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
})

module.exports = router