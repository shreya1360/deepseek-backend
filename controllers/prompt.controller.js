import OpenAI from "openai";
import { Prompt } from "../model/prompt.model.js";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_API_KEY,
});
console.log(openai.apiKey);

export const sendprompt = async (req, res) => {
    const { content } = req.body;
    const userId = req.userId;

  if (!content || content.trim() === "")
    return res.status(400).json({ errors: "prompt content is required" });
  try {
    // save user prompt
      const userPrompt = await Prompt.create({
        userId,
      role: "user",
      content,
    });
    // send to deepseek model via Openrouter
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 1000,
    });

    //   debug log to inspect full response
    console.log("ai completion response:", completion);

    if (
      !completion ||
      !completion.choices ||
      !completion.choices[0] ||
      !completion.choices[0].message
    ) {
      throw new Error("AI response is incomplete or invalid");
    }

    const aiContent = completion.choices[0].message.content;

    // save assistant prompt or save ai response
      const aiMessage = await Prompt.create({
        userId,
      role: "assistant",
      content: aiContent,
    });
    return res.status(200).json({ reply: aiContent });
  } catch (error) {
    console.log(
      "error in prompt:",
      error.response?.data || error.message || error
    );
    return res
      .status(500)
      .json({ error: "Something went wrong with the ai response" });
  }
};
