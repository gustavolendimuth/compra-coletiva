#!/usr/bin/env python3
"""Convert podcast HTML script to MP3 audio using edge-tts (Microsoft TTS)."""

import asyncio
import re
from pathlib import Path
from bs4 import BeautifulSoup

HTML_FILE = "/root/.claude/uploads/6357dfa5-15e0-45bd-ad48-dad2904b8310/13801cd8-podcast_tiradentes_sjdr.html"
OUTPUT_FILE = "/home/user/compra-coletiva/podcast_tiradentes_sjdr.mp3"

# Francisca is a natural-sounding pt-BR female voice
VOICE = "pt-BR-FranciscaNeural"
RATE = "+0%"   # normal speed
PITCH = "+0Hz"


def extract_podcast_text(html_path: str) -> str:
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    parts: list[str] = []

    # Process each block in document order
    for bloco in soup.select(".bloco"):
        # Section label (small) + title
        h2 = bloco.find("h2")
        if h2:
            small = h2.find("small")
            if small:
                small.extract()
            title = h2.get_text(separator=" ", strip=True)
            parts.append(f"\n{title}.\n")

        # Body paragraphs and highlights
        for el in bloco.select(".texto-podcast p, .destaque"):
            text = el.get_text(separator=" ", strip=True)
            if text:
                parts.append(text)

        # Bullet list items
        for li in bloco.select(".lista-turismo li"):
            strong = li.find("strong")
            title_text = strong.get_text(strip=True) if strong else ""
            if strong:
                strong.extract()
            body = li.get_text(separator=" ", strip=True)
            if title_text and body:
                parts.append(f"{title_text}: {body}")
            elif title_text:
                parts.append(title_text)
            elif body:
                parts.append(body)

    # Closing section
    encerramento = soup.select_one(".encerramento")
    if encerramento:
        text = encerramento.get_text(separator=" ", strip=True)
        # Strip the sources/credits line
        text = re.sub(r"Script produzido.*", "", text).strip()
        if text:
            parts.append(f"\n{text}")

    return "\n\n".join(p.strip() for p in parts if p.strip())


def convert_to_audio_gtts(text: str, output_path: str) -> None:
    from gtts import gTTS

    print(f"Characters: {len(text)}")
    print(f"Output: {output_path}\n")

    tts = gTTS(text=text, lang="pt", tld="com.br", slow=False)
    tts.save(output_path)
    size_mb = Path(output_path).stat().st_size / 1_048_576
    print(f"Done! File size: {size_mb:.1f} MB")


async def convert_to_audio_edge(text: str, output_path: str) -> None:
    import ssl
    import aiohttp
    import edge_tts

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    connector = aiohttp.TCPConnector(ssl=ssl_ctx)

    print(f"Voice: {VOICE}")
    print(f"Characters: {len(text)}")
    print(f"Output: {output_path}\n")

    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    # Patch connector into the session used internally
    communicate._session = aiohttp.ClientSession(connector=connector)
    await communicate.save(output_path)
    size_mb = Path(output_path).stat().st_size / 1_048_576
    print(f"Done! File size: {size_mb:.1f} MB")


async def main() -> None:
    print("Extracting text from HTML...")
    text = extract_podcast_text(HTML_FILE)

    preview = text[:400].replace("\n", " ")
    print(f"Preview: {preview}...\n")

    # Try edge-tts first (better quality), fall back to gTTS
    print("Trying edge-tts (higher quality)...")
    try:
        await convert_to_audio_edge(text, OUTPUT_FILE)
    except Exception as e:
        print(f"edge-tts failed ({e.__class__.__name__}), falling back to gTTS...")
        convert_to_audio_gtts(text, OUTPUT_FILE)


if __name__ == "__main__":
    asyncio.run(main())
