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

function validateApiKeys(nistKey, openaiKey) {
  const validatedKeys = {};
  let errorMessage;

  if (nistKey) {
    if (
      !validator.isLength(nistKey, { min: 10 }) ||
      !validator.isAlphanumeric(nistKey, "en-US", { ignore: "-_" })
    ) {
      errorMessage = "Invalid NIST API Key format.";
    } else {
      validatedKeys.nistApiKey = nistKey;
    }
  }

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
    nistApiKey: validatedKeys.nistApiKey || nistKey,
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
    return res.status(400).send("No file uploaded");
  }
  const file = req.file;
  const fileContent = file.buffer.toString("utf-8");
  const jsonObject = JSON.parse(fileContent);

  if (!validateCycloneDX(jsonObject)) {
    return res.status(400).send("The file is not a valid CycloneDX JSON");
  }

  let nistApiKey;
  let openaiApiKey;
  try {
    const validatedKeys = validateApiKeys(
      req.body.nistApiKey,
      req.body.openaiApiKey
    );
    if (validatedKeys.errorMessage) {
      return res.status(400).send({ error: validatedKeys.errorMessage });
    }
    nistApiKey = validatedKeys.nistApiKey;
    openaiApiKey = validatedKeys.openaiApiKey;
  } catch (error) {
    console.error(error);
    // Send an error response back to the client
    res.status(400).send({ error: error.message });
  }

  const apiKeys = {
    nist: nistApiKey,
    openai: openaiApiKey,
  };

  const data = await extractDetails(jsonObject, apiKeys);
  res.send(data);
});

// Body parser middleware to handle JSON data
api.use(express.json());

api.get("/historical-cpe-analysis/:cpe", async (req, res) => {
  const { cpe } = req.params;
  const apiKey = req.query.nistApiKey;
  if (!cpe || typeof cpe !== "string") {
    return res
      .status(400)
      .send({ error: "CPE is required and must be a string." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const mapStream = streamMapCpeCveCwe(cpe, apiKey);
  for await (const entry of mapStream) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }
  res.end();
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
