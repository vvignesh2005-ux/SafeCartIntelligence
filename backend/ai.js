const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Primary model + fast backup model to prevent 503 high-demand failures
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']

async function callGeminiWithFallback(prompt) {
  let lastError
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt })
      if (response && response.text) {
        return response.text
      }
    } catch (err) {
      lastError = err
      console.warn(`Model ${model} failed (${err.message}), trying backup...`)
    }
  }
  throw lastError
}

function getEmergencyPlaybook(platform, category) {
  return [
    `Capture screenshots of your ${platform} order ID, payment receipt, and chat logs.`,
    `Open ${platform} Help Center and file an official ${category} dispute ticket.`,
    `Escalate to the ${platform} Grievance Officer email if unresolved after 48 hours.`,
    `Submit your evidence to your bank or National Consumer Helpline for a chargeback.`
  ]
}

async function generateSolutionSteps(problemText, platform, category) {
  const prompt = `A customer has this consumer complaint issue:
Problem: "${problemText}"
Platform: ${platform}
Category: ${category}

Give exactly 4 short, practical steps the customer should follow to resolve this issue. Keep each step under 15 words. Respond with ONLY the 4 steps, one per line, no extra text, no numbering.`

  try {
    const text = await callGeminiWithFallback(prompt)
    const steps = text
      .split('\n')
      .map((line) => line.replace(/^[\d\-\*\.\)\s]+/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 4)

    return steps.length === 4 ? steps : getEmergencyPlaybook(platform, category)
  } catch (err) {
    console.error('All Gemini models busy, saving structured fallback playbook:', err.message)
    return getEmergencyPlaybook(platform, category)
  }
}

async function generateComplaintText(orderId, platform, issue) {
  const prompt = `Write a formal, professional consumer complaint letter for this situation:
Order ID: ${orderId}
Platform: ${platform}
Issue: ${issue}

Include a greeting, the complaint details, a request for resolution, and a closing. Keep it under 150 words. Respond with ONLY the letter text, no extra commentary.`

  try {
    return await callGeminiWithFallback(prompt)
  } catch (err) {
    return `Dear ${platform} Support Team,\n\nI am writing regarding Order ID ${orderId} concerning: ${issue}. Despite following standard procedures, this remains unresolved. Please process a full refund or replacement within 48 hours, or I will escalate this matter to my payment provider and consumer protection authorities.\n\nSincerely,\nCustomer`
  }
}

module.exports = { generateSolutionSteps, generateComplaintText }