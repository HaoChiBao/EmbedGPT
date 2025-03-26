// THIS IS AN EXAMPLE TEMPLATE OF HOW TO IMPLEMENT A ROUTE

import express from 'express'

const router = express.Router()

// random post request
router.post('/example', async (req, res) => {
    try {

        const data = req.body
        console.log(data)

        res.status(200).json({status: 'cool beans'})

    } catch (e:any) {
        console.warn("Error", e)
        res.status(500).json({error: e.message || "server error"})
    }
})

router.get('/test', async (req, res) => {
    try {
        res.status(200).json({status: 'cool test'})
    } catch (e:any) {
        console.warn("Error", e)
        res.status(500).json({error: e.message || "server error"})
    }
})

export const example = router