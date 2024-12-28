import OpenAI from "openai";
import config from "../config/env.js";

const client = new OpenAI({
    apiKey: config.CHATGPT_API_KEY,
});

const openAIService = async (message) => {
    try{
        const response = await client.chat.completions.create({
            messages: [{ role: 'system', content: 'Comportarte como un veterinario, deberás de resolver las preguntas lo más simple posible. Responde en texto plano, como si fuera una conversación por WhatsApp, no saludes, no generas conversaciones, solo respondes con la pregunta del usuario.'}, { role: 'user', content: message }], model: 'gpt-4o'
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error(error);
    }
}

export default openAIService;