import OpenAI from "openai";
import config from "../config/env.js";

const client = new OpenAI({
    apiKey: config.CHATGPT_API_KEY,
});

const openAIService = async (message) => {
    try{
        const response = await client.chat.completions.create({
            messages: [{ role: 'system', content: 'promp'}, { role: 'user', content: message }], model: 'gpt-4o'
        })
    } catch (error) {
        console.error(error);
    }
}
