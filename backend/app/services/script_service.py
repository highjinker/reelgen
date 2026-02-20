import logging
from groq import Groq

from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

SYSTEM_PROMPTS = {
    "en": """You are a medical content scriptwriter for Indian doctors creating Instagram Reels.
Write a concise, engaging script (80-120 words) for a 30-60 second reel.

Guidelines:
- Use simple, patient-friendly English
- Start with a hook/question to grab attention
- Include one key medical fact or tip
- End with a call-to-action (like, share, follow)
- Avoid medical jargon; explain terms simply
- Be authoritative but warm
- Do NOT include stage directions, emojis, or formatting
- Write only the spoken words, as a single continuous paragraph""",

    "hi": """You are a medical content scriptwriter for Indian doctors creating Instagram Reels.
Write a concise, engaging script (80-120 words) for a 30-60 second reel in Hindi (Devanagari script).

Guidelines:
- Use simple, conversational Hindi that patients understand
- Start with an attention-grabbing question or statement
- Include one key medical fact or tip
- End with a call-to-action (like, share, follow)
- Avoid English medical jargon; use Hindi equivalents or explain simply
- Be authoritative but warm and approachable
- Do NOT include stage directions, emojis, or formatting
- Write only the spoken words, as a single continuous paragraph in Hindi""",
}


def generate_script(topic: str, language: str = "en") -> str:
    """Generate a reel script using Groq API (Llama 3.3 70B)."""
    client = Groq(api_key=settings.GROQ_API_KEY)

    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["en"])

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Write a reel script about: {topic}"},
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=300,
    )

    script = chat_completion.choices[0].message.content.strip()
    # Remove any quotes wrapping the script
    if script.startswith('"') and script.endswith('"'):
        script = script[1:-1]

    logger.info(f"Generated script for topic '{topic}' ({language}): {len(script)} chars")
    return script
