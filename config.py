"""
Configuration for AI-Driven Cyclone & Coastal Disaster Early Warning System
IBM Watsonx.ai credentials and model settings.

All secrets are read from environment variables first, then fall back to the
values below for local development convenience.

For production, set these environment variables on your hosting provider:
  IBM_API_KEY       — your IBM Cloud IAM API key
  IBM_PROJECT_ID    — your watsonx.ai project UUID v4
  IBM_WML_URL       — (optional) region URL, defaults to eu-de
  IBM_MODEL_ID      — (optional) model ID, defaults to ibm/granite-4-h-small
  ALLOWED_ORIGINS   — (optional) extra space-separated CORS origins
"""

import os

# ── IBM credentials ─────────────────────────────────────
# Read from environment variable; fall back to hardcoded value for local dev.
# In production, set IBM_API_KEY on your hosting platform — do NOT commit real
# API keys to a public repository.
IBM_API_KEY     = os.environ.get("IBM_API_KEY",     "_BwoJt8Yetr__evQ1jxMSXBI1IT6i0QhZCOjll1f8aHM")
IBM_PROJECT_ID  = os.environ.get("IBM_PROJECT_ID",  "6e881b4d-c78d-4581-9880-7c89408fe65f")
IBM_WML_URL     = os.environ.get("IBM_WML_URL",     "https://eu-de.ml.cloud.ibm.com")
IBM_MODEL_ID    = os.environ.get("IBM_MODEL_ID",    "ibm/granite-4-h-small")

# ── Derived URLs ─────────────────────────────────────────
GENERATION_API_URL = f"{IBM_WML_URL}/ml/v1/text/generation?version=2023-05-29"
IAM_TOKEN_URL      = "https://iam.cloud.ibm.com/identity/token"
