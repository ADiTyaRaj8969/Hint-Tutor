import os, json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class LLMError(Exception):
    """Raised for any provider failure; caught by the UI (FR-6.6)."""

def _client():
    """OpenRouter speaks the OpenAI wire format, so the openai client works unchanged."""
    from openai import OpenAI
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise LLMError("OPENROUTER_API_KEY missing. Copy .env.example to .env and add your key.")
    return OpenAI(api_key=key, base_url=os.getenv("OPENROUTER_BASE_URL", OPENROUTER_BASE_URL))

def complete(prompt: str, *, system: str = "", json_mode: bool = False,
             temperature: float = 0.2, max_tokens: int = 1200) -> str:
    """Send one prompt, return raw text. The only place a vendor SDK appears."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    # ling-3.1-flash rejects response_format (no structured-outputs support), so JSON
    # is requested in the prompt and parsed tolerantly by complete_json().
    extra = {}
    try:
        r = _client().chat.completions.create(
            model=os.getenv("LLM_MODEL", "inclusionai/ling-3.1-flash"),
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **extra,
        )
        return r.choices[0].message.content or ""
    except LLMError:
        raise                                    # already friendly, don't re-wrap
    except Exception as e:
        raise LLMError(f"Model call failed: {e}") from e


def complete_json(prompt: str, *, system: str = "", temperature: float = 0.2) -> dict:
    """complete() plus tolerant JSON parsing. Raises ValueError on unparseable output."""
    raw = complete(prompt, system=system, json_mode=True, temperature=temperature)
    text = raw.strip()
    if text.startswith("```"):                      # strip markdown fences
        text = text.split("```")[1].removeprefix("json").strip()
    start, end = text.find("{"), text.rfind("}")    # tolerate prose around the object
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object in model output: {raw[:200]}")
    return json.loads(text[start:end + 1])
