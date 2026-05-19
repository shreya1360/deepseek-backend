import axios from "axios";
import { Prompt } from "../model/prompt.model.js";

const createOpenRouterRequest = (model, content, openRouterApiKey) =>
  axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [{ role: "user", content }],
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
        "X-Title": "deepseek-ai",
      },
      timeout: 30000,
    }
  );

export const sendprompt = async (req, res) => {
  const { content } = req.body;
  const userId = req.userId;
  const openRouterApiKey =
    process.env.OPENROUTER_API_KEY || process.env.OPEN_API_KEY;
  const openRouterModel =
    process.env.OPENROUTER_MODEL || "openrouter/free";
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || "openrouter/free";

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Prompt content is required" });
  }

  if (!openRouterApiKey) {
    return res.status(500).json({
      error: "OpenRouter API key is missing in backend environment variables",
    });
  }

  try {
    // Save the user's message to the database
    await Prompt.create({
      userId,
      role: "user",
      content,
    });

    // Send prompt to OpenRouter
    let response;

    try {
      response = await createOpenRouterRequest(
        openRouterModel,
        content,
        openRouterApiKey
      );
    } catch (error) {
      const providerMessage = error.response?.data?.error?.message || "";
      const shouldFallback =
        fallbackModel &&
        fallbackModel !== openRouterModel &&
        error.response?.status === 404 &&
        providerMessage.toLowerCase().includes("no endpoints found");

      if (!shouldFallback) {
        throw error;
      }

      console.warn(
        `Primary model ${openRouterModel} unavailable. Retrying with ${fallbackModel}.`
      );

      response = await createOpenRouterRequest(
        fallbackModel,
        content,
        openRouterApiKey
      );
    }

    // Extract AI reply
    const aiContent = response.data?.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("Unexpected OpenRouter response:", response.data);
      return res.status(502).json({
        error: "OpenRouter returned an unexpected response format",
      });
    }

    // Save the assistant's response
    await Prompt.create({
      userId,
      role: "assistant",
      content: aiContent,
    });

    // Return the reply
    return res.status(200).json({ reply: aiContent });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorDetails = error.response?.data || { message: error.message };

    console.error("Error from OpenRouter:", errorDetails);

    return res
      .status(statusCode >= 400 && statusCode < 600 ? statusCode : 500)
      .json({
        error: "Something went wrong with the AI response",
        details: errorDetails,
      });
  }
};
