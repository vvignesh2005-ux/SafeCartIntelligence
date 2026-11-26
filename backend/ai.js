const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = 'gemini-flash-latest'

async function generateSolutionSteps(problemText, platform, category) {
  const prompt = `A customer has this consumer complaint issue:
Problem: "${problemText}"
Platform: ${platform}
Category: ${category}

Give exactly 4 short, practical steps the customer should follow to resolve this issue. Keep each step under 15 words. Respond with ONLY the 4 steps, one per line, no extra text, no numbering.`

  const response = await ai.models.generateContent({ model: MODEL, contents: prompt })

  return response.text
    .split('\n')
    .map((line) => line.replace(/^[\d\-\*\.\)\s]+/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 4)
}

async function generateComplaintText(orderId, platform, issue) {
  const prompt = `Write a formal, professional consumer complaint letter for this situation:
Order ID: ${orderId}
Platform: ${platform}
Issue: ${issue}

Include a greeting, the complaint details, a request for resolution, and a closing. Keep it under 150 words. Respond with ONLY the letter text, no extra commentary.`

  const response = await ai.models.generateContent({ model: MODEL, contents: prompt })
  return response.text
}

module.exports = { generateSolutionSteps, generateComplaintText }