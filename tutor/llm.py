import os, json
from dotenv import load_dotenv

load_dotenv()

class LLMError(Exception):
    """Raised for any provider failure; caught by the UI (FR-6.6)."""

def complete(prompt: str, *, system: str = "", json_mode: bool = False,
             temperature: float = 0.2, max_tokens: int = 1200) -> str:
    """Send one prompt, return raw text. The only place a vendor SDK appears."""
    provider = os.getenv("LLM_PROVIDER", "gemini")
    try:
        if provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
            model = genai.GenerativeModel(
                os.getenv("LLM_MODEL", "gemini-2.0-flash"),
                system_instruction=system or None,
            )
            cfg = {"temperature": temperature, "max_output_tokens": max_tokens}
            if json_mode:
                cfg["response_mime_type"] = "application/json"
            return model.generate_content(prompt, generation_config=cfg).text
        raise LLMError(f"Unknown provider: {provider}")
    except LLMError:
        raise
    except KeyError:
        raise LLMError("API key missing. Copy .env.example to .env and add your key.")
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
