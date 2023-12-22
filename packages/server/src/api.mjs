/* eslint-disable no-console */
import express from "express";
import validator from "validator";

import { extractDetails } from "@nqminds/vulnerability-analysis-tools/src/vulnerability-analysis.mjs";
// import { mapCpeCveCwe } from "@nqminds/vulnerability-analysis-tools/src/show-cpe-history.mjs";
import multer from "multer";

import fs from "fs/promises"; // Using fs promises for async/await
import path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
api.post("/historical-cpe-analysis", async (req, res) => {
  // Log the entire request body
  console.log("Request Body:", req.body);

  // Check if the body is undefined
  if (!req.body) {
    console.error("Request body is undefined.");
    return res.status(400).send({ error: "Request body is missing." });
  }

  const { cpe } = req.body;

  // Validate input
  if (!cpe || typeof cpe !== "string") {
    return res
      .status(400)
      .send({ error: "CPE is required and must be a string." });
  }

  try {
    // Call historical CPE analysis function
    // const analysisResult = await mapCpeCveCwe(cpe);

    // Define the path to the file
    const filePath = path.resolve(__dirname, "cpeCveMap2.json");

    // Read the data from the file
    const dataString = await fs.readFile(filePath, "utf8");
    const analysisResult = JSON.parse(dataString);

    return res.status(200).send(analysisResult);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Internal server error" });
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
