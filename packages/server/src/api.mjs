/* eslint-disable consistent-return */
/* eslint-disable no-console */
import express from "express";
import validator from "validator";

import { extractDetails } from "@nqminds/vulnerability-analysis-tools/src/vulnerability-analysis.mjs";
import { streamMapCpeCveCwe } from "@nqminds/vulnerability-analysis-tools/src/show-cpe-history.mjs";
import multer from "multer";

const api = express.Router(); // eslint-disable-line new-cap
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function validateApiKeys(openaiKey) {
  const validatedKeys = {};
  let errorMessage;

  if (openaiKey) {
    if (
      !validator.isLength(openaiKey, { min: 10 }) ||
      !validator.isAlphanumeric(openaiKey, "en-US", { ignore: "-_" })
    ) {
      errorMessage = "Invalid OpenAI API Key format.";
    } else {
      validatedKeys.openaiApiKey = openaiKey;
    }
  }

  // Return the original key if empty or the validated key
  return {
    openaiApiKey: validatedKeys.openaiApiKey || openaiKey,
    errorMessage: errorMessage,
  };
}

function validateCycloneDX(jsonObject) {
  if (jsonObject.bomFormat !== "CycloneDX") {
    return false;
  }
  if (!jsonObject.components || !Array.isArray(jsonObject.components)) {
    return false;
  }
  return true;
}

// eslint-disable-next-line consistent-return
api.post("/vulnerability-analysis", upload.single("file"), async (req, res) => {
  if (!req.file) {
    console.log(`Api called with file`);
    return res.status(400).send("No file uploaded");
  }
  const file = req.file;
  const fileContent = file.buffer.toString("utf-8");

  let jsonObject;
  try {
    jsonObject = JSON.parse(fileContent);
  } catch (error) {
    return res.status(400).send("The file is not valid JSON");
  }

  if (!validateCycloneDX(jsonObject)) {
    return res.status(400).send("The file is not a valid CycloneDX JSON");
  }

  let openaiApiKey;
  try {
    const validatedKeys = validateApiKeys(req.body.openaiApiKey);
    if (validatedKeys.errorMessage) {
      return res.status(400).send({ error: validatedKeys.errorMessage });
    }
    openaiApiKey = validatedKeys.openaiApiKey;
  } catch (error) {
    console.error(error);
    // Send an error response back to the client
    return res.status(400).send({ error: error.message });
  }

  const apiKeys = {
    openai: openaiApiKey,
  };

  try {
    const data = await extractDetails(jsonObject, apiKeys);
    res.send(data);
  } catch (error) {
    console.error(`Vulnerability analysis failed: ${error.message}`);
    // Most failures here come from the CVE API being slow or unreachable
    res
      .status(502)
      .send({ error: `Vulnerability analysis failed: ${error.message}` });
  }
});

// Body parser middleware to handle JSON data
api.use(express.json());

api.get("/historical-cpe-analysis/:cpe", async (req, res) => {
  const { cpe } = req.params;
  const openaiApiKey = req.query.openaiApiKey;
  if (!cpe || typeof cpe !== "string") {
    return res
      .status(400)
      .send({ error: "CPE is required and must be a string." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const mapStream = streamMapCpeCveCwe(cpe, openaiApiKey);

  // Listen for client disconnect
  req.on("close", () => {
    mapStream.return();
    res.end();
  });

  try {
    for await (const entry of mapStream) {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }
    res.end();
  } catch (error) {
    console.error("Streaming error:", error);
    if (!res.headersSent) {
      return res.status(500).send({ error: "Internal server error" });
    }
    // The stream has started, so headers cannot change; close it with the
    // "done" event the page already listens for
    res.write(
      `event: done\ndata: ${JSON.stringify({ error: error.message })}\n\n`
    );
    res.end();
  }
});

// Error handling middleware for Multer
api.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send("File upload error");
  } else if (err) {
    res.status(400).send(err.message);
  } else {
    next();
  }
});

export default api;
