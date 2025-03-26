import express from 'express'

import { queryChat } from '../services/openai'
import { markdownToHtml } from '../services/markdown'


const router = express.Router()

// random post request
router.post('/', async (req, res) => {
    try {

        const data = req.body

        const {chatHistory, userCredentials} = data
        console.log(`🐐 chat request from ${userCredentials.localId}`)

        if (!chatHistory || !userCredentials) {
            throw new Error("Invalid request")
        }
        const chat = await queryChat(data.chatHistory)

        const message = chat.choices[0].message.content
        const html = markdownToHtml(message)

        res.status(200).json({message,html})

    } catch (e:any) {
        console.warn("Error", e)
        res.status(500).json({error: e.message || "server error"})
    }
})

export const chat = router