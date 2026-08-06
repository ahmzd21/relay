import asyncio
import json
import logging
import os
import aiohttp

from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, JobProcess, stt
from livekit.plugins import deepgram, elevenlabs
import deepl

logger = logging.getLogger("translation-agent")

# Initialize DeepL Translator
deepl_key = os.environ.get("DEEPL_API_KEY", "")
translator = deepl.Translator(deepl_key) if deepl_key else None

# Initialize Gemini & ElevenLabs Keys
gemini_key = os.environ.get("GEMINI_API_KEY", "")
eleven_key = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY", "")

LANG_MAP = {
    "en": "English",
    "es": "Spanish",
    "de": "German",
    "ar": "Arabic",
    "ur": "Urdu",
}

def map_deepl_lang(lang_code: str) -> str:
    """Map frontend language codes to DeepL supported Target Language codes."""
    code = lang_code.upper().strip()
    if code == "EN": return "EN-US"
    if code == "PT": return "PT-PT"
    return code

def map_deepgram_lang(lang_code: str) -> str:
    """Map language codes for Deepgram STT."""
    code = lang_code.lower().strip()
    if code in ["en", "es", "de", "ar", "ur"]:
        return code
    return "en"

async def translate_text(text: str, source_lang: str, target_lang: str, session: aiohttp.ClientSession | None = None) -> str:
    """Translate text from source_lang to target_lang using DeepL with Gemini fallback."""
    if not text or not text.strip():
        return text
    s_code = source_lang.lower().strip()
    t_code = target_lang.lower().strip()
    if s_code == t_code or t_code == "none":
        return text

    # 1. Try DeepL if target is supported by DeepL (English, Spanish, German, Arabic)
    deepl_target = map_deepl_lang(t_code)
    if deepl_target not in ["UR"] and translator:
        try:
            result = translator.translate_text(text, target_lang=deepl_target)
            if result and result.text:
                return result.text
        except Exception as e:
            logger.warning(f"DeepL translation fallback for {t_code}: {e}")

    # 2. Use Gemini API for Urdu or fallback
    if gemini_key:
        try:
            target_name = LANG_MAP.get(t_code, t_code)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            prompt = f"Translate the following spoken conversation into {target_name}. Return ONLY the direct natural translation without quotes or commentary:\n\n{text}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1}
            }
            
            if session and not session.closed:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    data = await resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                async with aiohttp.ClientSession() as s:
                    async with s.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                        data = await resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            logger.error(f"Gemini translation error for {t_code}: {e}")

    return text

async def prewarm(proc: JobProcess):
    pass

tts_engine = elevenlabs.TTS(model="eleven_multilingual_v2", api_key=eleven_key) if eleven_key else elevenlabs.TTS(model="eleven_multilingual_v2")

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Shared state for the room session
    audio_sources = {}
    audio_locks = {}
    http_session = aiohttp.ClientSession()

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            if publication and publication.name and publication.name.startswith("translation_"):
                logger.info(f"Ignoring translation track: {publication.name}")
                return
            logger.info(f"Subscribed to live microphone track from {participant.identity}")
            asyncio.create_task(process_track(ctx.room, participant, track, audio_sources, audio_locks, http_session))

    @ctx.room.on("data_received")
    def on_data_received(dp: rtc.DataPacket):
        if dp.topic == "simulate_stt":
            try:
                payload = json.loads(dp.data.decode("utf-8"))
                text = payload.get("text")
                speaker_id = dp.participant.identity
                speaker_name = dp.participant.name or speaker_id
                
                spoken_lang = "en"
                if dp.participant.metadata:
                    meta = json.loads(dp.participant.metadata)
                    if "preferences" in meta and "spoken" in meta["preferences"]:
                        spoken_lang = meta["preferences"]["spoken"]
                        
                import time
                logger.info(f"Simulated STT ({speaker_id}): {text}")
                asyncio.create_task(broadcast_subtitles_and_audio(ctx.room, speaker_id, speaker_name, spoken_lang, text, time.time(), audio_sources, audio_locks, http_session))
            except Exception as e:
                logger.error(f"Error parsing simulate_stt: {e}")

async def process_track(room: rtc.Room, participant: rtc.RemoteParticipant, track: rtc.AudioTrack, audio_sources: dict, audio_locks: dict, session: aiohttp.ClientSession):
    # 1. Parse participant's spoken language from their metadata
    spoken_lang = "en"
    try:
        if participant.metadata:
            meta = json.loads(participant.metadata)
            if "preferences" in meta and "spoken" in meta["preferences"]:
                spoken_lang = meta["preferences"]["spoken"]
    except Exception as e:
        logger.error(f"Error parsing metadata for {participant.identity}: {e}")

    dg_lang = map_deepgram_lang(spoken_lang)
    logger.info(f"Starting real-time STT for {participant.identity} with spoken language {spoken_lang} (Deepgram lang: {dg_lang})")
    
    # 2. Initialize Deepgram STT stream specifically for their language
    dg_stt = deepgram.STT(language=dg_lang)
    audio_stream = rtc.AudioStream(track)
    stt_stream = dg_stt.stream()

    # 3. Forward incoming WebRTC audio frames to Deepgram
    async def forward_audio():
        try:
            async for frame_event in audio_stream:
                stt_stream.push_frame(frame_event.frame)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in forward_audio for {participant.identity}: {e}")
        finally:
            await stt_stream.aclose()
            
    forward_task = asyncio.create_task(forward_audio())

    # 4. Listen for transcription results from Deepgram
    try:
        async for event in stt_stream:
            if event.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                if not event.alternatives or not event.alternatives[0].text:
                    continue
                text = event.alternatives[0].text.strip()
                if not text:
                    continue
                    
                speaker_name = participant.name or participant.identity
                logger.info(f"Live STT Transcript ({participant.identity}): {text}")
                await broadcast_subtitles_and_audio(room, participant.identity, speaker_name, spoken_lang, text, event.alternatives[0].start_time, audio_sources, audio_locks, session)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Error in STT stream processing for {participant.identity}: {e}")
    finally:
        forward_task.cancel()
        await audio_stream.aclose()

async def stream_tts(text: str, audio_lang: str, speaker_identity: str, room: rtc.Room, audio_sources: dict, audio_locks: dict):
    if not text or not text.strip():
        return
    source_key = f"{audio_lang}_{speaker_identity}"
    if source_key not in audio_locks:
        audio_locks[source_key] = asyncio.Lock()

    async with audio_locks[source_key]:
        try:
            logger.info(f"Synthesizing TTS for {source_key}: '{text}'")
            async for event in tts_engine.synthesize(text):
                if hasattr(event, "frame") and event.frame:
                    if source_key not in audio_sources:
                        logger.info(f"Creating new audio track for {audio_lang} from {speaker_identity} (rate={event.frame.sample_rate}, channels={event.frame.num_channels})")
                        source = rtc.AudioSource(sample_rate=event.frame.sample_rate, num_channels=event.frame.num_channels)
                        track = rtc.LocalAudioTrack.create_audio_track(f"translation_{audio_lang}_{speaker_identity}", source)
                        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
                        await room.local_participant.publish_track(track, options)
                        audio_sources[source_key] = source
                        
                    await audio_sources[source_key].capture_frame(event.frame)
            logger.info(f"Completed TTS stream for {source_key}")
        except Exception as e:
            logger.error(f"TTS synthesis error for {source_key}: {e}")

async def broadcast_subtitles_and_audio(room: rtc.Room, speaker_id: str, speaker_name: str, spoken_lang: str, text: str, timestamp: float, audio_sources: dict, audio_locks: dict, session: aiohttp.ClientSession):
    # Broadcast to all OTHER participants in their preferred subtitle and audio language
    for p_id, target_participant in room.remote_participants.items():
        if p_id == speaker_id:
            continue
        
        try:
            if not target_participant.metadata:
                continue
            meta = json.loads(target_participant.metadata)
            prefs = meta.get("preferences", {})
            
            subtitle_lang = prefs.get("subtitle", "none")
            audio_lang = prefs.get("audio", "none")
            
            # 1. Subtitles
            if subtitle_lang != "none":
                translated_sub = await translate_text(text, spoken_lang, subtitle_lang, session)
                payload = json.dumps({
                    "type": "subtitle",
                    "speakerIdentity": speaker_id,
                    "speakerName": speaker_name,
                    "text": translated_sub,
                    "language": subtitle_lang,
                    "timestamp": timestamp
                }).encode('utf-8')
                
                await room.local_participant.publish_data(
                    payload, 
                    reliable=True, 
                    destination_identities=[p_id],
                    topic="subtitle"
                )
                logger.info(f"Dispatched {subtitle_lang} subtitle to {target_participant.identity}")
            
            # 2. Audio TTS Dubbing
            if audio_lang != "none" and audio_lang != spoken_lang:
                translated_audio_text = await translate_text(text, spoken_lang, audio_lang, session)
                asyncio.create_task(stream_tts(translated_audio_text, audio_lang, speaker_id, room, audio_sources, audio_locks))
                logger.info(f"Queued TTS dubbing for {audio_lang} to {target_participant.identity}")
                
        except Exception as e:
            logger.error(f"Error processing broadcast for participant {p_id}: {e}")
